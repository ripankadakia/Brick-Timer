# Interval Timer App

## Overview

This is a mobile-optimized interval timer application designed for tracking workout segments and analyzing fitness progress. Built as a full-stack web application, it allows users to create custom interval timers, track workout sessions in real-time, view workout history, and analyze performance metrics. The app follows Apple Human Interface Guidelines for clarity and precision in a utility-focused fitness context.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework:** React 18+ with TypeScript, using Vite as the build tool and development server.

**Routing:** wouter - A minimalist client-side router providing page navigation between Timer, History, and Analytics views.

**State Management:** 
- @tanstack/react-query for server state management and data fetching
- Local React state (useState, useEffect) for UI state and timer logic
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
- **TimerPage:** Main interface for creating and running interval workouts with drag-to-reorder segments
- **HistoryPage:** List view of completed workouts with expandable details
- **AnalyticsPage:** Performance metrics and charts for specific segment types

### Backend Architecture

**Runtime:** Node.js with Express.js server framework

**Language:** TypeScript with ESM modules

**API Design:** RESTful API with routes prefixed by `/api` (routes implementation pending in `server/routes.ts`)

**Storage Layer:** Abstract storage interface (`IStorage`) with two implementations:
- `MemStorage`: In-memory storage using Map data structures for development/testing
- Database implementation planned using Drizzle ORM with PostgreSQL

**Session Management:** Configured to use connect-pg-simple for PostgreSQL-backed sessions (package dependency present)

**Development Features:**
- Vite middleware integration for hot module replacement
- Custom logging middleware for API request/response tracking
- Error overlay plugin for runtime errors in development

### Data Model

**Schema (Drizzle ORM):**

**Workouts Table:**
- `id`: UUID primary key (auto-generated)
- `name`: Text field for workout name
- `date`: Timestamp (defaults to current time)
- `totalTime`: Integer representing total workout duration in seconds

**Segments Table:**
- `id`: UUID primary key (auto-generated)
- `workoutId`: Foreign key to workouts (cascade delete)
- `name`: Text field for segment name (e.g., "Run", "Bike", "Row")
- `duration`: Integer representing segment duration in seconds
- `order`: Integer for segment sequence position

**Validation:** Zod schemas generated from Drizzle table definitions for type-safe input validation.

**Relationships:** One-to-many relationship between workouts and segments. Deleting a workout cascades to remove all associated segments.

### External Dependencies

**Database:** 
- PostgreSQL via @neondatabase/serverless
- Drizzle ORM for type-safe database queries and migrations
- WebSocket support configured via ws package for Neon serverless connections

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