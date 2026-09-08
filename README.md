# 🎬 CineSphere

**Discover movies you would love, from anywhere in the world.**

CineSphere is a global movie and television discovery platform that recommends content based on your taste — not just language or popularity. Discover Telugu thrillers, Korean mysteries, Spanish dramas, and hidden gems from every corner of cinema.

## ✨ Features

- 🌍 **Cross-Language Discovery** — Get recommendations across languages based on taste similarity
- 🎯 **Personalized Recommendations** — Content-based filtering powered by genres, keywords, cast, and director
- 🔍 **Advanced Search** — Search movies, series, actors, and directors with multi-language support
- 💎 **Hidden Gems** — Discover critically acclaimed movies that flew under the radar
- 📋 **Watchlist & Ratings** — Save movies and rate content to improve recommendations
- 🎭 **Mood Discovery** — Find movies by mood and viewing intent
- 🗺️ **Explore by Language/Country/Genre** — First-class browsing by language, country, genre, and era
- 💡 **Explainable Recommendations** — Understand *why* each movie was recommended
- 🎲 **Surprise Me** — One-click curated recommendation with controlled diversity

## 🏗️ Architecture

```
User
 ↓
Next.js Frontend (React, TypeScript, Tailwind CSS)
 ↓
FastAPI Backend (Python, Pydantic)
 ↓
 ├── PostgreSQL (normalized movie data, users, ratings)
 ├── Redis (caching, background jobs)
 ├── TMDB Provider (movie/TV metadata)
 └── Recommendation Engine (content-based filtering)
```

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui, Lucide, Framer Motion |
| **Backend** | Python, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic |
| **Database** | PostgreSQL 16 |
| **Cache** | Redis 7 |
| **Data Provider** | TMDB API |
| **Recommendations** | scikit-learn, NumPy, pandas |
| **Testing** | Vitest, React Testing Library, pytest, Playwright |
| **Infrastructure** | Docker, Docker Compose |
| **CI/CD** | GitHub Actions |

## 📁 Project Structure

```
CineSphere/
├── apps/
│   ├── web/                  # Next.js frontend application
│   └── api/                  # FastAPI backend application
├── services/
│   └── recommender/          # Python recommendation engine
├── database/
│   ├── migrations/           # Database migration files
│   └── schema/               # Schema documentation
├── docs/                     # Project documentation (PRD, Design, Tech)
├── .github/
│   └── workflows/            # GitHub Actions CI/CD
├── .env                      # Local environment variables (git-ignored)
├── .env.example              # Environment variable template
├── docker-compose.yml        # Docker services configuration
└── README.md
```

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) v22+
- [Python](https://www.python.org/) 3.11+
- [Docker](https://www.docker.com/) & Docker Compose
- [TMDB API Key](https://www.themoviedb.org/settings/api)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd CineSphere
```

### 2. Environment Variables

Copy the example environment file and add your credentials:

```bash
cp .env.example .env
```

Edit `.env` and fill in:

| Variable | Description |
|---|---|
| `TMDB_API_KEY` | Your TMDB API v3 key |
| `TMDB_ACCESS_TOKEN` | Your TMDB API Read Access Token (v4) |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `AUTH_SECRET` | Secret key for JWT authentication |
| `NEXT_PUBLIC_API_URL` | Frontend → Backend URL (default: `http://localhost:8000`) |
| `CORS_ORIGINS` | Allowed CORS origins (default: `http://localhost:3000`) |
| `ENVIRONMENT` | `development` or `production` |

> ⚠️ **Never commit `.env` to Git. It is already in `.gitignore`.**

### 3. Start with Docker Compose (Recommended)

Start all services (PostgreSQL, Redis, API, Frontend):

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

### 4. Local Development (Alternative)

#### Start Database Services

```bash
docker compose up postgres redis -d
```

#### Backend

```bash
cd apps/api
python -m venv .venv
.venv\Scripts\activate       # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### Frontend

```bash
cd apps/web
npm install
npm run dev
```

### 5. Database Migrations

```bash
cd apps/api
alembic upgrade head
```

## 🧪 Testing

### Backend Tests

```bash
cd apps/api
python -m pytest tests/ -v
```

### Frontend Tests

```bash
cd apps/web
npm run test:run
```

### End-to-End Tests (Future)

```bash
npx playwright test
```

## 🏥 Health Checks

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | Application health |
| `GET /api/health/db` | PostgreSQL connectivity |
| `GET /api/health/redis` | Redis connectivity |
| `GET /api/health/tmdb` | TMDB API reachability |

## 📦 Build

### Frontend

```bash
cd apps/web
npm run build
```

### Docker

```bash
docker compose build
```

## 🔒 Security

- TMDB credentials are **never** exposed in frontend code
- Frontend communicates only with the FastAPI backend
- API keys are stored in environment variables
- `.env` is git-ignored
- Passwords are stored as secure hashes
- CORS is configured for allowed origins only

## 📚 Documentation

Project documentation is in the `docs/` directory:

- **CineVerse_PRD.docx** — Product Requirements Document
- **CineVerse_Website_Design_Doc.docx** — Website Design Document
- **CineVerse_Tech_Stack_Design_Doc_v1.1.docx** — Technical Architecture & Tech Stack

## 🗺️ Development Roadmap

| Phase | Focus | Status |
|---|---|---|
| Phase 1 | Project Foundation | ✅ Complete |
| Phase 2 | TMDB Integration & Data Normalization | 🔲 Next |
| Phase 3 | Core Frontend (Home, Search, Details) | 🔲 Planned |
| Phase 4 | Authentication, Profile, Watchlist, Ratings | 🔲 Planned |
| Phase 5 | Recommendation Engine | 🔲 Planned |
| Phase 6 | Cross-Language, Hidden Gems, Mood Discovery | 🔲 Planned |
| Phase 7 | Caching, Performance, Accessibility | 🔲 Planned |
| Phase 8 | Advanced AI Recommendations | 🔲 Future |

## 📄 License

This project is private and proprietary.

## 🙏 Attribution

Movie and TV metadata provided by [TMDB](https://www.themoviedb.org/). CineSphere uses the TMDB API but is not endorsed or certified by TMDB.
