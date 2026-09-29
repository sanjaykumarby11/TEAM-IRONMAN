# 📊 Project Report & System Architecture

## Architecture Summary
The system adopts a modular full-stack architecture with clear layer separation:
- **Backend Service (`backend/`)**: Python Flask 3 backend featuring modular Routers, Services, Schemas, Models, Utilities, and Database Manager.
- **Frontend SPA (`frontend/`)**: Modern JavaScript ES Module single page application with component-driven UI (`src/components`), dedicated pages (`src/pages`), and API service adapters (`src/services`).
- **Database**: Embedded SQLite (`system.db`) with relational integrity, foreign key cascades, and automated schema seeding.
- **Security**: JWT-based stateless authentication (`Bearer <token>`) combined with Role-Based Access Control (RBAC).
