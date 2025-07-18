#!/usr/bin/env tsx

import { PrismaClient } from '../lib/generated/prisma';
import { readFileSync, existsSync } from 'fs';
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

async function restoreDatabase(backupFilePath: string): Promise<void> {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Starting database restore...');
    
    // Check if backup file exists
    if (!existsSync(backupFilePath)) {
      throw new Error(`Backup file not found: ${backupFilePath}`);
    }
    
    // Read and parse backup file
    const backupData = readFileSync(backupFilePath, 'utf8');
    const backup: DatabaseBackup = JSON.parse(backupData);
    
    console.log(`📁 Loading backup from: ${backupFilePath}`);
    console.log(`📅 Backup timestamp: ${backup.timestamp}`);
    console.log(`📊 Backup contains:`);
    console.log(`   - ${backup.tables.users.length} users`);
    console.log(`   - ${backup.tables.blocks.length} blocks`);
    console.log(`   - ${backup.tables.views.length} views`);
    console.log(`   - ${backup.tables.syntacticVariants.length} syntactic variants`);
    console.log(`   - ${backup.tables.viewRootBlocks.length} view-block relationships`);
    
    // Create a backup of current state before restoring
    const { backupDatabase } = await import('./db-backup');
    console.log('📦 Creating backup of current state...');
    await backupDatabase();
    
    // Wipe current database
    const { wipeDatabase } = await import('./db-wipe');
    console.log('🧹 Wiping current database...');
    await wipeDatabase();
    
    // Restore data in correct order (respecting foreign key constraints)
    console.log('📥 Restoring data...');
    
    // Restore users first (referenced by other tables)
    if (backup.tables.users.length > 0) {
      await prisma.user.createMany({
        data: backup.tables.users,
        skipDuplicates: true
      });
      console.log(`   ✅ Restored ${backup.tables.users.length} users`);
    }
    
    // Restore blocks (can reference users and other blocks)
    if (backup.tables.blocks.length > 0) {
      // Sort blocks to ensure parent blocks are created before children
      const sortedBlocks = backup.tables.blocks.sort((a, b) => {
        if (!a.parentId && b.parentId) return -1;
        if (a.parentId && !b.parentId) return 1;
        return 0;
      });
      
      for (const block of sortedBlocks) {
        await prisma.block.create({
          data: {
            id: block.id,
            canonical: block.canonical,
            html: block.html,
            style: block.style,
            parentId: block.parentId,
            createdBy: block.createdBy,
            updatedBy: block.updatedBy,
            createdAt: block.createdAt,
            updatedAt: block.updatedAt
          }
        });
      }
      console.log(`   ✅ Restored ${backup.tables.blocks.length} blocks`);
    }
    
    // Restore views (references users)
    if (backup.tables.views.length > 0) {
      await prisma.view.createMany({
        data: backup.tables.views,
        skipDuplicates: true
      });
      console.log(`   ✅ Restored ${backup.tables.views.length} views`);
    }
    
    // Restore syntactic variants (references blocks)
    if (backup.tables.syntacticVariants.length > 0) {
      await prisma.syntacticVariant.createMany({
        data: backup.tables.syntacticVariants,
        skipDuplicates: true
      });
      console.log(`   ✅ Restored ${backup.tables.syntacticVariants.length} syntactic variants`);
    }
    
    // Restore view-block relationships (junction table)
    if (backup.tables.viewRootBlocks.length > 0) {
      for (const relationship of backup.tables.viewRootBlocks) {
        await prisma.$executeRaw`
          INSERT INTO "_ViewRootBlocks" ("A", "B")
          VALUES (${relationship.A}, ${relationship.B})
          ON CONFLICT DO NOTHING
        `;
      }
      console.log(`   ✅ Restored ${backup.tables.viewRootBlocks.length} view-block relationships`);
    }
    
    console.log('🎉 Database restore completed successfully!');
    console.log('📁 A backup of the previous state was created');
    
  } catch (error) {
    console.error('❌ Error during database restore:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run restore if called directly
if (require.main === module) {
  const backupFilePath = process.argv[2];
  
  if (!backupFilePath) {
    console.log('❌ Please provide a backup file path');
    console.log('Usage: npm run db:restore <backup-file-path>');
    console.log('Example: npm run db:restore backups/db-backup-2023-12-01T10-30-00-000Z.json');
    process.exit(1);
  }
  
  // Add confirmation prompt
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question(`⚠️  Are you sure you want to restore from ${backupFilePath}? This will wipe the current database. (y/N): `, (answer: string) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      restoreDatabase(backupFilePath);
    } else {
      console.log('❌ Database restore cancelled');
    }
    rl.close();
  });
}

export { restoreDatabase };