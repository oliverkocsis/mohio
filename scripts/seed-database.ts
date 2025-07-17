import { PrismaClient } from '../lib/generated/prisma';
import { View, Block } from '../lib/types';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function seedDatabase() {
  try {
    // Read the example document
    const documentPath = path.join(process.cwd(), 'data/views/mohio_document.json');
    const documentData = JSON.parse(fs.readFileSync(documentPath, 'utf8')) as View;

    // Create a system user first
    const systemUser = await prisma.user.upsert({
      where: { id: 'system' },
      update: {},
      create: {
        id: 'system',
        email: 'system@mohio.com',
        name: 'System User',
      },
    });

    console.log('✓ Created system user');

    // Function to recursively create blocks
    async function createBlocks(blocks: Block[], parentId?: string): Promise<void> {
      for (const block of blocks) {
        await prisma.block.create({
          data: {
            id: block.id,
            canonical: block.canonical,
            html: block.html || null,
            style: block.style as any || null,
            createdBy: block.createdBy || 'system',
            updatedBy: block.updatedBy || 'system',
            createdAt: block.createdAt ? new Date(block.createdAt) : new Date(),
            updatedAt: block.updatedAt ? new Date(block.updatedAt) : new Date(),
            parentId: parentId || null,
          },
        });

        // Recursively create child blocks
        if (block.children && block.children.length > 0) {
          await createBlocks(block.children, block.id);
        }
      }
    }

    // Create all blocks from the document
    await createBlocks(documentData.rootBlocks);
    console.log('✓ Created all blocks');

    // Create the view
    await prisma.view.create({
      data: {
        id: documentData.id,
        type: documentData.type,
        title: documentData.title,
        purpose: documentData.purpose,
        tone: documentData.tone,
        createdBy: documentData.createdBy || 'system',
        updatedBy: documentData.updatedBy || 'system',
        createdAt: documentData.createdAt ? new Date(documentData.createdAt) : new Date(),
        updatedAt: documentData.updatedAt ? new Date(documentData.updatedAt) : new Date(),
        rootBlocks: {
          connect: documentData.rootBlocks.map(block => ({ id: block.id })),
        },
      },
    });

    console.log('✓ Created view');
    console.log('🎉 Database seeded successfully!');

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedDatabase().catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
}

export { seedDatabase };