# MyMonji Backend Service

MyMonji is a TypeScript monorepo containing a Node.js Express backend service with OpenAI integration and a React frontend for visualization. The application handles chat interactions with OpenAI's API and provides a web interface for users.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Prerequisites and Setup
- Node.js v18+ (tested with v20.19.4)
- Yarn package manager (tested with v1.22.22)
- OpenAI API key for backend functionality

### Bootstrap and Build Process
Bootstrap the entire repository:
```bash
yarn install
```
- Takes approximately 28 seconds. NEVER CANCEL. Set timeout to 60+ seconds.
- Removes mixed package manager warnings by using Yarn exclusively

Build all packages in the correct order:
```bash
# 1. Build shared types first (required dependency)
cd packages/shared && yarn build
```
- Takes approximately 1 second. NEVER CANCEL. Set timeout to 30+ seconds.

```bash
# 2. Build backend 
cd packages/backend && yarn build
```
- Takes approximately 2 seconds. NEVER CANCEL. Set timeout to 30+ seconds.

```bash
# 3. Build frontend
cd packages/frontend && yarn build
```
- Takes approximately 3 seconds. NEVER CANCEL. Set timeout to 60+ seconds.

### Environment Configuration
Always configure environment files before running:

Backend configuration:
```bash
cd packages/backend
cp .env.example .env
# Edit .env with your OpenAI API key:
# OPENAI_API_KEY=your_actual_key_here
```

Frontend configuration:
```bash
cd packages/frontend  
cp .env.example .env
# Default values should work for local development
```

### Development Servers
Start backend development server:
```bash
cd packages/backend && yarn dev
```
- Runs on http://localhost:3001
- Auto-reloads on file changes via nodemon
- Shows environment variable status on startup

Start frontend development server:
```bash  
cd packages/frontend && npm run dev
```
- Runs on http://localhost:3000
- Connects to backend at http://localhost:3001
- Hot module replacement enabled

### Production Builds and Preview
Backend production:
```bash
cd packages/backend && yarn build && yarn start
```

Frontend production preview:
```bash
cd packages/frontend && yarn build && npm run preview  
```
- Preview runs on http://localhost:4173

### Testing
Backend tests (includes both passing service tests and some failing route tests):
```bash
cd packages/backend && yarn test
```
- Takes approximately 3-5 seconds. NEVER CANCEL. Set timeout to 30+ seconds.
- Service tests pass (11/11), but route tests fail (6 failures) - this is a known issue
- Only the OpenAI service tests are reliable for validation

Backend test coverage:
```bash
cd packages/backend && yarn test --coverage
```
- Takes approximately 5 seconds. NEVER CANCEL. Set timeout to 60+ seconds.

### Linting
Frontend linting (works correctly):
```bash
cd packages/frontend && yarn lint
```
- Takes approximately 1 second. NEVER CANCEL. Set timeout to 30+ seconds.

Backend linting (configuration missing - known issue):
```bash
cd packages/backend && yarn lint
```
- **Does not work** - ESLint configuration is missing for backend
- Document this as a known limitation

## Validation and Testing Changes

### Manual API Validation
After making backend changes, validate the API endpoints:

1. Start backend server: `cd packages/backend && yarn dev`
2. Test health endpoint: `curl http://localhost:3001/health`
3. Test API key validation: `curl -X POST http://localhost:3001/api/chat/validate-key -H "Content-Type: application/json" -d '{"apiKey": "test-key"}'`

### Full End-to-End Validation Scenario
Always test the complete user workflow after making changes:

1. Start both servers:
   ```bash
   # Terminal 1: Backend
   cd packages/backend && yarn dev
   
   # Terminal 2: Frontend  
   cd packages/frontend && npm run dev
   ```

2. Open frontend in browser at http://localhost:3000
3. Verify the application loads without console errors
4. Test the chat interface if making frontend changes
5. Check backend logs for proper API communication

### Required Validation Steps Before Committing
- Always run `yarn build` on all packages to ensure no TypeScript errors
- Run `yarn test` in packages/backend to verify service tests still pass
- Run `yarn lint` in packages/frontend to ensure code style compliance
- Manually test API endpoints if backend routes were modified
- Start both dev servers to verify they communicate correctly

## Repository Structure and Key Files

### Monorepo Layout
```
/
├── package.json                 # Root workspace configuration
├── packages/
│   ├── shared/                  # Shared TypeScript types
│   │   ├── src/index.ts         # Type definitions for API contracts
│   │   └── package.json         # Build with: yarn build
│   ├── backend/                 # Node.js Express API
│   │   ├── src/
│   │   │   ├── routes/          # API route definitions
│   │   │   ├── services/        # OpenAI integration service
│   │   │   ├── middleware/      # Express middleware
│   │   │   ├── tests/           # Jest unit tests
│   │   │   └── index.ts         # Main application entry
│   │   ├── .env.example         # Environment template
│   │   ├── jest.config.js       # Test configuration
│   │   └── tsconfig.json        # TypeScript configuration
│   └── frontend/                # React TypeScript application
│       ├── src/
│       │   ├── components/      # React components
│       │   ├── services/        # API service layer
│       │   └── main.tsx         # Application entry point
│       ├── .env.example         # Environment template
│       ├── eslint.config.js     # ESLint configuration (working)
│       └── vite.config.ts       # Vite build configuration
```

### Important Files to Check After Changes
- Always verify `packages/shared/src/index.ts` when modifying API contracts
- Check `packages/backend/src/services/openai.service.ts` after OpenAI integration changes  
- Review `packages/backend/src/routes/chat.routes.ts` when modifying API endpoints
- Validate `packages/frontend/src/services/api.ts` when changing frontend-backend communication

## Known Issues and Limitations

### Backend Testing
- Service tests (OpenAI integration) pass reliably
- Route tests fail due to mocking issues - **this is expected**
- Use `yarn test` to run all tests; service tests passing indicates core functionality works
- Only worry about test failures if service tests start failing

### Backend Linting  
- ESLint configuration missing for backend package
- `yarn lint` command will fail with "ESLint couldn't find a configuration file"
- This does not affect functionality; TypeScript compilation catches syntax errors

### Package Manager
- Use Yarn exclusively - avoid npm commands except for frontend dev server
- Remove package-lock.json if it appears to prevent conflicts

### Port Configuration
- Backend: 3001 (configurable via .env PORT)
- Frontend dev: 3000  
- Frontend preview: 4173
- Ensure no port conflicts when running both servers simultaneously

## Common Commands Reference

### Quick Start (Full Development Environment)
```bash
# 1. Install dependencies
yarn install

# 2. Setup environment files
cd packages/backend && cp .env.example .env
cd ../frontend && cp .env.example .env

# 3. Build shared types
cd ../shared && yarn build

# 4. Start backend (in one terminal)
cd ../backend && yarn dev

# 5. Start frontend (in another terminal)  
cd ../frontend && npm run dev
```

### Build Everything for Production
```bash
cd packages/shared && yarn build
cd ../backend && yarn build  
cd ../frontend && yarn build
```

### Run All Available Tests
```bash
cd packages/backend && yarn test
# Note: Only service tests are reliable; route test failures are expected
```

## Troubleshooting

### Build Failures
- Delete `node_modules` and run `yarn install` again
- Ensure shared types are built first: `cd packages/shared && yarn build`
- Check that all environment files exist

### Server Start Issues  
- Verify PORT availability (default: backend 3001, frontend 3000)
- Check `.env` files are properly configured
- Ensure OpenAI API key is set in backend `.env` for full functionality

### API Communication Issues
- Verify FRONTEND_URL in backend `.env` matches frontend dev server URL
- Check VITE_API_URL in frontend `.env` points to correct backend port
- Ensure CORS is properly configured (handled automatically by the application)