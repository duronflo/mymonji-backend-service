# Quick Start Guide - Bun Migration

This guide will help you quickly get started with the Bun-powered MyMonji Backend Service.

## 🚀 5-Minute Setup

### 1. Install Bun (if not already installed)

```bash
curl -fsSL https://bun.sh/install | bash
```

Restart your terminal or run:
```bash
source ~/.bashrc  # or source ~/.zshrc for zsh
```

Verify installation:
```bash
bun --version  # Should show 1.0.0 or higher
```

### 2. Clone and Install

```bash
# If you haven't cloned yet
git clone https://github.com/duronflo/mymonji-backend-service.git
cd mymonji-backend-service

# Install all dependencies (5-10 seconds with Bun!)
bun install
```

### 3. Configure Environment

```bash
# Backend environment
cp packages/backend/.env.example packages/backend/.env

# Edit packages/backend/.env and add your OpenAI API key:
# OPENAI_API_KEY=sk-your-actual-key-here

# Frontend environment (optional, defaults work fine)
cp packages/frontend/.env.example packages/frontend/.env
```

### 4. Build Shared Types

```bash
cd packages/shared
bun run build
cd ../..
```

### 5. Start Development Servers

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd packages/backend
bun run dev
```

**Terminal 2 - Frontend:**
```bash
cd packages/frontend
bun run dev
```

### 6. Test It Out!

- Backend API: http://localhost:3001/health
- Frontend: http://localhost:3000

You're ready to develop! 🎉

## 🔍 Verify Your Setup

Run the verification script:

```bash
bun run verify-setup.ts
```

This will check that everything is properly configured.

## 📚 Common Commands

```bash
# Install dependencies
bun install

# Add a new package
bun add <package-name>

# Remove a package
bun remove <package-name>

# Run tests
cd packages/backend
bun test

# Run tests with coverage
bun test --coverage

# Build for production
cd packages/shared && bun run build
cd ../backend && bun run build
cd ../frontend && bun run build

# Start production backend
cd packages/backend
bun run start
```

## 🐛 Troubleshooting

### Bun command not found
```bash
# Reinstall Bun
curl -fsSL https://bun.sh/install | bash

# Add to PATH manually if needed
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
```

### Port already in use
```bash
# Find and kill the process
lsof -i :3001  # or :3000 for frontend
kill -9 <PID>
```

### Module not found errors
```bash
# Clean install
rm -rf node_modules bun.lockb
bun install

# Rebuild shared types
cd packages/shared && bun run build
```

### Tests failing
```bash
# Make sure shared types are built
cd packages/shared && bun run build

# Run tests with verbose output
cd packages/backend
bun test --verbose
```

## 📖 Need More Help?

- **Comprehensive Guide**: See [BUN_MIGRATION.md](./BUN_MIGRATION.md)
- **Command Reference**: See [COMMAND_REFERENCE.md](./COMMAND_REFERENCE.md)
- **Bun Documentation**: https://bun.sh/docs
- **Bun Discord**: https://bun.sh/discord

## 🔄 Switching from Node.js/yarn?

### What Changed

1. **Runtime**: Node.js → Bun
2. **Package Manager**: yarn → bun
3. **Lock File**: yarn.lock → bun.lockb
4. **Test Runner**: Jest → Bun test
5. **Dev Server**: nodemon → bun --watch

### Migration Checklist

- [ ] Install Bun
- [ ] Remove `node_modules` and `yarn.lock`
- [ ] Run `bun install`
- [ ] Update scripts in `package.json` (already done!)
- [ ] Test your application

### Performance Improvements

- ⚡ **10-25x faster** package installation
- ⚡ **2-3x faster** test execution  
- ⚡ **Instant** TypeScript execution
- ⚡ **Lower** memory usage

## 🐳 Docker Quick Start

### Using Docker Compose

```bash
# Build and start services
docker-compose -f docker-compose.bun.yml up -d

# View logs
docker-compose -f docker-compose.bun.yml logs -f

# Stop services
docker-compose -f docker-compose.bun.yml down
```

### Using Dockerfile

```bash
# Build image
docker build -f Dockerfile.bun -t mymonji-backend:bun .

# Run container
docker run -p 3001:3001 --env-file packages/backend/.env mymonji-backend:bun
```

## 🎓 Learning Path

### New to Bun?

1. **Start Here**: Read [BUN_MIGRATION.md](./BUN_MIGRATION.md) - "What is Bun?" section
2. **Quick Reference**: Use [COMMAND_REFERENCE.md](./COMMAND_REFERENCE.md) for command translations
3. **Official Docs**: Browse https://bun.sh/docs/runtime for deep dives

### Coming from Node.js?

1. **Command Reference**: See [COMMAND_REFERENCE.md](./COMMAND_REFERENCE.md)
2. **Differences**: Read "Differences from Node.js" in [BUN_MIGRATION.md](./BUN_MIGRATION.md)
3. **Practice**: Try the development workflow above

## 💡 Pro Tips

### Speed Up Your Workflow

```bash
# Use bunx for one-off commands (like npx)
bunx create-react-app my-app

# Run TypeScript files directly
bun my-script.ts

# Watch mode for instant reloading
bun --watch src/index.ts

# REPL for quick testing
bun repl
```

### Optimize Your Development

1. **Keep tests running**: `bun test --watch` in a terminal
2. **Use the built-in debugger**: Bun works with standard debuggers
3. **Leverage Bun's APIs**: Check out `Bun.file()`, `Bun.write()`, etc.

### CI/CD Integration

See `.github/workflows/bun-ci.yml.example` for a complete GitHub Actions example.

## 🎯 Next Steps

Now that you're set up:

1. Explore the codebase
2. Make some changes and watch them reload instantly
3. Run tests with `bun test`
4. Read the full docs in [BUN_MIGRATION.md](./BUN_MIGRATION.md)
5. Join the Bun community: https://bun.sh/discord

Happy coding with Bun! ⚡️
