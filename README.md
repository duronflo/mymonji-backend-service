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

## API Documentation

The MyMonji Backend Service provides comprehensive RESTful API endpoints for OpenAI integration, Firebase data management, and multi-prompt analysis capabilities.

### Base URL
```
http://localhost:3001
```

### Authentication
Currently, no authentication is required. Future versions may implement API key authentication.

### Response Format
All API endpoints return responses in the following format:

```json
{
  "success": boolean,
  "data": any | null,
  "error": string | null,
  "message": string | null
}
```

---

### Chat/OpenAI Endpoints

#### POST `/api/chat/send-message`
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

#### POST `/api/chat/validate-key`
Validate OpenAI API key.

**Request Body:**
```json
{
  "apiKey": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": boolean
  }
}
```

#### GET `/health`
Health check endpoint.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 12345
  }
}
```

---

### Firebase/User Management Endpoints

#### GET `/users`
Get all users with their basic information (uid and email).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "uid": "string",
      "email": "string"
    }
  ],
  "message": "Retrieved X users successfully"
}
```

#### POST `/user/:uid/recommendations`
Generate personalized financial recommendations for a specific user.

**URL Parameters:**
- `uid` (string, required): User ID

**Request Body:**
```json
{
  "startDate": "YYYY-MM-DD" | null,
  "endDate": "YYYY-MM-DD" | null,
  "includeDebugInfo": boolean,
  "task": "weekly-report" | "overall-report" | null,
  "tasks": ["weekly-report", "overall-report"] | null
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uid": "string",
    "recommendations": [
      {
        "category": "string",
        "advice": "string"
      }
    ],
    "taskResults": [
      {
        "type": "weekly-report" | "overall-report",
        "content": "string",
        "usage": {
          "promptTokens": "number",
          "completionTokens": "number",
          "totalTokens": "number"
        },
        "model": "string",
        "timestamp": "Date"
      }
    ],
    "debug": {
      "firebaseUserData": "any",
      "firebaseExpenseData": "any[]",
      "openaiResponse": "string",
      "openaiInput": "any",
      "openaiUsage": {
        "promptTokens": "number",
        "completionTokens": "number",
        "totalTokens": "number"
      },
      "processingTime": "number",
      "multiPromptInputs": "any[]",
      "multiPromptOutputs": "any[]",
      "totalUsage": {
        "promptTokens": "number",
        "completionTokens": "number",
        "totalTokens": "number"
      }
    }
  }
}
```

#### POST `/user/:uid/multi-prompt-analysis`
Generate multi-prompt analysis for a specific user with selected task. **This is the dedicated endpoint for clear multi-prompt API calls.**

**URL Parameters:**
- `uid` (string, required): User ID

**Request Body:**
```json
{
  "task": "weekly-report" | "overall-report",
  "tasks": ["weekly-report", "overall-report"],
  "startDate": "YYYY-MM-DD" | null,
  "endDate": "YYYY-MM-DD" | null,
  "includeDebugInfo": boolean
}
```

**Note:** Either `task` or `tasks` parameter is required for this endpoint.

**Response:** Same format as `/user/:uid/recommendations`

**Example Request:**
```bash
curl -X POST http://localhost:3001/user/abc123/multi-prompt-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "task": "weekly-report",
    "startDate": "2024-01-01",
    "endDate": "2024-01-07",
    "includeDebugInfo": true
  }'
```

---

### Batch Processing Endpoints

#### POST `/batch/run`
Start a batch job to process all users.

**Request Body:**
```json
{
  "startDate": "YYYY-MM-DD" | null,
  "endDate": "YYYY-MM-DD" | null,
  "includeDebugInfo": boolean
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "started",
    "jobId": "string"
  }
}
```

#### GET `/batch/:jobId/status`
Get the status of a batch job.

**URL Parameters:**
- `jobId` (string, required): Batch job ID

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "string",
    "status": "pending" | "running" | "completed" | "failed",
    "processedUsers": "number",
    "durationSec": "number",
    "debug": {
      "sampleFirebaseUserData": "any",
      "sampleFirebaseExpenseData": "any[]",
      "sampleOpenaiResponse": "string",
      "sampleOpenaiInput": "any",
      "sampleOpenaiUsage": {
        "promptTokens": "number",
        "completionTokens": "number",
        "totalTokens": "number"
      },
      "totalUsers": "number",
      "processingErrors": ["string"]
    }
  }
}
```

---

### Multi-Prompt Task Types

The system supports the following task types for multi-prompt analysis:

#### `weekly-report`
Analyzes the last 7 days of expense data with the following specifications:
- Highlights emotional drivers: categories with strongly negative avg. emotion (≤ -3) and strongly positive avg. emotion (≥ +3)
- Marks outliers (≥ P95 of the last 6 weeks or > 2× category average)
- Delivers "What stood out?" as 3 bullet points
- Returns structured JSON with detailed financial KPIs

**Expected Response Format:**
```json
{
  "report_period": {
    "start": "YYYY-MM-DD",
    "end": "YYYY-MM-DD"
  },
  "kpis": {
    "total_expenses_eur": "number",
    "avg_expense_eur": "number",
    "transactions_count": "number",
    "top_categories": [
      {"category": "string", "amount_eur": "number"}
    ],
    "highest_emotion_day": {
      "date": "YYYY-MM-DD",
      "avg_emotion": "number"
    },
    "lowest_emotion_day": {
      "date": "YYYY-MM-DD", 
      "avg_emotion": "number"
    }
  },
  "emotional_drivers": {
    "strongly_negative": [
      {"category": "string", "avg_emotion": "number"}
    ],
    "strongly_positive": [
      {"category": "string", "avg_emotion": "number"}
    ]
  },
  "outliers": [
    {
      "date": "YYYY-MM-DD",
      "category": "string",
      "amount_eur": "number",
      "reason": "string"
    }
  ],
  "insights": {
    "what_stood_out": [
      "string",
      "string", 
      "string"
    ]
  }
}
```

#### `overall-report`
Creates an overall financial report using the same role and context as weekly report. Currently implemented as a HelloWorld placeholder:

**Expected Response Format:**
```json
{
  "message": "Hello World - Overall report placeholder"
}
```

---

### Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK`: Successful request
- `400 Bad Request`: Invalid request parameters
- `404 Not Found`: Resource not found (user, batch job, etc.)
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Firebase not configured

**Error Response Format:**
```json
{
  "success": false,
  "error": "Error description",
  "message": "HTTP status message"
}
```

---

### Rate Limiting

The API implements rate limiting to prevent abuse:
- **Window**: 15 minutes (900,000ms)
- **Max Requests**: 100 per window per IP
- **Headers**: Rate limit info included in response headers

---

### Usage Examples

#### Get User Recommendations
```bash
curl -X POST http://localhost:3001/user/abc123/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2024-01-01",
    "endDate": "2024-01-31", 
    "includeDebugInfo": true
  }'
```

#### Get Weekly Report Analysis
```bash
curl -X POST http://localhost:3001/user/abc123/multi-prompt-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "task": "weekly-report",
    "includeDebugInfo": false
  }'
```

#### Get All Users
```bash
curl http://localhost:3001/users
```

#### Start Batch Job
```bash
curl -X POST http://localhost:3001/batch/run \
  -H "Content-Type: application/json" \
  -d '{
    "includeDebugInfo": true
  }'
```

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
