#!/usr/bin/env tsx

import { PrismaClient } from '../lib/generated/prisma';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface DatabaseBackup {
  timestamp: string;
  version: string;
  tables: {
    users: any[];
    blocks: any[];
    views: any[];
    syntacticVariants: any[];
    viewRootBlocks: any[];
  };
}

async function backupDatabase(): Promise<void> {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Starting database backup...');
    
    // Fetch all data from each table
    const [users, blocks, views, syntacticVariants, viewRootBlocks] = await Promise.all([
      prisma.user.findMany(),
      prisma.block.findMany(),
      prisma.view.findMany(),
      prisma.syntacticVariant.findMany(),
      prisma.$queryRaw`SELECT * FROM "_ViewRootBlocks"` as Promise<any[]>,
    ]);

    // Create backup object
    const backup: DatabaseBackup = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      tables: {
        users,
        blocks,
        views,
        syntacticVariants,
        viewRootBlocks
      }
    };

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `db-backup-${timestamp}.json`;
    const filepath = join(process.cwd(), 'backups', filename);

    // Ensure backups directory exists
    const { mkdirSync } = require('fs');
    try {
      mkdirSync(join(process.cwd(), 'backups'), { recursive: true });
    } catch (err) {
      // Directory might already exist
    }

    // Write backup to file
    writeFileSync(filepath, JSON.stringify(backup, null, 2));

    console.log(`✅ Database backup completed successfully!`);
    console.log(`📁 Backup saved to: ${filepath}`);
    console.log(`📊 Backup contains:`);
    console.log(`   - ${backup.tables.users.length} users`);
    console.log(`   - ${backup.tables.blocks.length} blocks`);
    console.log(`   - ${backup.tables.views.length} views`);
    console.log(`   - ${backup.tables.syntacticVariants.length} syntactic variants`);
    console.log(`   - ${backup.tables.viewRootBlocks.length} view-block relationships`);

  } catch (error) {
    console.error('❌ Error during backup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run backup if called directly
if (require.main === module) {
  backupDatabase();
}

export { backupDatabase };