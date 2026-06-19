# HireAI – AI-Powered Candidate Ranking & Semantic Alignment Platform

🚀 **Live Application:** [https://hireai-frontend-qqvb.onrender.com](https://hireai-frontend-qqvb.onrender.com)

HireAI is an enterprise AI recruitment platform that performs candidate parsing, semantic matching, skill gap evaluations, and behavioral analytics.

## Technologies Used

| Layer                          | Technology                               | Why Selected                                                                                                             |
| ------------------------------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Frontend**                   | React.js + TypeScript                    | Type-safe component architecture for building a scalable, interactive recruitment dashboard with reusable UI components. |
| **Build Tool**                 | Vite                                     | Lightning-fast development server, instant HMR, and optimized production builds.                                         |
| **Styling**                    | Tailwind CSS v4                          | Utility-first CSS framework enabling rapid development and consistent design system implementation.                      |
| **Charts & Analytics**         | Recharts                                 | Lightweight React charting library used for candidate score distributions, ranking trends, and hiring insights.          |
| **API Communication**          | Axios                                    | Promise-based HTTP client with request/response interceptors and error handling support.                                 |
| **Icons**                      | Lucide React                             | Modern SVG icon library providing clean, consistent visual language across the application.                              |
| **Backend Framework**          | FastAPI                                  | High-performance asynchronous Python framework with automatic API documentation and Pydantic validation.                 |
| **Database**                   | SQLite + SQLAlchemy ORM                  | Lightweight embedded database with ORM support for structured candidate, job, and ranking data storage.                  |
| **Semantic Search Model**      | all-MiniLM-L6-v2 (Sentence Transformers) | Generates high-quality 384-dimensional embeddings for semantic candidate-job matching while remaining CPU-efficient.     |
| **Similarity Engine**          | Cosine Similarity                        | Measures semantic closeness between candidate profiles and job descriptions using vector embeddings.                     |
| **Skill Matching Engine**      | RapidFuzz                                | Fast fuzzy matching algorithm capable of identifying skill variations and abbreviations.                                 |
| **Resume Parsing**             | PyPDF2, pdfplumber, python-docx          | Extracts structured information from PDF and DOCX resumes with automatic fallback mechanisms.                            |
| **Data Processing**            | Pandas + NumPy                           | Used for data cleaning, feature engineering, analytics computation, and numerical operations.                            |
| **Machine Learning Utilities** | Scikit-learn                             | Provides similarity metrics, preprocessing tools, evaluation methods, and model utilities.                               |
| **AI Copilot Engine**          | Rule-Based + LLM Ready Architecture      | Generates recruiter insights, candidate summaries, and hiring recommendations.                                           |
| **Containerization**           | Docker + Docker Compose                  | Ensures reproducible deployments and environment consistency across development and production.                          |
| **CI/CD Pipeline**             | GitHub Actions                           | Automates testing, build validation, and deployment workflows on every code push.                                        |
| **Hosting Platform**           | Render                                   | Free-tier cloud deployment platform with GitHub integration and automatic service deployment.                            |


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
   uvicorn app.main:app --reload
   ```
   *Note: Database schemas are initialized and pre-seeded on startup.*

### Start the Vite React Frontend
1. Open a terminal in the `./frontend` directory.
2. Install node dependencies:
   ```bash
   # If running PowerShell with script restrictions, use npm.cmd:
   npm.install
   ```
3. Start the Vite development hot-reload server:
   ```bash
   npm.run dev
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
