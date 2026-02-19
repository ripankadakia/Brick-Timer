// Reference: blueprint:javascript_log_in_with_replit
import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

function requireEnvVar(name: "DATABASE_URL" | "SESSION_SECRET") {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Add ${name} in your deployment variables before starting the server.`
    );
  }

  return value;
}

function getOidcClientId() {
  return (
    process.env.REPL_ID?.trim() ||
    process.env.REPLIT_CLIENT_ID?.trim() ||
    process.env.REPLIT_APP_ID?.trim() ||
    process.env.OIDC_CLIENT_ID?.trim()
  );
}

const fallbackUserClaims = {
  sub: process.env.FALLBACK_USER_ID?.trim() || "railway-local-user",
  email: process.env.FALLBACK_USER_EMAIL?.trim() || "local-user@example.com",
  first_name: process.env.FALLBACK_USER_FIRST_NAME?.trim() || "Local",
  last_name: process.env.FALLBACK_USER_LAST_NAME?.trim() || "User",
  profile_image_url: process.env.FALLBACK_USER_PROFILE_IMAGE_URL?.trim() || null,
};

let authMode: "oidc" | "fallback" = "oidc";

const getOidcConfig = memoize(
  async (clientId = getOidcClientId() ?? "") => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      clientId
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: requireEnvVar("DATABASE_URL"),
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: requireEnvVar("SESSION_SECRET"),
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
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

async function setupFallbackAuth(app: Express) {
  authMode = "fallback";

  await upsertUser(fallbackUserClaims);

  app.use((req: any, _res, next) => {
    req.user = {
      claims: fallbackUserClaims,
      expires_at: Number.MAX_SAFE_INTEGER,
    };

    req.isAuthenticated = () => true;
    next();
  });

  app.get("/api/login", (_req, res) => {
    res.status(200).json({
      message:
        "Fallback auth mode is enabled (no OIDC client id configured). All requests use a single local user.",
      mode: "fallback",
    });
  });

  app.get("/api/callback", (_req, res) => {
    res.redirect("/");
  });

  app.get("/api/logout", (_req, res) => {
    res.status(200).json({ success: true, mode: "fallback" });
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  const oidcClientId = getOidcClientId();
  if (!oidcClientId) {
    console.warn(
      "OIDC client id is not configured. Starting in fallback auth mode. Set REPL_ID (or REPLIT_CLIENT_ID/REPLIT_APP_ID/OIDC_CLIENT_ID) to enable Replit OIDC auth."
    );
    await setupFallbackAuth(app);
    return;
  }

  authMode = "oidc";
  app.use(passport.initialize());
  app.use(passport.session());

  let config: Awaited<ReturnType<typeof getOidcConfig>>;
  try {
    config = await getOidcConfig(oidcClientId);
  } catch (error) {
    console.warn(
      "OIDC configuration failed. Falling back to local auth mode. Set a valid REPL_ID (or REPLIT_CLIENT_ID/REPLIT_APP_ID/OIDC_CLIENT_ID) and ISSUER_URL to re-enable OIDC.",
      error
    );
    await setupFallbackAuth(app);
    return;
  }

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Keep track of registered strategies
  const registeredStrategies = new Set<string>();

  // Helper function to ensure strategy exists for a domain
  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: oidcClientId,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (authMode === "fallback") {
    return next();
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
