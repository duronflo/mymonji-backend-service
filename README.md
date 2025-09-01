# MyMonji Backend Service

Monorepo for:
- **Backend:** Node.js microservice (Express, Firebase, OpenAI)
- **Frontend:** React visualization page

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Yarn](https://yarnpkg.com/) (`npm install -g yarn`)
- [OpenAI API Key](https://platform.openai.com/api-keys)

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
   
   # Firebase Configuration
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_PRIVATE_KEY=your_firebase_private_key
   FIREBASE_CLIENT_EMAIL=your_firebase_client_email
   # Alternative: use service account key file path
   FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./path/to/serviceAccountKey.json
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
yarn install
```

### Development

#### Backend

```bash
cd packages/backend
yarn dev
```

The backend server will start on `http://localhost:3001` (or the port specified in your `.env` file).

#### Frontend

```bash
cd packages/frontend
npm run dev
```

The frontend will start on `http://localhost:3000`.

### Building for Production

#### Backend

```bash
cd packages/backend
yarn build
yarn start
```

#### Frontend

```bash
cd packages/frontend
npm run build
npm run preview
```

### Testing

#### Backend Tests

```bash
cd packages/backend
yarn test
```

Run tests with coverage:
```bash
yarn test --coverage
```

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

### Firebase Users API

### GET `/api/users`
Get all users from Firebase users2 collection with optional filtering and limiting.

**Query Parameters:**
- `limit` (optional): Maximum number of users to return
- Any other field to filter by (e.g., `name=John`, `email=john@example.com`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string", 
      "email": "string",
      "displayName": "string",
      "photoURL": "string",
      "createdAt": "Date",
      "updatedAt": "Date"
    }
  ],
  "message": "Retrieved X users successfully"
}
```

### GET `/api/users/:id`
Get a specific user by ID.

### POST `/api/users`
Create a new user in Firebase users2 collection.

### PUT `/api/users/:id`
Update an existing user.

### DELETE `/api/users/:id`
Delete a user by ID.

### GET `/api/users/service/health`
Health check endpoint for users service.

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
- **Node.js** with **Express.js** - Web server framework
- **TypeScript** - Type safety and modern JavaScript features
- **OpenAI SDK** - Official OpenAI API integration
- **Firebase Admin SDK** - Firebase Firestore database integration
- **Jest** - Testing framework with coverage reporting
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security middleware
- **Rate Limiting** - API abuse prevention

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Full type safety
- **Vite** - Fast build tool and dev server
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
   - Clear Vite cache: `rm -rf node_modules/.vite`

### Support

For issues and questions, please check the following:
1. Ensure all environment variables are properly configured
2. Verify that all dependencies are installed (`yarn install`)
3. Check that both backend and frontend servers are running
4. Review the console for any error messages
