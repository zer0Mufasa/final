# Fixology - AI-Powered Repair Intelligence Platform

The all-in-one platform for device repair shops. Manage tickets, inventory, customers, and more with AI-powered diagnostics.

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (via Supabase)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-repo/fixology.git
cd fixology
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Fill in your environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `DATABASE_URL` - Your database connection string
- `DIRECT_URL` - Your direct database connection string

5. Generate Prisma client and push schema:
```bash
npm run db:generate
npm run db:push
```

6. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
/fixology
├── /app                    # Next.js App Router pages
│   ├── /(marketing)        # Public marketing pages
│   ├── /(auth)             # Authentication pages
│   ├── /(dashboard)        # Shop dashboard (protected)
│   ├── /(admin)            # Super admin panel
│   └── /api                # API routes
├── /components             # React components
│   ├── /ui                 # Reusable UI components
│   ├── /dashboard          # Dashboard components
│   ├── /admin              # Admin components
│   └── /shared             # Shared components
├── /lib                    # Utility functions
│   ├── /supabase           # Supabase clients
│   ├── /prisma             # Prisma client
│   ├── /auth               # Auth utilities
│   └── /utils              # Helper functions
├── /hooks                  # Custom React hooks
├── /types                  # TypeScript types
└── /prisma                 # Database schema
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Auth**: Supabase Auth
- **UI Components**: Custom + shadcn/ui

## Features

### For Repair Shops
- 🎫 Smart ticket management
- 👥 Customer database
- 📦 Inventory tracking
- 💰 Invoice generation
- 🤖 AI-powered diagnostics
- 📱 IMEI lookup
- 📊 Business analytics
- 📅 Appointment scheduling
- 💬 Customer messaging

### For Platform Admins
- 📊 Platform-wide analytics
- 🏪 Shop management
- 💳 Billing administration
- 👤 User management

## License

Copyright © 2024 Fixology. All rights reserved.

