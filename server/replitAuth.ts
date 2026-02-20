// Reference: blueprint:javascript_log_in_with_replit
import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

const oidcClientId = process.env.REPL_ID ?? process.env.OIDC_CLIENT_ID;

const getOidcConfig = memoize(
  async () => {
    const clientId = process.env.REPL_ID ?? process.env.OIDC_CLIENT_ID;
    if (!clientId) {
      throw new Error("Missing OIDC client id: set REPL_ID (or OIDC_CLIENT_ID) in environment");
    }
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      oidcClientId!,
    );
  },
  { maxAge: 3600 * 1000 },
);

function shouldUseSecureCookies() {
  return process.env.NODE_ENV === "production";
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: shouldUseSecureCookies(),
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export function getAuthConfigStatus() {
  if (oidcClientId) {
    return { enabled: true };
  }

  return {
    enabled: false,
    message:
      "Authentication is not configured yet. Set REPL_ID or OIDC_CLIENT_ID and SESSION_SECRET to enable login.",
  };
}

export async function setupAuth(app: Express) {
  const authStatus = getAuthConfigStatus();

  if (!authStatus.enabled) {
    console.warn("OIDC disabled: set REPL_ID or OIDC_CLIENT_ID to enable authentication");

    app.get("/api/login", (_req, res) => {
      res.redirect("/login?auth=disabled");
    });

    app.get("/api/callback", (_req, res) => {
      res.redirect("/login?auth=disabled");
    });

    app.get("/api/logout", (_req, res) => {
      res.redirect("/");
    });

    return;
  }

  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback,
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  const registeredStrategies = new Set<string>();

  const ensureStrategy = (host: string, protocol: string) => {
    const strategyName = `replitauth:${host}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `${protocol}://${host}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }

    return strategyName;
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    const host = req.get("host") ?? req.hostname;
    const protocol = req.protocol;
    const strategyName = ensureStrategy(host, protocol);

    const method = req.query.method;
    const prompt = method === "password" ? "login" : "login consent";

    passport.authenticate(strategyName, {
      prompt,
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    const host = req.get("host") ?? req.hostname;
    const protocol = req.protocol;
    const strategyName = ensureStrategy(host, protocol);

    passport.authenticate(strategyName, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      const host = req.get("host") ?? req.hostname;
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: oidcClientId!,
          post_logout_redirect_uri: `${req.protocol}://${host}`,
        }).href,
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (typeof req.isAuthenticated !== "function") {
    return res.status(503).json({ message: "Authentication is not configured" });
  }

  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
