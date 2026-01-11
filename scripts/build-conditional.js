#!/usr/bin/env node

// Conditional build script - skips Next.js if SKIP_NEXT_BUILD is set
const { execSync } = require('child_process');

if (process.env.SKIP_NEXT_BUILD === 'true') {
  console.log('⏭️  Skipping Next.js build (socket server only)');
  console.log('📦 Generating Prisma Client...');
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma Client generated successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Prisma generation failed');
    process.exit(1);
  }
} else {
  console.log('🏗️  Building Next.js application...');
  try {
    execSync('npx prisma generate && next build', { stdio: 'inherit' });
    process.exit(0);
  } catch (error) {
    console.error('❌ Build failed');
    process.exit(1);
  }
}
