import json
import logging
from sqlalchemy.orm import Session
from app.database.models import Candidate, JobDescription

logger = logging.getLogger(__name__)

def seed_data(db: Session):
    """Seed database with initial candidate and job description data matching screenshots."""
    if db.query(JobDescription).count() > 0:
        logger.info("Database already seeded.")
        return

    logger.info("Seeding database with initial HireAI dataset...")

    # 1. Add Job Description
    jd = JobDescription(
        title="Senior ML Engineer — LLM & Retrieval Systems",
        required_skills=json.dumps(["Python", "LLM", "RAG", "Embeddings", "Vector Database", "PyTorch"]),
        preferred_skills=json.dumps(["LangChain", "LlamaIndex", "FAISS", "Hugging Face"]),
        min_experience=5.0,
        max_experience=9.0,
        industry="Technology / AI",
        keywords=json.dumps(["Machine Learning", "LLM", "RAG", "Search", "Information Retrieval"]),
        responsibilities=json.dumps([
            "Design and implement LLM pipelines",
            "Optimize vector search query performance",
            "Build RAG pipelines",
            "Fine-tune sentence embedding models"
        ]),
        raw_text=(
            "We are looking for a Senior ML Engineer with expertise in LLMs, RAG, and retrieval systems. "
            "Responsibilities include building scalable vector search applications, fine-tuning embedding models, "
            "and implementing state-of-the-art retrieval pipelines. Requirements: 5-9 years of experience, "
            "strong Python and PyTorch skills, and hands-on experience with vector databases."
        ),
        is_active=True
    )
    db.add(jd)
    db.flush()

    # 2. Add Candidates
    candidates_data = [
        {
            "id": "C001",
            "name": "Priya Sharma",
            "email": "priya.sharma@example.com",
            "phone": "+1 (555) 234-5678",
            "skills": ["Python", "LLM", "RAG", "Embeddings", "PyTorch", "FastAPI", "SQLAlchemy", "Git", "Docker", "AWS", "NLP", "Scikit-learn", "Pandas", "NumPy"],
            "experience": 7.2,
            "education": [{"degree": "Master of Science", "field": "Computer Science / AI", "school": "Georgia Institute of Technology"}],
            "certifications": ["AWS Certified Machine Learning", "TensorFlow Developer"],
            "projects": [{"name": "Enterprise Search Engine", "description": "Built a semantic search tool using FAISS and custom embeddings for over 100k internal documents."}],
            "summary": "Experienced Machine Learning Engineer specializing in NLP, Retrieval-Augmented Generation (RAG), and Large Language Models. Built and deployed multiple semantic search systems.",
            "career_history": [
                {"title": "Senior ML Engineer", "company": "TechNLP Solutions", "duration": "3 years", "description": "Designed and deployed RAG pipelines for legal tech analytics."},
                {"title": "Machine Learning Engineer", "company": "DataScale Systems", "duration": "4 years", "description": "Developed NLP classifiers and sentiment analysis pipelines."}
            ],
            "source": "dataset",
            "profile_completeness": 95.0, "recent_activity": 85.0, "response_rate": 90.0,
            "recruiter_interest": 95.0, "interview_success": 85.0
        },
        {
            "id": "C002",
            "name": "James Chen",
            "email": "james.chen@example.com",
            "phone": "+1 (555) 345-6789",
            "skills": ["Python", "Machine Learning", "NLP", "TensorFlow", "Scikit-learn", "Pandas", "NumPy", "SQL", "Git", "Docker"],
            "experience": 5.0,
            "education": [{"degree": "Bachelor of Science", "field": "Statistics and Computer Science", "school": "University of Illinois"}],
            "certifications": ["Deep Learning Specialization"],
            "projects": [{"name": "Financial Risk Modeler", "description": "Developed predictive risk models using tabular data, achieving a 12% improvement in accuracy."}],
            "summary": "Data Scientist with 5 years of experience in financial modeling, forecasting, and NLP. Eager to transition to a role focused on Generative AI and retrieval systems.",
            "career_history": [
                {"title": "Data Scientist", "company": "Apex Financial", "duration": "3 years", "description": "Built predictive models for risk assessment and market analysis."},
                {"title": "Junior Data Analyst", "company": "FinInsights", "duration": "2 years", "description": "Performed exploratory data analysis and visual dashboard creation."}
            ],
            "source": "dataset",
            "profile_completeness": 80.0, "recent_activity": 70.0, "response_rate": 65.0,
            "recruiter_interest": 75.0, "interview_success": 76.0
        },
        {
            "id": "C003",
            "name": "Amara Johnson",
            "email": "amara.johnson@example.com",
            "phone": "+1 (555) 456-7890",
            "skills": ["Python", "LLM", "RAG", "Embeddings", "PyTorch", "Transformers", "Deep Learning", "TensorFlow", "Kubernetes", "Docker", "AWS", "FastAPI", "NLP", "Vector Database", "Hugging Face"],
            "experience": 8.5,
            "education": [{"degree": "Ph.D.", "field": "Computer Science - Generative AI", "school": "Stanford University"}],
            "certifications": ["NVIDIA DLI Certificate for LLM Fine-tuning"],
            "projects": [{"name": "Neural Retrieval Framework", "description": "Published research and built open-source code for sparse-dense hybrid retrieval algorithms."}],
            "summary": "Lead AI Researcher and Engineer with extensive experience in neural retrieval, sentence embeddings, and fine-tuning open-source LLMs like Llama and Mistral.",
            "career_history": [
                {"title": "Lead AI Engineer", "company": "DeepMinded Labs", "duration": "3.5 years", "description": "Led team of 4 working on dense retrieval and embedding fine-tuning."},
                {"title": "AI Research Scientist", "company": "SiliconAI", "duration": "5 years", "description": "Conducted research on Transformer models and neural encoders."}
            ],
            "source": "dataset",
            "profile_completeness": 98.0, "recent_activity": 95.0, "response_rate": 92.0,
            "recruiter_interest": 95.0, "interview_success": 90.0
        },
        {
            "id": "C004",
            "name": "Raj Patel",
            "email": "raj.patel@example.com",
            "phone": "+1 (555) 567-8901",
            "skills": ["Python", "Django", "Flask", "PostgreSQL", "Redis", "Docker", "AWS", "Git", "Celery", "REST APIs"],
            "experience": 6.0,
            "education": [{"degree": "Bachelor of Technology", "field": "Information Technology", "school": "IIT Bombay"}],
            "certifications": ["AWS Solutions Architect Associate"],
            "projects": [{"name": "E-commerce Microservices Platform", "description": "Redesigned a legacy monolith application into decoupled microservices, scaling to 15k users."}],
            "summary": "Senior backend developer with a passion for designing scalable API microservices and data pipelines. Looking to build backend systems supporting AI applications.",
            "career_history": [
                {"title": "Senior Backend Engineer", "company": "ShopCart Corp", "duration": "3 years", "description": "Built and managed backend database schemas and caching architectures."},
                {"title": "Software Developer", "company": "WebCraft", "duration": "3 years", "description": "Developed web applications and custom ETL data pipelines."}
            ],
            "source": "dataset",
            "profile_completeness": 75.0, "recent_activity": 50.0, "response_rate": 60.0,
            "recruiter_interest": 55.0, "interview_success": 50.0
        },
        {
            "id": "C005",
            "name": "Sofia Martinez",
            "email": "sofia.martinez@example.com",
            "phone": "+1 (555) 678-9012",
            "skills": ["Python", "Kubernetes", "Docker", "MLOps", "AWS", "PyTorch", "Terraform", "CI/CD", "Git", "FastAPI", "Pandas", "NumPy", "Kafka"],
            "experience": 6.5,
            "education": [{"degree": "Master of Engineering", "field": "Software Engineering", "school": "MIT"}],
            "certifications": ["Kubernetes Certified Administrator (CKA)"],
            "projects": [{"name": "ML Model Deployment Pipeline", "description": "Created automated MLOps pipelines using Kubeflow for testing and monitoring model drift."}],
            "summary": "MLOps and Platform engineer focused on building robust infrastructure for deploying and monitoring machine learning models in production environments.",
            "career_history": [
                {"title": "ML Platform Engineer", "company": "ScaleAI Infrastructure", "duration": "2.5 years", "description": "Built model registries and automated GPU scheduling in Kubernetes."},
                {"title": "DevOps Engineer", "company": "SysCloud", "duration": "4 years", "description": "Automated deployments and managed cloud infrastructure."}
            ],
            "source": "dataset",
            "profile_completeness": 85.0, "recent_activity": 80.0, "response_rate": 75.0,
            "recruiter_interest": 85.0, "interview_success": 80.0
        }
    ]

    for c in candidates_data:
        candidate = Candidate(
            id=c["id"], name=c["name"], email=c["email"], phone=c["phone"],
            skills=json.dumps(c["skills"]), experience=c["experience"],
            education=json.dumps(c["education"]), certifications=json.dumps(c["certifications"]),
            projects=json.dumps(c["projects"]), summary=c["summary"],
            career_history=json.dumps(c["career_history"]), source=c["source"],
            profile_completeness=c["profile_completeness"], recent_activity=c["recent_activity"],
            response_rate=c["response_rate"], recruiter_interest=c["recruiter_interest"],
            interview_success=c["interview_success"]
        )
        db.add(candidate)

    db.commit()
    logger.info("Successfully seeded database.")
