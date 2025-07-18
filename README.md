# mohio
to know, understand, realise, comprehend, recognise.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Database Utilities Created:

  1. Database Backup (scripts/db-backup.ts)
  - Exports all database tables to a JSON file
  - Includes timestamp and version information
  - Saves to backups/ directory with timestamped filenames
  - Covers all tables: users, blocks, views, syntactic variants,
  and relationships

  2. Database Wipe (scripts/db-wipe.ts)
  - Safely clears all data from the database
  - Respects foreign key constraints (deletes in correct order)
  - Automatically creates a backup before wiping
  - Includes confirmation prompt for safety

  3. Database Restore (scripts/db-restore.ts)
  - Restores database from a backup file
  - Creates backup of current state before restoring
  - Handles complex relationships and hierarchical blocks
  - Includes confirmation prompt for safety

  NPM Scripts Added:

  npm run db:backup     # Create database backup
  npm run db:wipe       # Wipe database (with confirmation)
  npm run db:restore    # Restore from backup file

  Usage Examples:

  # Create a backup
  npm run db:backup

  # Wipe database (will prompt for confirmation)
  npm run db:wipe

  # Restore from a specific backup
  npm run db:restore
  backups/db-backup-2023-12-01T10-30-00-000Z.json