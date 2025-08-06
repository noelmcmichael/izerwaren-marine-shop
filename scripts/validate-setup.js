#!/usr/bin/env node

/**
 * Setup Validation Script for Izerwaren Revamp 2.0
 * Validates that the development environment is properly configured
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Validating Development Environment Setup...\n');

let validationResults = [];
let overallScore = 0;
const maxScore = 100;

// Helper function to run command safely
const runCommand = (command, silent = true) => {
  try {
    return execSync(command, { 
      encoding: 'utf8', 
      stdio: silent ? 'pipe' : 'inherit' 
    }).trim();
  } catch (error) {
    return null;
  }
};

// Helper function to check file exists
const fileExists = (filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
};

// Helper function to add validation result
const addResult = (category, name, passed, message, points = 5) => {
  validationResults.push({
    category,
    name,
    passed,
    message,
    points
  });
  
  if (passed) {
    overallScore += points;
  }
  
  const status = passed ? '✅' : '❌';
  console.log(`   ${status} ${name}: ${message}`);
};

// 1. System Requirements Validation
console.log('1. 🖥️  SYSTEM REQUIREMENTS:');
console.log('-'.repeat(40));

// Node.js version
const nodeVersion = runCommand('node --version');
if (nodeVersion) {
  const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0]);
  const nodeValid = majorVersion >= 18;
  addResult('system', 'Node.js Version', nodeValid, 
    nodeValid ? `${nodeVersion} (✓ ≥18)` : `${nodeVersion} (requires ≥18)`, 10);
} else {
  addResult('system', 'Node.js', false, 'Not installed or not in PATH', 10);
}

// npm version
const npmVersion = runCommand('npm --version');
if (npmVersion) {
  const majorVersion = parseInt(npmVersion.split('.')[0]);
  const npmValid = majorVersion >= 9;
  addResult('system', 'npm Version', npmValid,
    npmValid ? `${npmVersion} (✓ ≥9)` : `${npmVersion} (recommend ≥9)`, 5);
} else {
  addResult('system', 'npm', false, 'Not installed or not in PATH', 5);
}

// PostgreSQL
const pgVersion = runCommand('pg_isready --version');
const pgRunning = runCommand('pg_isready') !== null;
addResult('system', 'PostgreSQL', pgRunning,
  pgRunning ? 'Running and accessible' : 'Not running or not accessible', 10);

console.log('');

// 2. Project Structure Validation
console.log('2. 📁 PROJECT STRUCTURE:');
console.log('-'.repeat(40));

const requiredFiles = [
  { path: 'package.json', desc: 'Root package.json' },
  { path: 'tsconfig.json', desc: 'TypeScript configuration' },
  { path: 'apps/frontend/tailwind.config.js', desc: 'Tailwind configuration' },
  { path: 'apps/frontend/next.config.js', desc: 'Next.js configuration' },
  { path: 'packages/database/prisma/schema.prisma', desc: 'Database schema' },
  { path: 'apps/frontend/package.json', desc: 'Frontend package.json' },
  { path: 'apps/backend/package.json', desc: 'Backend package.json' },
];

requiredFiles.forEach(file => {
  const exists = fileExists(file.path);
  addResult('structure', file.desc, exists,
    exists ? 'Found' : 'Missing', 3);
});

console.log('');

// 3. Dependencies Validation
console.log('3. 📦 DEPENDENCIES:');
console.log('-'.repeat(40));

// Check if node_modules exists
const nodeModulesExists = fileExists('node_modules');
addResult('dependencies', 'Dependencies Installed', nodeModulesExists,
  nodeModulesExists ? 'node_modules directory found' : 'Run npm install', 10);

if (nodeModulesExists) {
  // Check key dependencies
  const keyDeps = [
    'next', 'react', 'typescript', 'tailwindcss', 
    'prisma', '@prisma/client', 'zod'
  ];
  
  keyDeps.forEach(dep => {
    const depPath = path.join('node_modules', dep);
    const exists = fileExists(depPath);
    addResult('dependencies', dep, exists,
      exists ? 'Installed' : 'Missing', 2);
  });
}

console.log('');

// 4. Environment Configuration
console.log('4. ⚙️  ENVIRONMENT CONFIGURATION:');
console.log('-'.repeat(40));

// Check for environment files
const envFiles = [
  { file: '.env.local', desc: 'Local development config', required: false },
  { file: '.env.example', desc: 'Environment template', required: true },
  { file: '.env.development.example', desc: 'Development template', required: true },
  { file: 'apps/frontend/.env.example', desc: 'Frontend template', required: true },
  { file: 'apps/backend/.env.example', desc: 'Backend template', required: true },
];

envFiles.forEach(({ file, desc, required }) => {
  const exists = fileExists(file);
  addResult('environment', desc, exists || !required,
    exists ? 'Found' : (required ? 'Missing (required)' : 'Not configured'), required ? 5 : 2);
});

// Check if .env.local has basic configuration
if (fileExists('.env.local')) {
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const hasDbUrl = envContent.includes('DATABASE_URL');
    addResult('environment', 'Database URL configured', hasDbUrl,
      hasDbUrl ? 'DATABASE_URL found in .env.local' : 'DATABASE_URL not set', 5);
  } catch (error) {
    addResult('environment', '.env.local readable', false, 'Cannot read .env.local', 3);
  }
}

console.log('');

// 5. Database Validation
console.log('5. 🗄️  DATABASE:');
console.log('-'.repeat(40));

// Check Prisma client generation
const prismaClientExists = fileExists('node_modules/.prisma/client');
addResult('database', 'Prisma Client Generated', prismaClientExists,
  prismaClientExists ? 'Client generated' : 'Run npm run db:generate', 5);

// Check if database can be reached (if DATABASE_URL is set)
if (process.env.DATABASE_URL) {
  const dbTest = runCommand('npm run db:status');
  addResult('database', 'Database Connection', dbTest !== null,
    dbTest !== null ? 'Database accessible' : 'Connection failed', 10);
} else {
  addResult('database', 'Database Connection', false,
    'DATABASE_URL not set', 5);
}

console.log('');

// 6. Build System Validation
console.log('6. 🔨 BUILD SYSTEM:');
console.log('-'.repeat(40));

// TypeScript compilation
const tsCheck = runCommand('npm run type-check');
addResult('build', 'TypeScript Compilation', tsCheck !== null,
  tsCheck !== null ? 'No type errors' : 'Type errors found', 8);

// Linting
const lintCheck = runCommand('npm run lint:check');
addResult('build', 'ESLint Check', lintCheck !== null,
  lintCheck !== null ? 'No linting errors' : 'Linting errors found', 5);

console.log('');

// 7. Documentation Validation
console.log('7. 📚 DOCUMENTATION:');
console.log('-'.repeat(40));

const docFiles = [
  'README.md',
  'docs/SETUP.md', 
  'docs/ENVIRONMENT.md',
  'docs/DEVELOPMENT.md'
];

docFiles.forEach(file => {
  const exists = fileExists(file);
  addResult('documentation', path.basename(file), exists,
    exists ? 'Available' : 'Missing', 2);
});

console.log('');

// Generate Final Report
console.log('📊 VALIDATION SUMMARY:');
console.log('═'.repeat(60));

const categories = [...new Set(validationResults.map(r => r.category))];

categories.forEach(category => {
  const categoryResults = validationResults.filter(r => r.category === category);
  const passed = categoryResults.filter(r => r.passed).length;
  const total = categoryResults.length;
  const percentage = Math.round((passed / total) * 100);
  
  console.log(`${category.toUpperCase()}: ${passed}/${total} (${percentage}%)`);
});

const percentage = Math.round((overallScore / maxScore) * 100);
console.log('\n' + '═'.repeat(60));
console.log(`🎯 OVERALL SCORE: ${overallScore}/${maxScore} (${percentage}%)`);

// Provide recommendations based on score
if (percentage >= 90) {
  console.log('\n🎉 EXCELLENT! Your development environment is fully configured.');
  console.log('   You can start developing immediately.');
} else if (percentage >= 75) {
  console.log('\n✨ GOOD! Your environment is mostly configured.');
  console.log('   Address the failed checks for optimal development experience.');
} else if (percentage >= 50) {
  console.log('\n⚠️  PARTIAL SETUP: Core components are working.');
  console.log('   Complete the missing configuration for full functionality.');
} else {
  console.log('\n❌ INCOMPLETE SETUP: Several issues need to be addressed.');
  console.log('   Follow the setup guide to complete configuration.');
}

// Specific recommendations
console.log('\n📋 NEXT STEPS:');
const failedResults = validationResults.filter(r => !r.passed);

if (failedResults.length === 0) {
  console.log('   ✅ No action required! Start coding with: npm run dev');
} else {
  console.log('   Address these issues:');
  
  failedResults.slice(0, 5).forEach(result => {
    console.log(`   • ${result.name}: ${result.message}`);
  });
  
  if (failedResults.length > 5) {
    console.log(`   • ... and ${failedResults.length - 5} more issues`);
  }
}

// Quick fix commands
console.log('\n🛠️  QUICK FIXES:');
if (!fileExists('node_modules')) {
  console.log('   npm install');
}
if (!fileExists('.env.local')) {
  console.log('   cp .env.development.example .env.local');
}
if (!fileExists('node_modules/.prisma/client')) {
  console.log('   npm run db:generate');
}

console.log('\n📖 For detailed setup instructions, see: docs/SETUP.md');

// Exit with appropriate code
process.exit(percentage >= 75 ? 0 : 1);