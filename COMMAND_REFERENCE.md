# Command Reference: Node.js/npm/yarn → Bun

This document provides a quick reference for converting Node.js/npm/yarn commands to Bun equivalents.

## Package Management

### Installation

| Task | Old (npm/yarn) | New (Bun) |
|------|----------------|-----------|
| Install all dependencies | `npm install` or `yarn install` | `bun install` |
| Install and save | `npm install <pkg>` or `yarn add <pkg>` | `bun add <pkg>` |
| Install dev dependency | `npm install -D <pkg>` or `yarn add -D <pkg>` | `bun add -d <pkg>` |
| Install global package | `npm install -g <pkg>` or `yarn global add <pkg>` | `bun add -g <pkg>` |
| Install exact version | `npm install <pkg>@<version>` | `bun add <pkg>@<version>` |

### Removal

| Task | Old (npm/yarn) | New (Bun) |
|------|----------------|-----------|
| Remove package | `npm uninstall <pkg>` or `yarn remove <pkg>` | `bun remove <pkg>` |
| Remove global | `npm uninstall -g <pkg>` or `yarn global remove <pkg>` | `bun remove -g <pkg>` |

### Updates

| Task | Old (npm/yarn) | New (Bun) |
|------|----------------|-----------|
| Update all packages | `npm update` or `yarn upgrade` | `bun update` |
| Update specific package | `npm update <pkg>` or `yarn upgrade <pkg>` | `bun update <pkg>` |
| Update to latest | `npm update <pkg>@latest` | `bun update <pkg>@latest` |

### Information

| Task | Old (npm/yarn) | New (Bun) |
|------|----------------|-----------|
| List installed packages | `npm list` or `yarn list` | `bun pm ls` |
| Show package info | `npm info <pkg>` | `bun pm <pkg>` |
| Check outdated | `npm outdated` or `yarn outdated` | `bun outdated` |

## Running Scripts

### Execution

| Task | Old (npm/yarn) | New (Bun) |
|------|----------------|-----------|
| Run package script | `npm run <script>` or `yarn <script>` | `bun run <script>` or `bun <script>` |
| Run file | `node file.js` | `bun file.js` |
| Run TypeScript | `ts-node file.ts` or `tsx file.ts` | `bun file.ts` |
| Execute package binary | `npx <cmd>` or `yarn dlx <cmd>` | `bunx <cmd>` |

### Development

| Task | Old (npm/yarn) | New (Bun) |
|------|----------------|-----------|
| Watch mode | `nodemon file.js` | `bun --watch file.js` |
| Hot reload | `nodemon --watch src` | `bun --watch src/index.ts` |
| REPL | `node` | `bun repl` |

## Project-Specific Commands

### Backend Development

| Task | Old Command | New Command | Notes |
|------|-------------|-------------|-------|
| Start dev server | `yarn dev` (uses nodemon) | `bun run dev` | Built-in watch mode |
| Start production | `yarn start` | `bun run start` | Runs compiled code |
| Build | `yarn build` | `bun run build` | TypeScript compilation |
| Run tests | `yarn test` (uses Jest) | `bun test` | Built-in test runner |
| Watch tests | `yarn test:watch` | `bun test --watch` | Faster than Jest |
| Test coverage | `yarn test --coverage` | `bun test --coverage` | Built-in coverage |
| Lint | `yarn lint` | `bun run lint` | Still uses ESLint |

### Frontend Development

| Task | Old Command | New Command | Notes |
|------|-------------|-------------|-------|
| Start dev server | `npm run dev` (Vite) | `bun run dev` | Vite via Bun |
| Build | `npm run build` | `bun run build` | Vite bundler |
| Preview | `npm run preview` | `bun run preview` | Preview build |
| Lint | `npm run lint` | `bun run lint` | ESLint |

### Shared Package

| Task | Old Command | New Command | Notes |
|------|-------------|-------------|-------|
| Build types | `yarn build` | `bun run build` | TypeScript compilation |
| Watch mode | `yarn dev` | `bun run dev` | Auto-rebuild types |

## Environment & Configuration

### Environment Variables

| Task | Old | New | Notes |
|------|-----|-----|-------|
| Load .env | Requires `dotenv` package | Built-in | Automatic |
| Set env var | `NODE_ENV=production` | `NODE_ENV=production` | Same |
| Access in code | `process.env.VAR` | `process.env.VAR` or `Bun.env.VAR` | Both work |

### Configuration Files

| Old File | New File | Purpose |
|----------|----------|---------|
| `package.json` | `package.json` | Dependencies (unchanged) |
| `.npmrc` / `.yarnrc` | `bunfig.toml` | Package manager config |
| `jest.config.js` | `bunfig.toml` (test section) | Test configuration |
| `tsconfig.json` | `tsconfig.json` | TypeScript config (unchanged) |

## Testing

### Test Execution

| Task | Old (Jest) | New (Bun) |
|------|-----------|-----------|
| Run all tests | `jest` or `npm test` | `bun test` |
| Run specific file | `jest path/to/test.ts` | `bun test path/to/test.ts` |
| Watch mode | `jest --watch` | `bun test --watch` |
| Coverage | `jest --coverage` | `bun test --coverage` |
| Update snapshots | `jest -u` | `bun test -u` |
| Run pattern | `jest --testNamePattern="pattern"` | `bun test --test-name-pattern="pattern"` |

### Test Syntax

Test syntax is **identical** - Bun is Jest-compatible:

```typescript
// Works the same in both Jest and Bun
describe('My Test Suite', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do something', () => {
    expect(result).toBe(expected);
  });
});
```

Mocking is slightly different but compatible:
```typescript
// Jest
jest.mock('./module');

// Bun (also supports jest.mock)
import { mock } from 'bun:test';
mock.module('./module', () => ({
  default: mockImplementation
}));
```

## Advanced Features

### Bun-Specific Commands

These commands have no direct npm/yarn equivalent:

| Command | Purpose |
|---------|---------|
| `bun init` | Initialize new project |
| `bun create <template>` | Create from template |
| `bun upgrade` | Upgrade Bun itself |
| `bun pm cache` | Manage package cache |
| `bun pm bin` | Show bin directory |
| `bun pm hash` | Show lockfile hash |

### Performance Tools

| Task | Old | New | Improvement |
|------|-----|-----|-------------|
| Install time | 30-60s (yarn) | 5-10s (bun) | 6-12x faster |
| Test time | 5-8s (Jest) | 2-3s (bun) | 2-3x faster |
| Startup time | 3-4s (nodemon) | <1s (bun --watch) | 3-4x faster |

## Migration Examples

### Example 1: Installing Dependencies

**Before:**
```bash
# Clone repo
git clone https://github.com/user/repo
cd repo

# Install with yarn
yarn install

# Takes 30-60 seconds
```

**After:**
```bash
# Clone repo
git clone https://github.com/user/repo
cd repo

# Install with bun
bun install

# Takes 5-10 seconds ⚡
```

### Example 2: Development Workflow

**Before:**
```bash
# Terminal 1: Backend with nodemon
cd packages/backend
yarn dev  # Uses nodemon, takes 3-4s to start

# Terminal 2: Frontend with Vite
cd packages/frontend
npm run dev

# Terminal 3: Watch tests with Jest
cd packages/backend
yarn test:watch  # Slower test execution
```

**After:**
```bash
# Terminal 1: Backend with Bun watch
cd packages/backend
bun run dev  # Instant startup ⚡

# Terminal 2: Frontend with Vite via Bun
cd packages/frontend
bun run dev

# Terminal 3: Watch tests with Bun
cd packages/backend
bun test --watch  # 2-3x faster ⚡
```

### Example 3: CI/CD Pipeline

**Before (GitHub Actions):**
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v3
  with:
    node-version: '18'

- name: Install dependencies
  run: yarn install
  # Takes 30-60 seconds in CI

- name: Run tests
  run: yarn test
  # Takes 5-8 seconds
```

**After (GitHub Actions):**
```yaml
- name: Setup Bun
  uses: oven-sh/setup-bun@v1
  with:
    bun-version: latest

- name: Install dependencies
  run: bun install
  # Takes 5-10 seconds ⚡

- name: Run tests
  run: bun test
  # Takes 2-3 seconds ⚡
```

### Example 4: Docker Deployment

**Before:**
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
# Slow installation

COPY . .
RUN yarn build

CMD ["node", "dist/index.js"]
```

**After:**
```dockerfile
FROM oven/bun:1

WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install
# Much faster installation ⚡

COPY . .
RUN bun run build

CMD ["bun", "run", "start"]
```

## Common Pitfalls & Solutions

### Pitfall 1: Forgetting to Update Scripts

**Problem:**
```json
{
  "scripts": {
    "dev": "nodemon src/index.ts"  // ❌ Still using nodemon
  }
}
```

**Solution:**
```json
{
  "scripts": {
    "dev": "bun --watch src/index.ts"  // ✅ Use Bun watch
  }
}
```

### Pitfall 2: Using npm/yarn Commands

**Problem:**
```bash
npm install express  # ❌ Old habit
```

**Solution:**
```bash
bun add express  # ✅ Use Bun
```

### Pitfall 3: Expecting node_modules Structure

**Problem:** Bun uses a different node_modules structure (flat by default)

**Solution:** This is usually not an issue, but if you need Node.js-compatible structure:
```toml
# bunfig.toml
[install]
exact = true  # More deterministic
```

### Pitfall 4: Native Dependencies

**Problem:** Some native Node.js C++ addons might not work

**Solution:** 
- Check Bun compatibility: https://bun.sh/docs/runtime/nodejs-apis
- Most packages work fine (Express, OpenAI, Firebase, etc.)
- If needed, use Node.js for specific scripts

## Quick Reference Card

Print this for your desk:

```
┌─────────────────────────────────────────────────────┐
│         NPM/YARN → BUN QUICK REFERENCE              │
├─────────────────────────────────────────────────────┤
│ yarn install          →  bun install                │
│ yarn add <pkg>        →  bun add <pkg>              │
│ yarn remove <pkg>     →  bun remove <pkg>           │
│ yarn run <script>     →  bun run <script>           │
│ npx <cmd>             →  bunx <cmd>                 │
│ node file.js          →  bun file.js                │
│ ts-node file.ts       →  bun file.ts                │
│ nodemon --watch src   →  bun --watch src/index.ts   │
│ jest                  →  bun test                   │
│ jest --watch          →  bun test --watch           │
│ jest --coverage       →  bun test --coverage        │
├─────────────────────────────────────────────────────┤
│ Performance Improvements:                           │
│ • Install: 6-12x faster                             │
│ • Tests: 2-3x faster                                │
│ • Startup: 3-4x faster                              │
└─────────────────────────────────────────────────────┘
```

## Additional Resources

- **Bun Documentation**: https://bun.sh/docs
- **Migration Guide**: See `BUN_MIGRATION.md` in this repository
- **Bun vs Node.js**: https://bun.sh/docs/runtime/nodejs-apis
- **Package Compatibility**: https://bun.sh/docs/runtime/modules

---

**Remember:** When in doubt, replace `npm`/`yarn` with `bun` and it usually just works! ⚡
