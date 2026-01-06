# MyMonji Backend Service

Monorepo for:
- **Backend:** Bun/TypeScript microservice (Express, Firebase, OpenAI)
- **Frontend:** React visualization page

> **⚡ Now powered by Bun!** This project has been migrated from Node.js/npm/yarn to [Bun](https://bun.sh) for faster development, testing, and deployment.

## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Get started in 5 minutes
- **[BUN_MIGRATION.md](./BUN_MIGRATION.md)** - Complete migration guide and Bun documentation
- **[COMMAND_REFERENCE.md](./COMMAND_REFERENCE.md)** - Quick command reference (npm/yarn → bun)
- **[MIGRATION_CHECKLIST.md](./MIGRATION_CHECKLIST.md)** - Step-by-step migration checklist

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.0+) - Fast all-in-one JavaScript runtime
- [OpenAI API Key](https://platform.openai.com/api-keys)

#### Installing Bun

**macOS, Linux & WSL:**
```bash
curl -fsSL https://bun.sh/install | bash
```

**Verify installation:**
```bash
bun --version
```

> **Note:** Bun replaces Node.js, npm, yarn, ts-node, nodemon, and Jest in this project.

### Environment Setup

1. **Backend Configuration**
   ```bash
   cd packages/backend
   cp .env.example .env
   ```
   
   Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

2. **Frontend Configuration**
   ```bash
   cd packages/frontend
   cp .env.example .env
   ```
   
   Edit `.env` to configure the backend API URL:
   ```
   VITE_API_URL=http://localhost:3001
   VITE_APP_NAME=MyMonji Frontend
   VITE_APP_VERSION=1.0.0
   ```

### Install Dependencies

```bash
bun install
```

This installs dependencies for all workspace packages.

> **⚡ Performance:** Bun installs packages 10-25x faster than npm/yarn (typically 5-10 seconds vs 30-60 seconds)

### Verify Setup

Run the verification script to ensure everything is configured correctly:

```bash
bun run verify-setup.ts
```

This checks Bun installation, dependencies, environment files, and build artifacts.

### Development

#### Backend

```bash
cd packages/backend
bun run dev
```

The backend server will start on `http://localhost:3001` (or the port specified in your `.env` file).

> **Bun's watch mode** automatically reloads on file changes - no need for nodemon!

#### Frontend

```bash
cd packages/frontend
bun run dev
```

The frontend will start on `http://localhost:3000`.

### Building for Production

#### Backend

```bash
cd packages/backend
bun run build
bun run start
```

#### Frontend

```bash
cd packages/frontend
bun run build
bun run preview
```

### Testing

#### Backend Tests

```bash
cd packages/backend
bun test
```

Run tests with coverage:
```bash
bun test --coverage
```

Run tests in watch mode:
```bash
bun test --watch
```

> **Bun's built-in test runner** is Jest-compatible and 2-3x faster than Jest.

---

## Features

### OpenAI Integration
- **System Specification Configuration**: Define role, background story, personality, and rules for your AI assistant
- **Type-Safe API Communication**: Full TypeScript implementation with proper error handling
- **Real-time Chat Interface**: Modern React-based chat UI with responsive design
- **Message History**: Track conversation flow with timestamps and message types

### Backend API
- **RESTful Endpoints**: Clean API design for message sending and validation
- **Security Middleware**: CORS, rate limiting, and security headers
- **Error Handling**: Comprehensive error handling with meaningful error messages
- **Environment Configuration**: Flexible configuration for different environments

### Frontend Interface
- **System Configuration Panel**: Easy-to-use form for configuring AI behavior
- **Chat Interface**: Clean, modern chat UI with message bubbles
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Live message updates and loading states

---

## API Endpoints

### POST `/api/chat/send-message`
Send a message to OpenAI with system specification.

**Request Body:**
```json
{
  "systemSpec": {
    "role": "string",
    "background": "string",
    "rules": ["string"],
    "personality": "string"
  },
  "userMessage": {
    "content": "string",
    "timestamp": "Date"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content": "string",
    "timestamp": "Date",
    "usage": {
      "promptTokens": "number",
      "completionTokens": "number",
      "totalTokens": "number"
    },
    "model": "string"
  }
}
```

### POST `/api/chat/validate-key`
Validate OpenAI API key.

### GET `/api/chat/health`
Health check endpoint.

---

## Project Structure

```
/
├── package.json
├── packages/
│   ├── backend/                # Node.js Express API
│   │   ├── src/
│   │   │   ├── routes/        # API route definitions
│   │   │   ├── services/      # Business logic and OpenAI integration
│   │   │   ├── types/         # TypeScript type definitions
│   │   │   ├── middleware/    # Express middleware
│   │   │   ├── tests/         # Unit and integration tests
│   │   │   └── index.ts       # Main application entry point
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── .env.example
│   └── frontend/              # React TypeScript application
│       ├── src/
│       │   ├── components/    # React components
│       │   ├── services/      # API service layer
│       │   ├── types/         # TypeScript type definitions
│       │   └── App.tsx        # Main React component
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       └── .env.example
```

---

## Technology Stack

### Backend
- **Bun** - Fast all-in-one JavaScript runtime & toolkit
- **Express.js** - Web server framework
- **TypeScript** - Type safety and modern JavaScript features
- **OpenAI SDK** - Official OpenAI API integration
- **Bun Test** - Built-in fast test runner with Jest compatibility
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security middleware
- **Rate Limiting** - API abuse prevention

### Frontend
- **React 19** - Modern React with hooks
- **TypeScript** - Full type safety
- **Vite** - Fast build tool and dev server (runs via Bun)
- **Modern CSS** - Custom responsive design with gradients
- **ESLint** - Code linting and quality

---

## Development Guidelines

### Type Safety
All code uses TypeScript with strict mode enabled. Shared types between frontend and backend ensure consistency.

### Error Handling
- Backend: Comprehensive error handling with proper HTTP status codes
- Frontend: User-friendly error messages and loading states

### Testing
- Backend: Unit tests for services and integration tests for API endpoints
- Test coverage reporting available

### Security
- Rate limiting to prevent API abuse
- CORS configuration for cross-origin requests
- Input validation and sanitization
- Environment variable management

---

## Troubleshooting

### Common Issues

1. **OpenAI API Key Issues**
   - Ensure your API key is valid and has sufficient credits
   - Check that the key is properly set in the `.env` file

2. **Port Conflicts**
   - Change the PORT in backend `.env` if 3001 is in use
   - Update VITE_API_URL in frontend `.env` accordingly

3. **CORS Issues**
   - Ensure FRONTEND_URL in backend `.env` matches your frontend URL
   - Check that both servers are running

4. **Build Issues**
   - Delete `node_modules` and reinstall dependencies
   - Clear Bun cache: `rm -rf ~/.bun/install/cache`

### Support

For issues and questions, please check the following:
1. Ensure all environment variables are properly configured
2. Verify that all dependencies are installed (`bun install`)
3. Check that both backend and frontend servers are running
4. Review the console for any error messages

---

## Why Bun?

This project has been migrated to Bun for significant performance and developer experience improvements:

### Performance Benefits
- **10-25x faster** package installation (5-10s vs 30-60s)
- **2-3x faster** test execution
- **Instant** TypeScript execution (no compilation needed for development)
- **Lower** memory usage

### Developer Experience
- **All-in-one toolkit**: Runtime, package manager, test runner, and bundler
- **Zero configuration**: TypeScript and JSX work out of the box
- **Built-in watch mode**: No need for nodemon or similar tools
- **Jest-compatible**: Existing tests work with minimal changes

### Learn More
- [BUN_MIGRATION.md](./BUN_MIGRATION.md) - Complete migration guide and documentation
- [Bun Documentation](https://bun.sh/docs) - Official Bun documentation
- [Bun GitHub](https://github.com/oven-sh/bun) - Source code and issues

### Quick Command Reference

| Task | Bun Command |
|------|-------------|
| Install dependencies | `bun install` |
| Run dev server | `bun run dev` |
| Run tests | `bun test` |
| Build project | `bun run build` |
| Run production | `bun run start` |

> **Migration Note**: All previous npm/yarn commands have been replaced with Bun equivalents. The project no longer requires Node.js, npm, yarn, ts-node, nodemon, or Jest to be installed separately.
