# Adaptive News Bias Detection & Educational Intelligence Platform



![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.95+-009688?style=flat-square&logo=fastapi&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0+-CC2927?style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?style=flat-square&logo=postgresql&logoColor=white)
![React](https://img.shields.io/badge/JavaScript-Vanilla_ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![JWT](https://img.shields.io/badge/Auth-JWT_+_bcrypt-000000?style=flat-square&logo=jsonwebtokens)
![GCP](https://img.shields.io/badge/Cloud-GCP_Ready-4285F4?style=flat-square&logo=googlecloud&logoColor=white)
![IEEE](https://img.shields.io/badge/Published-IEEE_2025-00629B?style=flat-square)

> A production grade, role segregated news analysis platform that dynamically adapts its analytical depth, interface complexity, and AI generated output to the user's educational profile  from school students to UPSC civil services aspirants.

   

## Overview

The Adaptive News Bias Detection Platform is a full stack AI intelligence system built to address a fundamental gap in news literacy tooling: existing bias detection tools produce a single, undifferentiated output regardless of who is reading it. This platform inverts that assumption.

By embedding the user's educational profile directly into the JWT token at authentication time, the system routes each request through a role aware response engine that produces structurally distinct outputs  emoji based summaries for school students, structured pros/cons analysis for graduates, and UPSC Mains format answer drafts for civil services aspirants  all from the same ingested article.

The architecture enforces this separation at every layer: separate frontend modules per role, separate API response schemas per role, and backend middleware that validates role claims before serving any data.

   

## Key Features

  **Adaptive Bias Engine**  Detects political lean (Left / Center / Right / Neutral) and formats the entire output payload based on the requesting user's `age_group` and `education_level` extracted from the JWT
  **Role Segregated Frontend**  Three completely independent frontend modules (`school_dashboard.js`, `graduate_dashboard.js`, `upsc_dashboard.js`), each with its own CSS design system, layout architecture, and API parsing logic
  **Polymorphic API Responses**  A single `/dashboard data` endpoint returns three structurally distinct JSON schemas depending on the authenticated user's role
  **UPSC Intelligence Layer**  Dedicated endpoints for GS Paper mapping (GS1–GS4), policy implication extraction, essay point generation, and structured Mains answer drafting
  **Secure Stateless Authentication**  JWT tokens with embedded role claims, bcrypt password hashing, and RBAC middleware that blocks cross role API access with HTTP 403
  **GCP Cloud Ready Architecture**  Environment based configuration switching between local development (Ollama + local PostgreSQL) and GCP production (Cloud Run + Cloud SQL + Cloud Storage)
  **LRU Caching Layer**  In memory caching on the AI microservice eliminates redundant embedding generation for repeated semantic queries

   

![Architecture Diagram](./architecture1.png)  

## Tech Stack

| Layer | Technology |
|   |   |
| **Frontend** | Vanilla JavaScript (ES6+), HTML5, CSS3 (independent per role stylesheets) |
| **Backend** | Python 3.9+, FastAPI, SQLAlchemy 2.0 (async) |
| **Database** | PostgreSQL 15, SQLAlchemy ORM |
| **AI / ML** | RAG pipeline, FAISS (vector indexing), SentenceTransformers (`all MiniLM L6 v2`) |
| **LLM Integration** | OpenAI API, Ollama / LLaMA 3 (local inference) |
| **Authentication** | JWT (python jose), bcrypt (passlib), RBAC middleware |
| **Architecture** | Microservices, RESTful APIs, LRU caching |
| **Cloud** | GCP Cloud Run, Cloud SQL, Cloud Storage, Firebase Hosting (deployment ready) |
| **DevOps** | Docker, Cloud Build CI/CD, Cloud Logging, Cloud Monitoring |

   

## Role Based User Experience

The platform enforces three completely separate experiences at both the routing and rendering layers.

### School Dashboard `/school/*`
**Target:** Ages 10–18

  Pastel gradient UI with 20px border radius cards and Nunito typeface (18–20px)
  Emoji based bias indicators (🔵 Left / 🔴 Right / ⚖️ Balanced / ⬜ Neutral)
  Single sentence "What is this about?" explanations
  Vocabulary helper: automatically extracts words over 8 characters and maps them to plain language definitions
  Bottom tab navigation (mobile first)
  Animated card entrance (CSS keyframe bounce)

### Graduate Dashboard `/graduate/*`
**Target:** Ages 18–30

  Two column layout (260px sidebar + fluid main content)
  Bias percentage bar (0–100%) color graded from blue (left) to red (right)
  Chart.js doughnut chart showing bias distribution across analyzed articles
  Structured Pros / Cons two column breakdown per article
  Historical context paragraph and clickable topic tag filtering
  DM Sans typeface, 15px body, professional neutral color system

### UPSC Dashboard `/upsc/*`
**Target:** Ages 22–30+ (Civil Services Aspirants)

  Three column dark layout (200px left sidebar + fluid center + 240px right panel)
  GS Paper classification per article (GS1: History/Society, GS2: Polity/Governance, GS3: Economy/Environment, GS4: Ethics)
  GS Paper progress tracker with animated fill bars
  Structured Mains answer drafts (Introduction → Body → Conclusion, ~150–200 words)
  Essay point extraction (5–7 copyable bullet points per article)
  Policy implication analysis and linked government scheme detection
  Constitutional article cross referencing
  7 day current affairs calendar view
  IBM Plex Sans typeface, 13px body, dark navy (`#0D1B2A`) color system

   

## Project Structure

```
news_bias_platform/
├── backend/
│   ├── main.py               # FastAPI entry point + CORS + startup
│   ├── dashboard_user.py     # Core role aware API router
│   ├── models.py             # SQLAlchemy User + NewsItem ORM models
│   ├── auth.py               # JWT generation, bcrypt, role dependency
│   ├── bias_engine.py        # Bias detection + age based output formatter
│   ├── gcp_storage.py        # Cloud Storage PDF handler (GCP ready)
│   ├── gcp_config.py         # Environment based config (local / GCP)
│   ├── cloud_logging_setup.py# Structured Cloud Logging integration
│   └── database.py           # Async SQLAlchemy session (local + Cloud SQL)
│
├── frontend/
│   ├── shared/
│   │   ├── api.js            # Centralized fetch utility + auth headers
│   │   └── router.js         # JWT guard + role based page redirect
│   ├── school/
│   │   ├── dashboard.html
│   │   ├── news view.html
│   │   ├── learning.html
│   │   ├── school_dashboard.js
│   │   └── school.css
│   ├── graduate/
│   │   ├── dashboard.html
│   │   ├── news analysis.html
│   │   ├── history.html
│   │   ├── graduate_dashboard.js
│   │   └── graduate.css
│   └── upsc/
│       ├── dashboard.html
│       ├── news analysis.html
│       ├── mains generator.html
│       ├── current affairs.html
│       ├── upsc_dashboard.js
│       └── upsc.css
│
├── auth/
│   ├── login.html
│   └── signup.html
│
├── Dockerfile                # Cloud Run production container (FastAPI)
├── Dockerfile.rag            # Cloud Run container (RAG microservice)
├── cloudbuild.yaml           # GCP Cloud Build CI/CD pipeline
├── firebase.json             # Firebase Hosting config (React/Vanilla JS)
├── .env.gcp                  # Environment variable template
└── requirements.txt
```

   

## API Reference

| Method | Endpoint | Auth | Description |
|   |   |   |   |
| `POST` | `/auth/signup` | None | Register user with age group and education level; returns JWT + redirect path |
| `POST` | `/auth/login` | None | Authenticate user; returns JWT + role based redirect path |
| `GET` | `/dashboard data` | JWT | Returns role differentiated JSON (school / graduate / upsc schema) |
| `POST` | `/news/analyze` | JWT | Ingests article; returns age appropriate bias analysis and summary |
| `GET` | `/upsc/current affairs` | JWT (civil_services only) | Last 7 days of articles grouped by date |
| `GET` | `/upsc/mains generator` | JWT (civil_services only) | Generates structured Mains answer for a given topic |
| `POST` | `/news/upload pdf` | JWT | Uploads PDF to Cloud Storage; triggers RAG pipeline |

   

## Database Schema

### `users`
| Column | Type | Description |
|   |   |   |
| `id` | Integer PK | Auto increment primary key |
| `username` | String(50) | Unique, indexed |
| `email` | String(120) | Unique, indexed |
| `hashed_password` | String(255) | bcrypt hash |
| `age_group` | String(30) | `school_beginner` / `school_advanced` / `graduate` / `graduate_advanced` / `civil_services_expert` |
| `education_level` | String(30) | `school` / `graduate` / `civil_services` |
| `interest_domain` | JSON | `["politics", "economy", ...]` |
| `learning_mode` | String(20) | `visual` / `analytical` / `exam_prep` |

### `news_items`
| Column | Type | Description |
|   |   |   |
| `id` | Integer PK | Auto increment primary key |
| `user_id` | Integer FK | References `users.id` |
| `title` | String(500) | Article title |
| `content` | Text | Full article body |
| `bias_label` | String(20) | `left` / `center` / `right` / `neutral` |
| `bias_score` | Float | 0.0 (left) → 1.0 (right) |
| `explanation_level` | String(20) | `school` / `graduate` / `upsc` |
| `gs_paper` | String(10) | GS1–GS4 (UPSC only) |
| `mains_answer` | Text | Structured Mains draft (UPSC only) |
| `essay_points` | JSON | Extracted essay bullet points (UPSC only) |

   

## Local Development Setup

### Prerequisites
  Python 3.9+
  PostgreSQL 15+
  Ollama (optional, for local LLM inference)

### Backend

```bash
cd backend
python  m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install  r requirements.txt

# Copy and configure environment
cp .env.gcp .env
# Set ENVIRONMENT=local, DATABASE_URL=postgresql+asyncpg://...

uvicorn main:app   reload   port 8000
```

### RAG Microservice

```bash
cd rag_service
uvicorn rag_service:app   reload   port 8001
```

### Frontend

```bash
# Serve with any static server
python  m http.server 8080  d frontend/

# Or with Node
npx serve frontend/  p 8080
```

Open `http://localhost:8080/auth/signup.html` to begin.

   

## GCP Cloud Deployment

The project includes full GCP deployment configuration. Set `ENVIRONMENT=gcp` in your environment to activate cloud services.

| Local | GCP Equivalent |
|   |   |
| Local PostgreSQL | Cloud SQL (db f1 micro, free tier) |
| Local file storage | Cloud Storage bucket |
| `python  m http.server` | Firebase Hosting |
| FastAPI on localhost | Cloud Run (containerized) |
| RAG service on localhost | Cloud Run (separate container) |
| `print()` logging | Cloud Logging (structured JSON) |

```bash
# Deploy all services via Cloud Build
gcloud builds submit   config cloudbuild.yaml

# Frontend only
npm run build && firebase deploy   only hosting
```

Recommended region: `asia south1` (Mumbai).

   

## Security Model

  All API routes require a valid JWT in the `Authorization: Bearer <token>` header
  JWT payload embeds `education_level` and `age_group` at login time
  A `require_role(role)` FastAPI dependency validates the JWT role claim on every protected endpoint
  Cross role access (e.g., a school user requesting `/upsc/*`) returns HTTP 403
  Passwords are hashed using bcrypt with salt rounds; plaintext passwords are never stored or logged
  Frontend `router.js` validates the JWT on every page load and redirects to the correct role specific page, preventing manual URL navigation to other role dashboards

   

## Achievements & Recognition

  **IEEE 2025**  Published: *"MultiAI Based System to Automatically Detect Bias in News Articles Using NLP Techniques"*
  **ISIH 2024 Winner**  Smart India Hackathon 2024, representing Smt. Kashibai Navale College of Engineering, Pune

   

## Roadmap

  **LLM Upgrade**  Replace keyword heuristic bias engine with a fine tuned local LLM (LLaMA 3 via Ollama) for nuanced semantic bias detection
  **Gamification Expansion**  Extend the reading streak and points system to reward balanced cross perspective reading habits
  **Real Time Debate Rooms**  WebSocket based collaborative discussion rooms for Graduate level users on shared articles
  **RAGAS Evaluation**  Integrate RAGAS / DeepEval for continuous RAG pipeline quality monitoring
  **Mobile Application**  React Native port of the School dashboard for offline first news literacy access

   

## Author

**Soham Gurav**
B.E. Computer Engineering, Smt. Kashibai Navale College of Engineering, Pune (2022–2026)
GPA: 8.55 | GDG Open Source Contributor & Team Lead

[![LinkedIn](https://img.shields.io/badge/LinkedIn Connect 0A66C2?style=flat square&logo=linkedin)](https://linkedin.com)
[![GitHub](https://img.shields.io/badge/GitHub Profile 181717?style=flat square&logo=github)](https://github.com)
[![Email](https://img.shields.io/badge/Email Contact EA4335?style=flat square&logo=gmail)](mailto:sohamgurav.skn.comp@gmail.com)

   

*This project was developed independently as a portfolio demonstration of full stack AI engineering, role based system design, and adaptive UX architecture.*
