# Development Workflow Guide

This guide covers the day-to-day development workflow, coding standards, and best practices for the Izerwaren Revamp 2.0 project.

## Table of Contents
- [Development Philosophy](#development-philosophy)
- [Daily Workflow](#daily-workflow)
- [Code Standards](#code-standards)
- [Git Workflow](#git-workflow)
- [Testing Strategy](#testing-strategy)
- [Performance Guidelines](#performance-guidelines)
- [Debugging](#debugging)

## Development Philosophy

### Core Principles
1. **Plan → Code** - Create Implementation Roadmaps before major changes
2. **Source of Truth** - Follow `/rules.md` as the project constitution  
3. **Documentation Layers** - Maintain clear, hierarchical documentation
4. **Atomic Commits** - Use Conventional Commits for clear history
5. **Safety & Clarity** - Ask for clarification when requirements are ambiguous

### Project Rules
- Treat `/rules.md` as the constitution
- README ≤ 800 lines; longer docs → `docs/archive/`
- Always use repo-relative POSIX paths
- Never embed absolute local paths or plaintext secrets
- Include Memex co-authorship trailers in commits

## Daily Workflow

### Starting Work on a New Feature

1. **Update Local Repository**
   ```bash
   git pull origin main
   npm install  # Update dependencies if needed
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Create Implementation Roadmap** (for complex features)
   ```bash
   # Create roadmap in docs/progress/
   touch docs/progress/feature-name-roadmap.md
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

### Development Cycle

1. **Write Code**
   - Follow TypeScript strict mode
   - Use existing components and utilities
   - Write tests alongside features

2. **Check Code Quality**
   ```bash
   npm run lint          # Check linting
   npm run type-check    # TypeScript validation
   npm run format        # Format code
   ```

3. **Run Tests**
   ```bash
   npm test              # Unit tests
   npm run test:integration  # Integration tests
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: implement user authentication

   - Add Firebase auth integration
   - Create login/logout components
   - Add protected route middleware
   
   🤖 Generated with Memex
   Co-Authored-By: Memex <noreply@memex.tech>"
   ```

### Daily Commands

```bash
# Start development
npm run dev

# Code quality (run before commits)
npm run quality:check
npm run quality:fix

# Testing
npm test
npm run test:watch

# Database operations
npm run db:status
npm run db:studio

# Environment validation
npm run validate:env
```

## Code Standards

### TypeScript Guidelines

#### Strict Configuration
- Use TypeScript strict mode
- No `any` types without explicit reasoning
- Prefer interfaces over types for objects
- Use generic types for reusable components

```typescript
// ✅ Good: Strict typing
interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'dealer' | 'customer';
  createdAt: Date;
}

// ❌ Avoid: Any types
const userData: any = fetchUserData();

// ✅ Good: Generic reusable component
interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}
```

#### File Organization
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Route groups
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── forms/            # Form components
│   └── layout/           # Layout components
├── lib/                  # Core utilities
│   ├── auth/             # Authentication logic
│   ├── api/              # API clients
│   └── utils/            # Helper functions
├── types/                # TypeScript definitions
└── hooks/                # Custom React hooks
```

### React Components

#### Component Structure
```tsx
'use client'; // Only when needed

import { useState, useEffect } from 'react';
import { ComponentProps } from '@/types';

interface Props {
  title: string;
  optional?: boolean;
  children?: React.ReactNode;
}

export default function Component({ title, optional = false, children }: Props) {
  // Hooks first
  const [state, setState] = useState('');
  
  // Event handlers
  const handleClick = () => {
    setState('clicked');
  };

  // Effects last
  useEffect(() => {
    // Effect logic
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">{title}</h1>
      {optional && <p>Optional content</p>}
      {children}
    </div>
  );
}
```

#### Styling with Tailwind
```tsx
// ✅ Good: Responsive, semantic classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <article className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
    <h2 className="text-lg font-semibold text-gray-900 mb-2">
      {title}
    </h2>
  </article>
</div>

// ❌ Avoid: Inline styles, magic values
<div style={{ display: 'flex', padding: '16px' }}>
```

### API Development

#### API Route Structure
```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateUserSchema.parse(body);
    
    // Business logic
    const user = await createUser(validatedData);
    
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### Database Operations
```typescript
// Use Prisma with proper error handling
export async function getUserById(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  } catch (error) {
    logger.error('Failed to fetch user', { userId: id, error });
    throw error;
  }
}
```

## Git Workflow

### Branch Strategy
- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature development
- `hotfix/*` - Critical production fixes
- `release/*` - Release preparation

### Commit Convention
Use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format
<type>[optional scope]: <description>

[optional body]

[optional footer]

# Examples
feat(auth): add Firebase authentication integration
fix(api): resolve database connection timeout
docs(setup): update installation instructions
test(auth): add login component tests
refactor(ui): simplify button component props
```

#### Commit Types
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `test` - Adding or updating tests
- `refactor` - Code refactoring
- `style` - Code style changes (formatting)
- `chore` - Build tasks, dependency updates
- `perf` - Performance improvements

### Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/user-dashboard
   ```

2. **Make Changes and Commit**
   ```bash
   git add .
   git commit -m "feat(dashboard): implement user dashboard layout"
   ```

3. **Push and Create PR**
   ```bash
   git push origin feature/user-dashboard
   # Create PR via GitHub UI
   ```

4. **PR Requirements**
   - [ ] All tests pass
   - [ ] Code coverage maintained
   - [ ] Documentation updated
   - [ ] No linting errors
   - [ ] Changes tested locally

## Testing Strategy

### Test Structure
```
tests/
├── unit/               # Unit tests
├── integration/        # Integration tests
├── e2e/               # End-to-end tests
└── __mocks__/         # Mock implementations
```

### Unit Testing with Jest
```typescript
// components/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../Button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Testing
```typescript
// api/__tests__/users.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '../users/route';

describe('/api/users', () => {
  it('creates a new user', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        name: 'Test User',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(201);
    const data = JSON.parse(res._getData());
    expect(data.user.email).toBe('test@example.com');
  });
});
```

### E2E Testing with Playwright
```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('user can login and access dashboard', async ({ page }) => {
  await page.goto('/login');
  
  await page.fill('[data-testid="email"]', 'user@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');
  
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

### Testing Commands
```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e

# Specific test file
npm test -- Button.test.tsx
```

## Performance Guidelines

### Frontend Performance

#### Image Optimization
```tsx
import Image from 'next/image';

// ✅ Good: Optimized images
<Image
  src="/product.jpg"
  alt="Product description"
  width={400}
  height={300}
  priority={true} // For above-the-fold images
/>

// ❌ Avoid: Unoptimized images
<img src="/large-image.jpg" alt="Image" />
```

#### Code Splitting
```tsx
import dynamic from 'next/dynamic';

// ✅ Good: Lazy load heavy components
const HeavyChart = dynamic(() => import('../components/Chart'), {
  loading: () => <p>Loading chart...</p>,
});

// ✅ Good: Lazy load with no SSR
const ClientOnlyComponent = dynamic(
  () => import('../components/ClientOnly'),
  { ssr: false }
);
```

#### Data Fetching
```tsx
import useSWR from 'swr';

// ✅ Good: Efficient data fetching with SWR
function UserProfile({ userId }: { userId: string }) {
  const { data, error, isLoading } = useSWR(
    `/api/users/${userId}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage />;
  
  return <ProfileDisplay user={data} />;
}
```

### Backend Performance

#### Database Optimization
```typescript
// ✅ Good: Efficient queries with includes
const orders = await prisma.order.findMany({
  where: { userId },
  include: {
    items: {
      include: { product: true },
    },
  },
  take: 20,
  orderBy: { createdAt: 'desc' },
});

// ❌ Avoid: N+1 queries
const orders = await prisma.order.findMany();
for (const order of orders) {
  const items = await prisma.orderItem.findMany({
    where: { orderId: order.id },
  });
}
```

#### Caching Strategy
```typescript
import { cache } from 'react';

// Server-side caching
export const getProductsCache = cache(async () => {
  return await prisma.product.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
  });
});

// Client-side caching with SWR
const { data: products } = useSWR(
  '/api/products',
  fetcher,
  { 
    refreshInterval: 300000, // 5 minutes
    revalidateOnMount: false,
  }
);
```

## Debugging

### Development Debugging

#### Browser DevTools
```typescript
// ✅ Good: Conditional debugging
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', { user, session });
}

// ✅ Good: Structured logging
logger.debug('User authentication', {
  userId: user.id,
  method: 'firebase',
  timestamp: new Date().toISOString(),
});
```

#### React DevTools
- Install React Developer Tools browser extension
- Use Component Tree to inspect props and state
- Use Profiler to identify performance bottlenecks

#### Next.js Debugging
```bash
# Enable debug mode
DEBUG=* npm run dev

# Specific debug namespaces
DEBUG=next:* npm run dev
```

### API Debugging

#### Request/Response Logging
```typescript
// Middleware for API logging
export function withLogging(handler: NextApiHandler) {
  return async (req: NextRequest, res: NextResponse) => {
    const start = Date.now();
    
    logger.info('API Request', {
      method: req.method,
      url: req.url,
      headers: req.headers,
    });
    
    const result = await handler(req, res);
    
    logger.info('API Response', {
      method: req.method,
      url: req.url,
      duration: Date.now() - start,
      status: res.status,
    });
    
    return result;
  };
}
```

#### Database Query Debugging
```typescript
// Enable Prisma query logging
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});
```

### Production Debugging

#### Error Monitoring
```typescript
import * as Sentry from '@sentry/nextjs';

try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      operation: 'user-creation',
      userId: user.id,
    },
    extra: {
      requestData: sanitizedData,
    },
  });
  
  throw error;
}
```

#### Health Checks
```bash
# Check application health
curl http://localhost:3000/api/health

# Detailed health check
curl http://localhost:3000/api/health/deep

# Environment validation
curl http://localhost:3000/api/environment/validate
```

## Development Tools

### VS Code Extensions
- TypeScript (`ms-vscode.vscode-typescript-next`)
- Prisma (`Prisma.prisma`)
- Tailwind CSS IntelliSense (`bradlc.vscode-tailwindcss`)
- ES7+ React/Redux/React-Native snippets
- GitLens (`eamodio.gitlens`)
- REST Client (`humao.rest-client`)

### Browser Extensions
- React Developer Tools
- Redux DevTools (if using Redux)
- Lighthouse (performance auditing)

### CLI Tools
```bash
# Prisma Studio (database GUI)
npm run db:studio

# Type checking in watch mode
npm run type-check -- --watch

# Bundle analyzer
npm run analyze
```

---

*For environment setup, see [SETUP.md](./SETUP.md). For specific deployment procedures, see [CI_CD.md](./CI_CD.md).*