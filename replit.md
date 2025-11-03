# Interval Timer App

## Overview

This is a mobile-optimized interval timer application designed for tracking workout segments and analyzing fitness progress. Built as a full-stack web application with multi-user authentication, it allows users to create custom interval timers, track workout sessions in real-time, view workout history, and analyze performance metrics. Each user has their own private workout data. The app follows Apple Human Interface Guidelines for clarity and precision in a utility-focused fitness context.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework:** React 18+ with TypeScript, using Vite as the build tool and development server.

**Routing:** wouter - A minimalist client-side router providing page navigation between Timer, History, and Analytics views.

**State Management:** 
- @tanstack/react-query for server state management and data fetching
- React Context (WorkoutContext) for global workout state across pages
- Local React state (useState, useEffect) for UI state
- localStorage for persisting user preferences (segment name suggestions)

**UI Component Library:** shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling. The design system follows the "new-york" style variant with custom color tokens and spacing based on Apple HIG principles.

**Drag and Drop:** @dnd-kit suite (core, sortable, utilities) for reorderable interval segments in the timer setup interface.

**Design System:**
- Tailwind CSS with custom configuration for Apple-inspired design tokens
- CSS variables for theming (light/dark mode support)
- Custom elevation system using `--elevate-1` and `--elevate-2` variables for hover/active states
- Monospace tabular numbers for timer displays to prevent layout shift
- Mobile-first responsive design with viewport-fit=cover for iOS safe areas

**Key Pages:**
- **LandingPage:** Public landing page for logged-out users with sign-in button
- **TimerPage:** Main interface for creating and running interval workouts with drag-to-reorder segments. Includes datalist autocomplete for workout names showing existing templates. When a template is selected, segments auto-populate. Workouts are automatically saved as templates when Start is pressed. Active workouts run in background when navigating to other pages.
- **HistoryPage:** List view of completed workouts with expandable details and delete functionality
- **AnalyticsPage:** Performance metrics and charts for specific segment types

**Background Workout Tracking:**
- Active workouts continue running when navigating between tabs
- WorkoutContext manages global workout state (timer, segments, progress)
- Timer runs via setInterval in context, persists across page navigation
- BottomNav shows workout indicator when workout is active and user is on non-Timer page
- Indicator displays current segment name, elapsed time, and running/paused status
- Click indicator to return to Timer page and see full ActiveTimer view
- Green pulsing dot indicates running workout, yellow dot indicates paused

**Workout Template System:**
- Templates are automatically saved when users start a workout
- Workout name input features datalist autocomplete showing existing templates
- Selecting a template from autocomplete auto-populates all segments in correct order
- Templates include workout name and ordered segment names
- Each user has their own private templates
- Template creation/update uses upsert logic (creates new or updates existing by name)
- React Query cache invalidation ensures templates appear immediately after save

### Backend Architecture

**Runtime:** Node.js with Express.js server framework

**Language:** TypeScript with ESM modules

**API Design:** RESTful API with routes prefixed by `/api`. All workout and segment routes are protected with authentication middleware.

**Authentication:** Replit Auth (OpenID Connect) for multi-user support with Google, GitHub, X, Apple, and email/password login. Session-based authentication using PostgreSQL-backed sessions.

**Storage Layer:** Abstract storage interface (`IStorage`) implemented by `DbStorage` using Drizzle ORM with PostgreSQL. All workout operations filter by authenticated user ID.

**Session Management:** PostgreSQL-backed sessions using connect-pg-simple with 7-day TTL

**Development Features:**
- Vite middleware integration for hot module replacement
- Custom logging middleware for API request/response tracking
- Error overlay plugin for runtime errors in development

### Data Model

**Schema (Drizzle ORM):**

**Users Table:**
- `id`: Varchar primary key (user ID from Replit Auth)
- `email`: Varchar field for user email (unique)
- `firstName`: Varchar field for user's first name
- `lastName`: Varchar field for user's last name
- `profileImageUrl`: Varchar field for user's profile picture URL
- `createdAt`: Timestamp (defaults to current time)
- `updatedAt`: Timestamp (defaults to current time, updated on changes)

**Sessions Table:**
- `sid`: Varchar primary key (session ID)
- `sess`: JSONB field for session data
- `expire`: Timestamp for session expiration

**Workouts Table:**
- `id`: UUID primary key (auto-generated)
- `userId`: Foreign key to users (cascade delete)
- `name`: Text field for workout name
- `date`: Timestamp (defaults to current time)
- `totalTime`: Integer representing total workout duration in seconds

**Segments Table:**
- `id`: UUID primary key (auto-generated)
- `workoutId`: Foreign key to workouts (cascade delete)
- `name`: Text field for segment name (e.g., "Run", "Bike", "Row")
- `duration`: Integer representing segment duration in seconds
- `order`: Integer for segment sequence position

**Workout Templates Table:**
- `id`: UUID primary key (auto-generated)
- `userId`: Foreign key to users (cascade delete)
- `name`: Text field for template name (unique per user)
- `createdAt`: Timestamp (defaults to current time)
- `updatedAt`: Timestamp (updated on template modification)

**Template Segments Table:**
- `id`: UUID primary key (auto-generated)
- `templateId`: Foreign key to workout_templates (cascade delete)
- `name`: Text field for segment name
- `duration`: Integer (always 0 for templates, only stores segment names)
- `order`: Integer for segment sequence position

**Validation:** Zod schemas generated from Drizzle table definitions for type-safe input validation.

**Relationships:** 
- Users have many workouts (one-to-many)
- Users have many workout templates (one-to-many)
- Workouts have many segments (one-to-many)
- Templates have many template segments (one-to-many)
- Deleting a user cascades to remove all workouts, templates, and segments
- Deleting a workout cascades to remove all associated segments
- Deleting a template cascades to remove all associated template segments

### External Dependencies

**Database:** 
- PostgreSQL via @neondatabase/serverless
- Drizzle ORM for type-safe database queries and migrations
- WebSocket support configured via ws package for Neon serverless connections

**Authentication:**
- openid-client for OpenID Connect authentication
- passport and openid-client/passport for authentication strategy
- memoizee for caching OIDC configuration
- connect-pg-simple for PostgreSQL session storage

**UI Libraries:**
- Radix UI primitives (30+ component primitives for accessibility)
- lucide-react for consistent iconography
- recharts for data visualization in analytics
- date-fns for date formatting and manipulation
- cmdk for command palette pattern (if implemented)

**Form Handling:**
- react-hook-form with @hookform/resolvers for form state management
- Zod integration for schema-based validation

**Development Tools:**
- @replit/vite-plugin-* suite for Replit-specific development features
- tsx for TypeScript execution in development
- esbuild for production server bundling

**Build & Deployment:**
- Vite for frontend bundling with optimized production builds
- Custom build script bundles server code separately using esbuild
- Static assets served from `dist/public` in production