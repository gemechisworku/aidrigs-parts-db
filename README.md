# AidRigs Parts Database System

A comprehensive international auto-parts database and sales system with multi-language support, dynamic RBAC, and advanced features for managing parts inventory, suppliers, vehicles, pricing, and quotes.

## 🏗️ Architecture

**Mono-repo Structure:**
```
aidrigs-parts-db/
├── backend/          # FastAPI (Python)
├── frontend/         # React + TypeScript
├── infra/            # Infrastructure configs
└── docker-compose.yml
```

**Technology Stack:**
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: FastAPI + SQLAlchemy + Alembic
- **Database**: PostgreSQL 15
- **Infrastructure**: Docker + Docker Compose

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Python 3.11+
- Node.js 18+
- Poetry (for backend local development)

### Running with Docker (Recommended)

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd aidrigs-parts-db
   ```

2. **Start all services:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health

4. **Stop services:**
   ```bash
   docker-compose down
   ```

5. **Stop and remove volumes (clean slate):**
   ```bash
   docker-compose down -v
   ```

## 🛠️ Local Development

### Backend Setup

1. **Navigate to backend:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   poetry install
   ```

3. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run database migrations:**
   ```bash
   poetry run alembic upgrade head
   ```

5. **Start the server:**
   ```bash
   poetry run uvicorn app.main:app --reload
   ```

6. **Access API:**
   - API: http://localhost:8000
   - Swagger Docs: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

### Frontend Setup

1. **Navigate to frontend:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start dev server:**
   ```bash
   npm run dev
   ```

5. **Access frontend:**
   - App: http://localhost:5173

## 📦 Core Features

- ✅ **Parts & Part-Translation modules** with approval-based CRUD
- ✅ **Dynamic Role-Based Access Control (RBAC)**
- ✅ **Supplier management**
- ✅ **Vehicle catalog & cross-references**
- ✅ **Pricing engine & quote history**
- ✅ **Advanced search & filtering**
- ✅ **Comprehensive auditing & logging**

## 🗂️ Project Structure

### Backend (`/backend`)
```
backend/
├── app/
│   ├── main.py           # FastAPI application
│   ├── api/              # API routes
│   ├── core/             # Core config & database
│   ├── models/           # SQLAlchemy models
│   └── schemas/          # Pydantic schemas
├── alembic/              # Database migrations
├── pyproject.toml        # Poetry dependencies
└── Dockerfile
```

### Frontend (`/frontend`)
```
frontend/
├── src/
│   ├── main.tsx          # App entry point
│   ├── App.tsx           # Main component
│   ├── pages/            # Page components
│   └── index.css         # Global styles
├── package.json
├── vite.config.ts
└── Dockerfile
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
poetry run pytest
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## 📝 Database Migrations

### Create a new migration:
```bash
cd backend
poetry run alembic revision --autogenerate -m "description"
```

### Apply migrations:
```bash
poetry run alembic upgrade head
```

### Rollback:
```bash
poetry run alembic downgrade -1
```

## 🐳 Docker Commands

### Build and start:
```bash
docker-compose up --build
```

### Run in background:
```bash
docker-compose up -d
```

### View logs:
```bash
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Restart a service:
```bash
docker-compose restart backend
```

### Execute command in container:
```bash
docker-compose exec backend bash
docker-compose exec db psql -U aidrigs -d aidrigs_parts_db
```

## 🔒 Environment Variables

### Backend (`.env`)
```
DATABASE_URL=postgresql://user:password@localhost:5432/aidrigs_parts_db
API_HOST=0.0.0.0
API_PORT=8000
SECRET_KEY=your-secret-key
```

### Frontend (`.env`)
```
VITE_API_URL=http://localhost:8000
```

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests
4. Submit a pull request

## 📄 License

[Add your license here]

## 👥 Team

AidRigs Development Team

---

**Status**: ✅ Step 1 Complete - Project Scaffold Initialized
