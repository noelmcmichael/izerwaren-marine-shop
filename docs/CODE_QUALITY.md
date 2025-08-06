# Code Quality Tooling Guide

This document outlines the code quality tools and processes set up for the Izerwaren 2.0 project.

## 🛠️ Tools Overview

### ESLint
- **Purpose**: Static code analysis and error detection
- **Configuration**: `.eslintrc.js`
- **Ignores**: `.eslintignore`
- **Features**:
  - TypeScript support with `@typescript-eslint`
  - Import order enforcement
  - React/Next.js specific rules for frontend
  - Node.js specific rules for backend
  - Stricter rules for shared packages

### Prettier
- **Purpose**: Code formatting and style consistency
- **Configuration**: `.prettierrc.js`
- **Ignores**: `.prettierignore`
- **Features**:
  - Consistent formatting across TypeScript, JavaScript, JSON, Markdown
  - Package-specific overrides (frontend, backend, packages)
  - Auto-formatting on save (VS Code)

### Husky + lint-staged
- **Purpose**: Pre-commit hooks for automated quality checks
- **Configuration**: `.husky/pre-commit` + `package.json` lint-staged section
- **Features**:
  - Runs ESLint with auto-fix on staged files
  - Applies Prettier formatting
  - Performs type checking on TypeScript files
  - Only processes staged files for performance

## 📋 Available Scripts

### Root Level (Monorepo)
```bash
# Linting
npm run lint                # Run lint across all packages
npm run lint:check          # Check for linting issues without fixing
npm run lint:fix-all        # Fix all auto-fixable linting issues

# Formatting  
npm run format              # Format all files with Prettier
npm run format:check        # Check formatting without applying changes

# Type Checking
npm run type-check          # Run TypeScript type checking

# Combined Quality Checks
npm run quality:check       # Run all quality checks (lint + format + types)
npm run quality:fix         # Fix all auto-fixable issues
```

### Package Level
Each package (frontend, backend, shared, etc.) has its own scripts:
```bash
cd apps/frontend
npm run lint                # Package-specific linting
npm run lint:fix            # Auto-fix package issues
npm run format              # Format package files
npm run type-check          # Package type checking
```

## 🎯 Quality Standards

### TypeScript Rules
- ✅ No unused variables (except those prefixed with `_`)
- ⚠️ Warn on `any` types (discouraged but not blocked)
- ✅ Prefer `const` over `let` where possible
- ✅ No `var` declarations
- ✅ Strict equality (`===`) required

### Import Organization
```typescript
// Correct import order:
import fs from 'fs';                    // Node.js built-ins
import express from 'express';          // External packages
import { ApiResponse } from '@izerwaren/shared';  // Internal packages
import { validateRequest } from '../middleware';  // Relative imports
import type { Product } from './types'; // Type imports (future)
```

### Code Formatting
- **Indentation**: 2 spaces
- **Line Length**: 100 characters (frontend), 120 characters (backend)
- **Quotes**: Single quotes for strings, JSX attributes
- **Semicolons**: Always required
- **Trailing Commas**: ES5 style (objects, arrays)

### Package-Specific Rules

#### Frontend (`apps/frontend/`)
- React hooks linting enabled
- Next.js specific rules
- Accessibility rules (jsx-a11y)
- Console warnings allowed

#### Backend (`apps/backend/`)
- Console statements allowed
- Node.js environment rules
- Security-focused rules (no eval, etc.)

#### Packages (`packages/*/`)
- Stricter rules for shared code
- No console statements
- Explicit return types encouraged

## 🚀 IDE Integration

### VS Code Setup
The project includes VS Code configuration in `.vscode/`:

- **Auto-format on save**: Enabled for all supported files
- **ESLint integration**: Real-time error highlighting
- **Recommended extensions**: See `.vscode/extensions.json`
- **Workspace settings**: Optimized for monorepo development

### Recommended Extensions
```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint", 
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma"
  ]
}
```

## ⚡ Performance Considerations

### Pre-commit Hooks
- **lint-staged**: Only processes staged files (not entire codebase)
- **Incremental**: Type checking only on changed files
- **Parallel**: Multiple file types processed simultaneously
- **Backup**: Git stash created before processing

### ESLint Configuration
- **Simplified**: Complex type-checking rules disabled for speed
- **Targeted**: Package-specific overrides instead of global rules
- **Selective**: Ignores build outputs and generated files

## 🔧 Troubleshooting

### Common Issues

#### ESLint Errors
```bash
# Fix auto-fixable issues
npm run lint:fix-all

# Check specific files
npx eslint apps/backend/src/server.ts

# Ignore specific rules (use sparingly)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = response;
```

#### Prettier Conflicts
```bash
# Format specific files
npx prettier --write apps/backend/src/

# Check formatting without changes
npx prettier --check .

# Override for specific cases (rare)
// prettier-ignore
const matrix = [
  [1, 2, 3],
  [4, 5, 6]
];
```

#### Pre-commit Hook Issues
```bash
# Skip hooks temporarily (emergency only)
git commit --no-verify -m "emergency fix"

# Debug lint-staged
npx lint-staged --debug

# Reset hooks if corrupted
npx husky init
```

### Performance Issues
If the pre-commit hooks are too slow:

1. **Check file count**: `git diff --cached --name-only | wc -l`
2. **Skip type checking**: Temporarily modify lint-staged config
3. **Use partial commits**: Stage fewer files at once
4. **Exclude large files**: Update .eslintignore/.prettierignore

## 📚 Best Practices

### Development Workflow
1. **Write code** with auto-format on save enabled
2. **Check quality** periodically with `npm run quality:check`
3. **Fix issues** before committing with `npm run quality:fix`
4. **Commit** (hooks will run automatically)
5. **Push** with confidence in code quality

### Code Reviews
- Focus on logic and architecture
- Style and formatting handled automatically
- Type safety enforced by TypeScript + ESLint
- Import organization maintained consistently

### Monorepo Considerations
- Package-specific rules keep shared code clean
- Cross-package imports linted properly
- Workspace-level scripts coordinate quality checks
- Individual packages can have additional rules

---

## 🎛️ Configuration Files Reference

| File | Purpose | Scope |
|------|---------|-------|
| `.eslintrc.js` | Main ESLint configuration | All files |
| `.eslintignore` | Files to skip linting | All files |
| `.prettierrc.js` | Prettier formatting rules | All files |
| `.prettierignore` | Files to skip formatting | All files |
| `.husky/pre-commit` | Git pre-commit hook | Git commits |
| `package.json` lint-staged | Staged file processing | Git commits |
| `.vscode/settings.json` | VS Code workspace config | Editor |
| `.vscode/extensions.json` | Recommended extensions | Editor |

This setup ensures consistent, high-quality code across the entire Izerwaren 2.0 monorepo while maintaining developer productivity and preventing common errors.