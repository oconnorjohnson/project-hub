# Database Setup Guide

## Environment Variables

Add these to your `.env.local` file:

```env
# Supabase Database Connection (from Database Settings > Connection String)
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres

# Supabase API (from Project Settings > API)
SUPABASE_URL=https://[PROJECT_REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Clerk Webhook (from Clerk Dashboard > Webhooks)
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## Database Migration

1. **Generate migration** (after schema changes):

   ```bash
   pnpm db:generate
   ```

2. **Apply migration** to database:

   ```bash
   pnpm db:migrate
   ```

3. **Push changes directly** (for development):

   ```bash
   pnpm db:push
   ```

4. **Open Drizzle Studio** (database GUI):
   ```bash
   pnpm db:studio
   ```

## Clerk Webhook Setup

1. Go to Clerk Dashboard > Webhooks
2. Create a new webhook endpoint: `https://your-domain.com/api/webhooks/clerk`
3. Select events: `user.created`, `user.updated`, `user.deleted`
4. Copy the webhook secret to your `.env.local`

## Schema Overview

- **users**: Synced from Clerk via webhook
- **workspaces**: User organizations/companies
- **user_workspace_roles**: Junction table for workspace permissions
- **projects**: Discrete initiatives within workspaces
- **artifacts**: Tasks, docs, assets, events within projects
