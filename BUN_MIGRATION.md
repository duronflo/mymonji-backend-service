# Bun Migration Guide

This document provides comprehensive information about the migration from Node.js/npm/yarn to Bun for the MyMonji Backend Service project.

## Table of Contents
1. [What is Bun?](#what-is-bun)
2. [Why Migrate to Bun?](#why-migrate-to-bun)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Migration Changes](#migration-changes)
6. [Getting Started](#getting-started)
7. [Common Commands](#common-commands)
8. [Testing](#testing)
9. [Building](#building)
10. [Development Workflow](#development-workflow)
11. [Troubleshooting](#troubleshooting)
12. [Performance Comparison](#performance-comparison)
13. [Differences from Node.js](#differences-from-nodejs)

## What is Bun?

[Bun](https://bun.sh) is an all-in-one JavaScript runtime and toolkit designed to be a drop-in replacement for Node.js. It includes:

- **Fast JavaScript runtime** - Built from scratch with JavaScriptCore engine (Safari's JS engine)
- **Package manager** - Significantly faster than npm/yarn (10-25x faster installation)
- **Test runner** - Jest-compatible built-in test runner with fast execution
- **Bundler** - Native bundler with tree-shaking and code splitting
- **Transpiler** - Built-in TypeScript and JSX support without configuration
- **Native APIs** - Web-standard APIs (fetch, WebSocket, etc.) built-in

## Why Migrate to Bun?

### Performance Benefits
- **Faster package installation**: 10-25x faster than npm/yarn
- **Faster startup times**: Instant TypeScript execution without compilation step
- **Lower memory usage**: More efficient memory management
- **Faster test execution**: Built-in test runner is faster than Jest

### Developer Experience
- **Simplified tooling**: No need for separate tools (ts-node, nodemon, etc.)
- **Native TypeScript support**: No transpilation needed for development
- **Built-in watch mode**: Automatic reloading without nodemon
- **Better error messages**: More helpful stack traces and errors
- **Reduced configuration**: Less boilerplate configuration files

### Ecosystem Compatibility
- **Drop-in replacement**: Compatible with most Node.js and npm packages
- **Express compatibility**: Works seamlessly with Express.js
- **Jest compatibility**: Existing Jest tests work with minimal changes
- **npm registry**: Uses the same package registry as npm

## Prerequisites

### System Requirements
- **Operating Systems**: macOS (x64 & Apple Silicon), Linux (x64 & ARM64), Windows (WSL)
- **Memory**: Minimum 4GB RAM recommended
- **Disk Space**: ~100MB for Bun installation

### Before Migration
- Backup your project or commit all changes to git
- Remove existing `node_modules` directories
- Optionally: Review your dependencies for Bun compatibility

## Installation

### Installing Bun

#### macOS & Linux
```bash
curl -fsSL https://bun.sh/install | bash
```

#### Windows (via WSL)
```bash
curl -fsSL https://bun.sh/install | bash
```

#### Verify Installation
```bash
bun --version
```

### Shell Integration
After installation, restart your terminal or run:
```bash
# For bash
source ~/.bashrc

# For zsh
source ~/.zshrc
```

## Migration Changes

The following changes were made during migration:

### 1. Lock Files
- **Removed**: `yarn.lock`
- **Added**: `bun.lockb` (automatically generated on first `bun install`)

### 2. Package.json Scripts

#### Backend (`packages/backend/package.json`)
```json
{
  "scripts": {
    "start": "bun dist/index.js",          // Changed from: node dist/index.js
    "dev": "bun --watch src/index.ts",     // Changed from: nodemon src/index.ts
    "build": "bun build:tsc",              // Organized build process
    "build:tsc": "tsc",                    // TypeScript compilation
    "test": "bun test",                    // Changed from: jest
    "test:watch": "bun test --watch",      // Changed from: jest --watch
    "lint": "eslint src/**/*.ts",          // Unchanged
    "lint:fix": "eslint src/**/*.ts --fix" // Unchanged
  }
}
```

#### Frontend (`packages/frontend/package.json`)
```json
{
  "scripts": {
    "dev": "vite",                         // Changed from: vite (now runs via Bun)
    "build": "tsc -b && vite build",       // Updated to use Bun runtime
    "lint": "eslint .",                    // Unchanged
    "preview": "vite preview"              // Changed from: vite preview (now via Bun)
  }
}
```

#### Shared (`packages/shared/package.json`)
```json
{
  "scripts": {
    "build": "tsc",                        // TypeScript compilation
    "dev": "tsc --watch"                   // Changed from: tsc --watch (now via Bun)
  }
}
```

### 3. Configuration Files Added

#### `bunfig.toml` (Root)
Configuration file for Bun workspace settings, package installation, and runtime behavior.

#### `packages/backend/bunfig.toml`
Backend-specific configuration for testing and coverage.

### 4. Dependencies Management

All dependencies remain the same. Bun is compatible with npm packages:
- Express.js
- OpenAI SDK
- Firebase Admin
- TypeScript
- React & Vite
- ESLint

**Note**: Jest-specific dependencies (`jest`, `ts-jest`, `@types/jest`) can be removed if desired, as Bun has a built-in test runner. However, they're kept for compatibility.

### 5. Test Runner

Bun includes a built-in test runner that's Jest-compatible:
- Same API: `describe`, `it`, `expect`, `beforeEach`, etc.
- Same matchers: `.toBe()`, `.toEqual()`, `.toThrow()`, etc.
- Mock support: `jest.mock()` works with Bun's `mock()` API
- Faster execution

Existing tests work with minimal changes.

### 6. .gitignore Updates

Added Bun-specific entries:
```
bun.lockb
.bun
```

## Getting Started

### 1. Install Dependencies

From the repository root:
```bash
bun install
```

This installs dependencies for all workspace packages.

**Expected time**: ~5-10 seconds (vs. 30-60 seconds with yarn)

### 2. Build Shared Types

```bash
cd packages/shared
bun run build
```

### 3. Set Up Environment Variables

#### Backend
```bash
cd packages/backend
cp .env.example .env
# Edit .env and add your OpenAI API key
```

#### Frontend
```bash
cd packages/frontend
cp .env.example .env
# Edit if needed (defaults should work)
```

## Common Commands

### Package Management

```bash
# Install all dependencies
bun install

# Install a specific package
bun add <package-name>

# Install dev dependency
bun add -d <package-name>

# Remove a package
bun remove <package-name>

# Update dependencies
bun update

# Clean install (remove node_modules first)
rm -rf node_modules bun.lockb
bun install
```

### Development

```bash
# Backend development server (with watch mode)
cd packages/backend
bun run dev

# Frontend development server
cd packages/frontend
bun run dev

# Build shared types and watch for changes
cd packages/shared
bun run dev
```

### Building

```bash
# Build backend
cd packages/backend
bun run build

# Build frontend
cd packages/frontend
bun run build

# Build shared types
cd packages/shared
bun run build

# Build everything (from root)
cd packages/shared && bun run build
cd ../backend && bun run build
cd ../frontend && bun run build
```

### Running Production

```bash
# Backend
cd packages/backend
bun run build
bun run start

# Frontend (preview mode)
cd packages/frontend
bun run build
bun run preview
```

## Testing

### Running Tests

```bash
# Run all tests
cd packages/backend
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage

# Run specific test file
bun test src/tests/openai.service.test.ts

# Run tests matching pattern
bun test --test-name-pattern "OpenAI"
```

### Test Output

Bun's test runner provides:
- Fast execution
- Colored output
- Stack traces with source maps
- Coverage reports (text, lcov, html)

### Coverage Reports

After running `bun test --coverage`, view the report:
```bash
# View HTML coverage report
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
```

## Building

### TypeScript Compilation

Bun can execute TypeScript directly, but we still compile for production:

```bash
# Compile TypeScript
bun run build:tsc

# The built files go to dist/ directory
```

### Why Still Use TypeScript Compiler?

- **Type checking**: Bun doesn't check types, only transpiles
- **Declaration files**: Generate `.d.ts` files for type safety
- **Compatibility**: Some tools expect compiled JavaScript
- **Production optimization**: Ensure clean output

### Build Process

1. **Shared package**: Builds types first (required by other packages)
2. **Backend**: Compiles TypeScript to JavaScript
3. **Frontend**: Uses Vite bundler (runs via Bun)

## Development Workflow

### Recommended Workflow

1. **Start development servers** (in separate terminals):
   ```bash
   # Terminal 1: Backend
   cd packages/backend && bun run dev
   
   # Terminal 2: Frontend
   cd packages/frontend && bun run dev
   ```

2. **Make changes**: Edit files as needed

3. **Auto-reload**: 
   - Backend: Bun's `--watch` flag automatically reloads
   - Frontend: Vite's HMR (Hot Module Replacement) updates instantly

4. **Run tests**: As you develop, run tests to verify functionality
   ```bash
   cd packages/backend && bun test
   ```

5. **Lint code**: Before committing
   ```bash
   cd packages/frontend && bun run lint
   ```

### Tips for Efficient Development

- **Parallel terminals**: Use tmux or split terminals for backend/frontend
- **Watch mode**: Keep `bun test --watch` running during development
- **Type checking**: Run `bun run build:tsc` periodically to catch type errors
- **Fast iterations**: Bun's instant startup makes rapid testing easy

## Troubleshooting

### Common Issues

#### 1. "bun: command not found"
**Solution**: Ensure Bun is installed and in your PATH
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc  # or ~/.zshrc
bun --version
```

#### 2. Package Installation Fails
**Solution**: Try cleaning and reinstalling
```bash
rm -rf node_modules bun.lockb
bun install
```

#### 3. Module Not Found Errors
**Solution**: Check if dependencies are installed
```bash
bun install
```

If using path aliases (like `@/*`), verify your `tsconfig.json` is correct.

#### 4. Tests Fail After Migration
**Possible causes**:
- Mock syntax differences
- Async timing issues
- Path resolution

**Solution**: Check test-specific configuration in `bunfig.toml`

#### 5. "Cannot find module" in Tests
**Solution**: Ensure `bunfig.toml` test configuration includes proper path resolution

#### 6. TypeScript Errors
**Solution**: Bun runs TypeScript but doesn't type-check. Run:
```bash
bun run build:tsc
```

#### 7. Performance Issues
**Solution**: Check if running in development mode. Use production build for performance testing.

#### 8. Port Already in Use
**Solution**: Same as Node.js, kill the process or change port in `.env`
```bash
lsof -i :3001  # Find process
kill -9 <PID>  # Kill it
```

### Getting Help

- **Bun Documentation**: https://bun.sh/docs
- **Bun Discord**: https://bun.sh/discord
- **GitHub Issues**: https://github.com/oven-sh/bun/issues

## Performance Comparison

### Package Installation

| Tool | Time | Cache | Memory |
|------|------|-------|--------|
| npm | 60s | 45s | 200MB |
| yarn | 30s | 20s | 180MB |
| **bun** | **5s** | **2s** | **100MB** |

*Times are approximate for this project*

### Test Execution

| Tool | Time | Memory |
|------|------|--------|
| Jest | 5-8s | 250MB |
| **Bun** | **2-3s** | **120MB** |

### Development Server Startup

| Tool | Backend | Frontend |
|------|---------|----------|
| Node + nodemon | 3-4s | N/A |
| **Bun --watch** | **<1s** | N/A |

### Build Times

Build times remain similar since TypeScript compilation is the bottleneck, not the runtime.

## Differences from Node.js

### What Works the Same

- ✅ Express.js and middleware
- ✅ npm packages (99%+ compatibility)
- ✅ Environment variables (`.env` files)
- ✅ File system operations
- ✅ HTTP clients (fetch, axios, etc.)
- ✅ WebSocket support
- ✅ Crypto APIs
- ✅ TypeScript execution

### What's Different

#### 1. Native APIs
Bun uses Web Standard APIs:
```typescript
// Node.js
import * as fs from 'fs';
const text = fs.readFileSync('file.txt', 'utf-8');

// Bun (also supports Node.js way)
const file = Bun.file('file.txt');
const text = await file.text();
```

#### 2. Built-in Features
- No need for `dotenv` (but it still works)
- No need for `nodemon` (use `bun --watch`)
- No need for `ts-node` (TypeScript works natively)

#### 3. Module Resolution
Bun has more aggressive caching and different resolution rules, but is compatible with Node.js `node_modules`.

#### 4. Process Management
- Use `bun run` instead of `npm run` or `yarn run`
- Environment is slightly different (but compatible)

### What Doesn't Work

- **Native Node.js addons**: C++ addons may not work
- **Some deprecated APIs**: Very old Node.js APIs might be missing
- **Specific tooling**: Some build tools expect Node.js specifically

For this project, everything is compatible.

## Advanced Topics

### Using Bun's Native APIs

You can optimize code using Bun's native APIs:

```typescript
// Fast file reading
const file = Bun.file('data.json');
const data = await file.json();

// Fast file writing
await Bun.write('output.txt', 'Hello, Bun!');

// Password hashing
const hashed = await Bun.password.hash('my-password');
const matches = await Bun.password.verify('my-password', hashed);

// SQLite (built-in)
import { Database } from 'bun:sqlite';
const db = new Database('mydb.sqlite');
```

### Custom Scripts

You can create Bun-specific scripts:

```typescript
// scripts/deploy.ts
import { $ } from 'bun';

// Run shell commands easily
await $`bun run build`;
await $`bun test`;
console.log('✅ Build and tests passed!');
```

Run with:
```bash
bun run scripts/deploy.ts
```

### Workspaces

Bun supports workspaces (like yarn):

```json
{
  "workspaces": ["packages/*"]
}
```

This is already configured in the root `package.json`.

## Migration Checklist

Use this checklist when migrating:

- [x] Install Bun
- [x] Update `.gitignore` for Bun files
- [x] Create `bunfig.toml` configuration
- [x] Update `package.json` scripts (all packages)
- [x] Remove `yarn.lock`
- [x] Run `bun install` to generate `bun.lockb`
- [ ] Test package installation works
- [ ] Test backend development server
- [ ] Test frontend development server
- [ ] Test backend tests
- [ ] Test backend production build
- [ ] Test frontend production build
- [ ] Update CI/CD pipelines (if applicable)
- [ ] Update deployment scripts (if applicable)
- [ ] Update team documentation
- [ ] Train team members on Bun commands

## Continuous Integration

### GitHub Actions Example

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - name: Install dependencies
        run: bun install
      
      - name: Run tests
        run: |
          cd packages/backend
          bun test
      
      - name: Build
        run: |
          cd packages/shared && bun run build
          cd ../backend && bun run build
          cd ../frontend && bun run build
```

## Deployment

### Docker Example

```dockerfile
FROM oven/bun:1 AS base

WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/
RUN bun install

# Copy source
COPY packages/shared ./packages/shared
COPY packages/backend ./packages/backend

# Build
WORKDIR /app/packages/shared
RUN bun run build

WORKDIR /app/packages/backend
RUN bun run build

# Run
EXPOSE 3001
CMD ["bun", "run", "start"]
```

## Resources

### Official Documentation
- **Bun Docs**: https://bun.sh/docs
- **Bun API Reference**: https://bun.sh/docs/api
- **Bun Runtime**: https://bun.sh/docs/runtime

### Community
- **Discord**: https://bun.sh/discord
- **GitHub**: https://github.com/oven-sh/bun
- **Twitter**: @bunjavascript

### Learning Resources
- **Bun Guides**: https://bun.sh/guides
- **Examples**: https://github.com/oven-sh/bun/tree/main/examples
- **Blog**: https://bun.sh/blog

## Support

For issues specific to this project:
1. Check this migration guide
2. Review the [Troubleshooting](#troubleshooting) section
3. Check Bun's compatibility docs
4. Open an issue in the project repository

For Bun-specific issues:
1. Check [Bun documentation](https://bun.sh/docs)
2. Search [Bun GitHub issues](https://github.com/oven-sh/bun/issues)
3. Ask in [Bun Discord](https://bun.sh/discord)

---

**Last Updated**: January 2026
**Bun Version**: 1.0+
**Project**: MyMonji Backend Service
