#!/usr/bin/env tsx

import { PrismaClient } from '../lib/generated/prisma';
import { readFileSync } from 'fs';
import { join } from 'path';

async function wipeDatabase(): Promise<void> {
  const prisma = new PrismaClient();
  
  try {
    console.log('⚠️  Starting database wipe...');
    
    // Create a backup before wiping
    const { backupDatabase } = await import('./db-backup');
    console.log('📦 Creating backup before wipe...');
    await backupDatabase();
    
    // Delete all data in the correct order (respecting foreign key constraints)
    console.log('🧹 Wiping database tables...');
    
    // Delete junction table first (no foreign key constraints)
    await prisma.$executeRaw`DELETE FROM "_ViewRootBlocks"`;
    console.log('   ✅ Cleared view-block relationships');
    
    // Delete syntactic variants (references blocks)
    await prisma.syntacticVariant.deleteMany({});
    console.log('   ✅ Cleared syntactic variants');
    
    // Delete views (references users)
    await prisma.view.deleteMany({});
    console.log('   ✅ Cleared views');
    
    // Delete blocks (references users and other blocks)
    await prisma.block.deleteMany({});
    console.log('   ✅ Cleared blocks');
    
    // Delete users (referenced by other tables)
    await prisma.user.deleteMany({});
    console.log('   ✅ Cleared users');
    
    // Reset auto-increment sequences if using PostgreSQL
    try {
      await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"User"', 'id'), 1, false)`;
      await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"Block"', 'id'), 1, false)`;
      await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"View"', 'id'), 1, false)`;
      await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"SyntacticVariant"', 'id'), 1, false)`;
      console.log('   ✅ Reset sequence counters');
    } catch (error) {
      // Ignore if not PostgreSQL or sequences don't exist
      console.log('   ℹ️  Sequence reset skipped (likely using SQLite)');
    }
    
    console.log('🎉 Database wipe completed successfully!');
    console.log('📁 A backup was created before wiping');
    
  } catch (error) {
    console.error('❌ Error during database wipe:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run wipe if called directly
if (require.main === module) {
  // Add confirmation prompt
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('⚠️  Are you sure you want to wipe the database? This will delete ALL data. (y/N): ', (answer: string) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      wipeDatabase();
    } else {
      console.log('❌ Database wipe cancelled');
    }
    rl.close();
  });
} else {
  // If imported as module, don't prompt
  wipeDatabase();
}

export { wipeDatabase };