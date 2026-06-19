# HireAI – AI-Powered Candidate Ranking & Semantic Alignment Platform

🚀 **Live Application:** [https://hireai-frontend-qqvb.onrender.com](https://hireai-frontend-qqvb.onrender.com)

HireAI is an enterprise AI recruitment platform that performs candidate parsing, semantic matching, skill gap evaluations, and behavioral analytics.

## Technologies Used

### Frontend
- **React.js & TypeScript**
- **Vite** (Build Tool)
- **Tailwind CSS v4** (Design System)
- **Recharts** (Visual Analytics)
- **Axios** (API Client)
- **Lucide Icons**

### Backend
- **FastAPI**
- **SQLite** (SQLAlchemy ORM)
- **Sentence Transformers** (`all-MiniLM-L6-v2` embedding model)
- **RapidFuzz** (Fuzzy skill matching)
- **PyPDF2 / pdfplumber** (Resume parsing)
- **Pandas / NumPy** (Analytics compilation)

---

## Getting Started

### Prerequisites
- **Node.js** (v20+)
- **Python** (3.11+)
- **Docker & Docker Compose** (optional)

---

## 1. Local Local Setup (Recommended for Dev)

### Start the FastAPI Backend
1. Open a terminal in the `./backend` directory.
2. Initialize and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows PowerShell:
   .\venv\Scripts\Activate.ps1
   # On Unix:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the development server on port 8000:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   *Note: Database schemas are initialized and pre-seeded on startup.*

### Start the Vite React Frontend
1. Open a terminal in the `./frontend` directory.
2. Install node dependencies:
   ```powershell
   # If running PowerShell with script restrictions, use npm.cmd:
   npm.cmd install
   ```
3. Start the Vite development hot-reload server:
   ```powershell
   npm.cmd run dev
   ```
4. Access the web app in your browser at: `http://localhost:5173`.

---

## 2. Running via Docker Compose (Single Command)

To run both services orchestrating port forwarding and volume mapping, execute the following from the root directory:

```bash
docker-compose up --build
```

- **Frontend**: served on `http://localhost` (port 80)
- **Backend API**: served on `http://localhost:8000`
- **Model Download**: `all-MiniLM-L6-v2` is pre-cached during the Docker build stage.
