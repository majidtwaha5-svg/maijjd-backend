# Maijjd Platform

This repository contains the Maijjd web platform (frontend React app and backend Node/Express API).

## Monorepo Structure

- `frontend_maijjd/` – React app (static build served on Railway)
- `backend_maijjd/` – Express API (JWT auth, Stripe integration stubs, AI endpoints, payments, etc.)

## System Requirements

- Node.js 18+
- npm 9+
- (Optional) MongoDB if you enable DB features

## Environment Setup

Create a `.env` in each service or set variables in Railway:

Backend (`backend_maijjd`):
- NODE_ENV=development|production
- PORT=5001
- JWT_SECRET=change-me
- FRONTEND_BASE_URL=http://localhost:3000
- STRIPE_SECRET_KEY=sk_test_xxx
- STRIPE_PUBLISHABLE_KEY=pk_test_xxx
- (Optional) STRIPE_WEBHOOK_SECRET=whsec_xxx
- (Optional) SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/SMTP_FROM

Frontend (`frontend_maijjd`):
- REACT_APP_API_URL=http://localhost:5001/api

## Installation

From the repo root, in two terminals:

Frontend
```
cd frontend_maijjd
npm ci
npm start
```

Backend
```
cd backend_maijjd
npm ci
npm start
```

## Usage

- Visit http://localhost:3000 for the app
- API at http://localhost:5001/api

## Deploy to Railway (Auto‑deploy from GitHub)

1. Push this repo to GitHub.
2. In Railway > New Project > Deploy from GitHub > select repo.
3. Create two services:
   - Backend: root `backend_maijjd`, Start `npm start` (Railway PORT), Health `/api/health`.
   - Frontend: root `frontend_maijjd`, Build `npm ci && npm run build`, Start `npx serve -s build -l $PORT`.
4. Set variables above for each service.
5. Enable Auto‑Deploys on main so every push deploys with zero downtime.
6. Add custom domains (e.g., `www.maijjd.com` and `api.maijjd.com`) in Railway service settings and point DNS CNAME accordingly.

## Stripe (Test Mode First)

- Set `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` test keys in Railway (backend).
- (Optional) Add a webhook to `/api/payments/webhook` and set `STRIPE_WEBHOOK_SECRET`.
- When ready, swap to live keys only.

## Prohibited Uses (Professional Features)

The following are not allowed on this platform or its deployment environment:

- Mirrors / Userbots or API‑abusing clones
- Crypto miners
- DMCA‑protected or pirated content
- Torrent aggregators or promotion
- VNC / Virtual desktops / remote GUI hosts
- Anything illegal

## Screenshots / Diagrams / Performance Charts

- Add real screenshots of the UI to `docs/screenshots/` and link them here.
- Add real architecture diagrams to `docs/diagrams/` (e.g., draw.io exports) and link them here.
- Add performance charts from test runs to `docs/performance/`.

## License

MIT (see LICENSE)

# Maijjd - Professional Software Solutions

A modern, full-stack web application showcasing professional software solutions and development services.

## 🚀 Features

- **Modern React Frontend**: Built with React 18, Tailwind CSS, and Lucide React icons
- **Node.js Backend API**: Express.js server with comprehensive REST API
- **Responsive Design**: Mobile-first approach with beautiful UI/UX
- **Contact Management**: Contact form with email notifications
- **Software Showcase**: Comprehensive software solutions catalog
- **User Authentication**: JWT-based authentication system
- **Docker Support**: Complete containerization for easy deployment
- **Production Ready**: Optimized for production deployment

## 📁 Project Structure

```
Maijjd_Full_Project/
├── frontend_maijjd/          # React frontend application
│   ├── public/              # Static files
│   ├── src/                 # Source code
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   └── ...
│   ├── package.json        # Frontend dependencies
│   └── Dockerfile          # Frontend container
├── backend_maijjd/          # Node.js backend API
│   ├── routes/             # API routes
│   ├── server.js           # Main server file
│   ├── package.json        # Backend dependencies
│   └── Dockerfile          # Backend container
├── docs/                   # Documentation
├── docker-compose.yml      # Docker orchestration
├── nginx.conf             # Nginx configuration
└── README.md              # This file
```

## 🚀 Deployment Scripts

### Available Deployment Options

| Script | Description | Use Case |
|--------|-------------|----------|
| **`deploy-super-quick.sh`** | 🚀 **Recommended** - Auto-detects environment, zero config | First-time setup, quick testing |
| **`deploy-now-ultimate.sh`** | ⚡ **Ultimate** - One-liner deployment | Fastest possible deployment |
| `quick-deploy.sh` | 🐳 Docker-focused deployment with options | Production Docker deployment |
| `local-dev.sh` | 💻 Local development with hot reload | Development and debugging |
| `deploy-now.sh` | 🎯 Simple Docker deployment | Basic container deployment |

### Why Use Super-Quick?

- **Zero Configuration** - Works out of the box
- **Smart Auto-Detection** - Chooses best method automatically  
- **Fallback Support** - Falls back to local if Docker unavailable
- **Auto-Setup** - Creates all necessary files and configs
- **Cross-Platform** - Works on macOS, Linux, and Windows

## 🛠️ Technology Stack

### Frontend
- **React 18**: Modern React with hooks and functional components
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Lucide React**: Beautiful icons
- **Axios**: HTTP client for API calls

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **JWT**: Authentication and authorization
- **bcryptjs**: Password hashing
- **express-validator**: Input validation
- **cors**: Cross-origin resource sharing
- **helmet**: Security headers

### DevOps
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Nginx**: Reverse proxy and load balancer
- **MongoDB**: Database (optional)
- **Redis**: Caching (optional)

## 🚀 Quick Start

### 🚀 Super-Quick Deployment (Recommended)

**The fastest way to get started - just one command!**

```bash
# Make executable and deploy
chmod +x deploy-super-quick.sh && ./deploy-super-quick.sh

# Or use the ultimate one-liner
./deploy-now-ultimate.sh
```

This script will:
- Auto-detect your system and choose the best deployment method
- Set up everything automatically (Docker or local)
- Start all services with optimal configuration
- Open your browser automatically (macOS)

**No configuration needed!** 🎉

### Prerequisites

- Node.js 18+ and npm (for local development)
- Docker and Docker Compose (for containerized deployment)
- Git

### Option 1: Super-Quick Deployment (Recommended)

#### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend_maijjd
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will be available at `http://localhost:3000`

#### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend_maijjd
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The backend API will be available at `http://localhost:5000`

### Option 2: Docker Deployment

1. Clone the repository:
```bash
git clone <repository-url>
cd Maijjd_Full_Project
```

2. Start all services with Docker Compose:
```bash
docker-compose up -d
```

3. Access the application:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- Nginx (reverse proxy): `http://localhost:80`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Endpoints

#### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile

#### Contact
- `POST /contact` - Submit contact form
- `GET /contact` - Get all contact requests (admin)
- `GET /contact/:id` - Get contact request by ID
- `PATCH /contact/:id/status` - Update contact status

#### Software
- `GET /software` - Get all software
- `GET /software/categories` - Get software categories
- `GET /software/:id` - Get software by ID
- `GET /software/category/:categoryId` - Get software by category

#### Services
- `GET /services` - Get all services
- `GET /services/:id` - Get service by ID
- `GET /services/category/:category` - Get services by category

#### Users
- `GET /users` - Get all users (admin)
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

## 🎨 Customization

### Styling
The application uses Tailwind CSS for styling. You can customize the design by:

1. Modifying `frontend_maijjd/tailwind.config.js` for theme customization
2. Updating `frontend_maijjd/src/index.css` for custom styles
3. Modifying component classes in the React components

### Content
- Update content in the React components under `frontend_maijjd/src/pages/`
- Modify API responses in the backend routes under `backend_maijjd/routes/`
- Update images and assets in `frontend_maijjd/public/`

## 🔧 Configuration

### Environment Variables

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NAME=Maijjd
REACT_APP_VERSION=1.0.0
```

#### Backend (.env)
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-here
CORS_ORIGIN=http://localhost:3000
```

## 🚀 Deployment

### Production Deployment

1. **Build the application**:
```bash
# Frontend
cd frontend_maijjd
npm run build

# Backend
cd backend_maijjd
npm install --production
```

2. **Deploy with Docker**:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

3. **Set up environment variables** for production:
   - Update JWT_SECRET
   - Configure database connections
   - Set up SSL certificates
   - Configure domain names

### Cloud Deployment

#### AWS
- Use AWS ECS for container orchestration
- Deploy to AWS RDS for database
- Use AWS S3 for static assets
- Configure AWS CloudFront for CDN

#### Google Cloud
- Use Google Cloud Run for serverless deployment
- Deploy to Google Cloud SQL for database
- Use Google Cloud Storage for static assets

#### Azure
- Use Azure Container Instances
- Deploy to Azure SQL Database
- Use Azure Blob Storage for static assets

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS configuration
- Security headers with Helmet
- Input validation with express-validator
- Rate limiting
- HTTPS enforcement in production

## 📊 Monitoring

- Health check endpoints
- Error logging
- Performance monitoring
- User analytics (can be integrated)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Email: info@maijjd.com
- Phone: +1 (872) 312-2293
- Documentation: Check the `docs/` folder

## 🎯 Roadmap

- [ ] User dashboard
- [ ] Admin panel
- [ ] Real-time notifications
- [ ] Payment integration
- [ ] Multi-language support
- [ ] Mobile app
- [ ] Advanced analytics
- [ ] API documentation with Swagger

---

**Built with ❤️ by the Maijjd Team**
