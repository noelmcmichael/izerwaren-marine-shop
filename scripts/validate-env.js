#!/usr/bin/env node

/**
 * Environment Validation Script
 * Validates database connectivity and required environment variables
 */

const { PrismaClient } = require('@prisma/client');

async function validateDatabase() {
  console.log('🔍 Validating database connection...');

  try {
    const prisma = new PrismaClient();
    await prisma.$connect();

    // Test basic query
    const tableCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;

    console.log(`✅ Database connected (${tableCount[0].count} tables found)`);
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

function validateEnvironmentVariables() {
  console.log('🔍 Validating environment variables...');

  const required = {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
  };

  const optional = {
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
    SHOPIFY_ADMIN_ACCESS_TOKEN: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
  };

  let allRequiredPresent = true;

  console.log('\n📋 Required variables:');
  Object.entries(required).forEach(([key, value]) => {
    if (value) {
      console.log(`  ✅ ${key}: configured`);
    } else {
      console.log(`  ❌ ${key}: missing`);
      allRequiredPresent = false;
    }
  });

  console.log('\n📋 Optional variables (for full functionality):');
  Object.entries(optional).forEach(([key, value]) => {
    if (value) {
      if (key.includes('FIREBASE') && value === 'ADC') {
        console.log(`  ✅ ${key}: using Application Default Credentials`);
      } else {
        console.log(`  ✅ ${key}: configured`);
      }
    } else {
      console.log(`  ⚠️  ${key}: not configured`);
    }
  });

  return allRequiredPresent;
}

async function main() {
  console.log('🚀 Izerwaren 2.0 Environment Validation\n');

  const envValid = validateEnvironmentVariables();
  const dbValid = await validateDatabase();

  console.log('\n📊 Summary:');
  console.log(`  Database: ${dbValid ? '✅ Ready' : '❌ Failed'}`);
  console.log(`  Environment: ${envValid ? '✅ Complete' : '⚠️  Missing required vars'}`);

  if (dbValid && envValid) {
    console.log('\n🎉 Environment ready for development!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Environment needs configuration.');
    if (!envValid) {
      console.log('   → Configure missing environment variables in .env');
    }
    if (!dbValid) {
      console.log('   → Check database connection and ensure PostgreSQL is running');
    }
    process.exit(1);
  }
}

main().catch(console.error);
