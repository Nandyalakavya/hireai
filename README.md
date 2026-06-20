# HireAI – AI-Powered Candidate Ranking & Semantic Alignment Platform

🚀 **Live Application:** [https://hireai-frontend-qqvb.onrender.com](https://hireai-frontend-qqvb.onrender.com)
(The network should be stable and if and data doesnot occur colse it and reopen it.)
example JD
(Software Developer — Full Stack Engineer
Technology / Software Development • 1-4 years experience
Preferred Skills: Node, MongoDB, Docker, AWS, TypeScript, CI/CD Required Skills
Python, React.js, JavaScript, REST API, SQL, Git.
Responsibilities
Design and develop scalable web applications
Build responsive frontend interfaces using React.js
Develop and maintain RESTful APIs
Integrate databases and third-party services
Write clean, maintainable, and testable code
Debug and optimize application performance
Collaborate with cross-functional teams
Participate in code reviews and Agile development processes
Raw Description Text
We are looking for a Software Developer with expertise in full-stack web development and modern software engineering practices. Responsibilities include developing scalable frontend and backend applications, building REST APIs, integrating databases, and optimizing application performance. Candidates should have strong Python and React.js skills, experience with SQL databases, Git version control, and a solid understanding of software development principles. Preferred qualifications include experience with Docker, AWS, and modern deployment workflows. Requirements: 1–4 years of experience in software development and strong problem-solving abilities.)

"Resume should be saved as name_resume"


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
