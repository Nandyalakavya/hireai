import os
import re
import json
import logging
from typing import Dict, Any, List
import pypdf
import pdfplumber
import docx

logger = logging.getLogger(__name__)

COMMON_SKILLS = [
    "python", "javascript", "typescript", "react", "vue", "angular", "node", "express", 
    "fastapi", "django", "flask", "pytorch", "tensorflow", "keras", "scikit-learn", 
    "pandas", "numpy", "matplotlib", "seaborn", "sql", "sqlite", "postgresql", "mysql", 
    "mongodb", "redis", "elasticsearch", "docker", "kubernetes", "aws", "gcp", "azure", 
    "git", "github", "gitlab", "cicd", "jenkins", "terraform", "ansible", "graphql", 
    "html", "css", "tailwind", "bootstrap", "llm", "rag", "langchain", "llamaindex", 
    "faiss", "chromadb", "embeddings", "vector database", "nlp", "deep learning", 
    "machine learning", "data science", "statistics", "c++", "java", "c#", "go", "rust"
]

class ResumeParser:
    @staticmethod
    def extract_text_from_pdf(file_path: str) -> str:
        text = ""
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    content = page.extract_text()
                    if content:
                        text += content + "\n"
        except Exception as e:
            logger.warning(f"pdfplumber failed to parse {file_path}: {e}. Retrying with pypdf...")
            try:
                reader = pypdf.PdfReader(file_path)
                for page in reader.pages:
                    content = page.extract_text()
                    if content:
                        text += content + "\n"
            except Exception as e2:
                logger.error(f"pypdf also failed to parse {file_path}: {e2}")
        return text

    @staticmethod
    def extract_text_from_docx(file_path: str) -> str:
        text = ""
        try:
            doc = docx.Document(file_path)
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
        except Exception as e:
            logger.error(f"docx failed to parse {file_path}: {e}")
        return text

    @staticmethod
    def extract_text_from_txt(file_path: str) -> str:
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        except Exception as e:
            logger.error(f"txt failed to parse {file_path}: {e}")
            return ""

    @classmethod
    def parse_resume(cls, file_path: str) -> Dict[str, Any]:
        """
        Parses resume from file path and returns structured candidate profile.
        """
        ext = os.path.splitext(file_path)[1].lower()
        text = ""
        if ext == ".pdf":
            text = cls.extract_text_from_pdf(file_path)
        elif ext == ".docx":
            text = cls.extract_text_from_docx(file_path)
        elif ext in [".txt", ".md"]:
            text = cls.extract_text_from_txt(file_path)
        else:
            logger.warning(f"Unsupported resume extension {ext}")
            
        # Clean text
        clean_txt = re.sub(r'\s+', ' ', text)
        
        # Heuristically extract fields
        name = cls.extract_name(text)
        email = cls.extract_email(clean_txt)
        phone = cls.extract_phone(clean_txt)
        skills = cls.extract_skills(clean_txt)
        experience = cls.extract_experience_years(clean_txt)
        education = cls.extract_education(text)
        certifications = cls.extract_certifications(text)
        projects = cls.extract_projects(text)
        summary = cls.extract_summary(text)
        career_history = cls.extract_career_history(text)
        
        # Calculate a profile completeness score
        completeness = 0.0
        if name: completeness += 15.0
        if email: completeness += 10.0
        if phone: completeness += 5.0
        if skills: completeness += 25.0
        if experience > 0: completeness += 15.0
        if education: completeness += 10.0
        if career_history: completeness += 20.0
        completeness = min(100.0, completeness)
        
        return {
            "name": name if name else os.path.splitext(os.path.basename(file_path))[0],
            "email": email,
            "phone": phone,
            "skills": skills,
            "experience": experience,
            "education": education,
            "certifications": certifications,
            "projects": projects,
            "summary": summary if summary else "Candidate profile extracted from resume.",
            "career_history": career_history,
            "profile_completeness": completeness,
            # Assign random-ish/default behavioral metrics for uploaded candidates
            "recent_activity": 80.0,
            "response_rate": 85.0,
            "recruiter_interest": 75.0,
            "interview_success": 70.0
        }

    @staticmethod
    def extract_name(text: str) -> str:
        # Heuristic: the first non-empty line of the resume is often the name
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        if lines:
            first_line = lines[0]
            # Verify if first line looks like a name (words, no emails or phone numbers, <= 4 words)
            if (not "@" in first_line) and (not "resume" in first_line.lower()) and len(first_line.split()) <= 4:
                return first_line
        return ""

    @staticmethod
    def extract_email(text: str) -> str:
        match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
        return match.group(0) if match else ""

    @staticmethod
    def extract_phone(text: str) -> str:
        # Match standard phone formats
        match = re.search(r'\(?\+?[0-9]{1,4}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{4}', text)
        return match.group(0) if match else ""

    @staticmethod
    def extract_skills(text: str) -> List[str]:
        found_skills = []
        text_lower = text.lower()
        for skill in COMMON_SKILLS:
            # Match skill as word boundary to prevent matching sub-strings
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, text_lower):
                # Capitalize nicely
                cap_skill = skill
                if skill in ["python", "pytorch", "tensorflow", "kubernetes", "docker", "postgres", "postgresql", "django", "flask", "fastapi"]:
                    cap_skill = skill.capitalize()
                elif skill in ["llm", "rag", "nlp", "aws", "gcp", "sql", "api", "html", "css", "github", "gitlab", "cicd"]:
                    cap_skill = skill.upper()
                elif skill in ["javascript", "typescript"]:
                    cap_skill = "JavaScript" if skill == "javascript" else "TypeScript"
                elif skill == "react":
                    cap_skill = "React.js"
                found_skills.append(cap_skill)
        return list(set(found_skills))

    @staticmethod
    def extract_experience_years(text: str) -> float:
        # Look for patterns like "5 years", "3.5 yrs", "8+ years of experience"
        matches = re.findall(r'(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)\b', text, re.IGNORECASE)
        if matches:
            try:
                # return the maximum found experience to be safe
                exps = [float(x) for x in matches]
                return max(exps)
            except ValueError:
                pass
        return 0.0

    @staticmethod
    def extract_education(text: str) -> List[Dict[str, Any]]:
        edu_list = []
        # Look for degrees
        degrees = [
            ("Bachelor", "B.S.", "B.A.", "B.Tech", "B.E."),
            ("Master", "M.S.", "M.A.", "M.Tech", "M.E.", "MBA"),
            ("PhD", "Ph.D.", "Doctorate")
        ]
        
        lines = text.split("\n")
        for line in lines:
            l_lower = line.lower()
            if "university" in l_lower or "college" in l_lower or "institute" in l_lower:
                degree_found = "Degree"
                for group in degrees:
                    for d in group:
                        if d.lower() in l_lower:
                            degree_found = group[0]
                            break
                # Find field of study
                field = "Computer Science" if "computer" in l_lower else "Engineering"
                if "science" in l_lower and "computer" not in l_lower:
                    field = "Science"
                elif "business" in l_lower or "management" in l_lower:
                    field = "Business Administration"
                elif "finance" in l_lower:
                    field = "Finance"
                
                # School name
                school = line.strip()
                edu_list.append({
                    "degree": degree_found,
                    "field": field,
                    "school": school[:100] # Cap length
                })
        
        if not edu_list:
            # Default fallback if keywords are found somewhere
            if "university" in text.lower() or "college" in text.lower():
                edu_list.append({
                    "degree": "Bachelor's Degree",
                    "field": "Relevant Field",
                    "school": "University listed on resume"
                })
        return edu_list

    @staticmethod
    def extract_certifications(text: str) -> List[str]:
        certs = []
        lines = text.split("\n")
        for line in lines:
            if "certifi" in line.lower() or "certified" in line.lower():
                # Extract clean certificate title
                clean_cert = re.sub(r'^[-\*\s•]+', '', line.strip())
                if len(clean_cert) < 80 and len(clean_cert) > 5:
                    certs.append(clean_cert)
        return list(set(certs))[:5]

    @staticmethod
    def extract_projects(text: str) -> List[Dict[str, Any]]:
        projects = []
        # Find sections
        lines = text.split("\n")
        in_projects = False
        current_project = None
        
        for line in lines:
            l = line.strip()
            if not l:
                continue
            if "project" in l.lower() and len(l) < 20:
                in_projects = True
                continue
            if in_projects:
                # If we encounter another section, stop
                if ("experience" in l.lower() or "education" in l.lower() or "skill" in l.lower() or "contact" in l.lower()) and len(l) < 20:
                    break
                # Construct simple project
                if len(projects) < 3:
                    parts = l.split(":")
                    if len(parts) > 1:
                        projects.append({
                            "name": parts[0].strip(),
                            "description": parts[1].strip()
                        })
                    else:
                        projects.append({
                            "name": "Project Heuristic",
                            "description": l
                        })
        return projects

    @staticmethod
    def extract_summary(text: str) -> str:
        # Find first paragraph or summary section
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        for i, line in enumerate(lines[:10]):
            if "summary" in line.lower() or "profile" in line.lower() or "objective" in line.lower():
                # Take next 1-2 lines as summary
                summary_lines = []
                for j in range(i+1, min(i+4, len(lines))):
                    if len(lines[j]) > 30:
                        summary_lines.append(lines[j])
                if summary_lines:
                    return " ".join(summary_lines)
        return ""

    @staticmethod
    def extract_career_history(text: str) -> List[Dict[str, Any]]:
        history = []
        lines = text.split("\n")
        in_exp = False
        
        for line in lines:
            l = line.strip()
            if not l:
                continue
            if ("experience" in l.lower() or "work history" in l.lower() or "employment" in l.lower()) and len(l) < 20:
                in_exp = True
                continue
            if in_exp:
                if ("education" in l.lower() or "project" in l.lower() or "skill" in l.lower() or "certification" in l.lower()) and len(l) < 20:
                    break
                # Extract role details
                if len(history) < 3:
                    parts = l.split("-")
                    title = parts[0].strip() if parts else "Software Engineer"
                    company = parts[1].strip() if len(parts) > 1 else "Technology Corp"
                    history.append({
                        "title": title,
                        "company": company,
                        "duration": "1-3 years",
                        "description": l
                    })
        return history
