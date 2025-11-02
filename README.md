# Maijjd Backend API

A simple, reliable backend API for the Maijjd platform, optimized for Railway deployment.

## 🚀 Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Development mode:**
   ```bash
   npm run dev
   ```

### Railway Deployment

This backend is configured for Railway deployment with:
- Automatic health checks
- Environment variable support
- Graceful shutdown handling

## 📡 API Endpoints

- `GET /` - Root health check
- `GET /health` - Health check endpoint
- `GET /api/health` - API health check
- `GET /api` - API information
- `GET /api/info` - Detailed API info

## 🔧 Configuration

Copy `env.example` to `.env` and configure your environment variables:

```bash
cp env.example .env
```

## 📦 Dependencies

- **express** - Web framework
- **cors** - Cross-origin resource sharing
- **helmet** - Security headers
- **dotenv** - Environment variables

## 🏗️ Project Structure

```
backend_maijjd/
├── server.js          # Main server file
├── package.json       # Dependencies and scripts
├── railway.json       # Railway deployment config
├── env.example        # Environment variables template
├── .railwayignore     # Files to exclude from Railway
└── README.md          # This file
```

## 🌐 Railway Deployment

1. Connect your GitHub repository to Railway
2. Set the root directory to `backend_maijjd`
3. Deploy automatically on push

## 📊 Health Checks

Railway will automatically check:
- `GET /api/health` - Should return 200 OK
- Timeout: 300 seconds
- Retry policy: On failure, max 3 retries

## 🔒 Security

- Helmet.js for security headers
- CORS enabled
- Input validation
- Error handling

## 📝 License

MIT License
