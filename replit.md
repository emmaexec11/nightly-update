# Execution System

## Overview

A full-stack goal and habit tracking web application designed for daily execution. The system uses a hierarchical goal structure (Yearly → Quarterly → Monthly → Weekly) with linked daily habits as lead indicators. Progress is measured by cumulative success percentage rather than streaks, with automatic exclusion of non-required days from calculations.

Core philosophy: Only daily habits are checked off. Goals provide context but are never directly checked. The system prioritizes speed (under 60 seconds per day), mathematical accuracy, and emotional neutrality toward missed days.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with dark mode as default
- **Animations**: Framer Motion for smooth transitions
- **Build Tool**: Vite with HMR support

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Pattern**: RESTful endpoints defined in shared routes
- **Validation**: Zod schemas shared between client and server

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (requires DATABASE_URL environment variable)
- **Schema Location**: `shared/schema.ts` - single source of truth
- **Migrations**: Drizzle Kit with `db:push` command

### Project Structure
```
client/           # React frontend
  src/
    components/   # UI components including shadcn/ui
    pages/        # Route pages (Home, HabitDetail)
    hooks/        # Custom React hooks for data fetching
    lib/          # Utilities and query client
server/           # Express backend
  routes.ts       # API route handlers
  storage.ts      # Database access layer
  db.ts           # Drizzle database connection
shared/           # Shared code between client/server
  schema.ts       # Drizzle table definitions and types
  routes.ts       # API route definitions with Zod validation
```

### Key Design Patterns
- **Shared Types**: Schema and route definitions shared between frontend and backend
- **Path Aliases**: `@/` for client source, `@shared/` for shared code
- **Component Architecture**: Radix UI primitives wrapped with Tailwind styling
- **Data Flow**: React Query handles caching, refetching, and optimistic updates

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connected via `DATABASE_URL` environment variable
- **Tables**: goals, habits, dailyCheckins, habitChecks, weeklyReviews, goalReviews, mindsetNotes, lagIndicators, lagIndicatorEntries

## Recent Changes

### January 2026
- **Habit Notes with Colors**: Added visible note badges on habit rows with customizable background and text colors
- **Text Highlighting**: Added [color]text[/color] syntax to highlight text in notes with 9 color options (yellow, green, blue, purple, pink, orange, red, cyan, gray)
- **Drag-and-Drop Reordering**: Goals and habits can be reordered via drag-and-drop using @dnd-kit
- **Position Persistence**: Added position field to goals and habits tables to persist custom ordering
- **Lag Indicators**: Track outcome metrics for goals with numeric daily values or external Notion links

### UI Framework
- **Radix UI**: Accessible component primitives (dialog, popover, select, tabs, etc.)
- **shadcn/ui**: Pre-built component library using Radix + Tailwind

### Data Visualization
- **Recharts**: Charts for success rate visualization
- **date-fns**: Date manipulation and formatting

### Development Tools
- **Vite**: Development server with hot module replacement
- **Replit Plugins**: Runtime error overlay, cartographer, dev banner (development only)