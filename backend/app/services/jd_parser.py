import os
import re
import json
import logging
from typing import Dict, Any, List
from .resume_parser import ResumeParser, COMMON_SKILLS

logger = logging.getLogger(__name__)

class JDParser:
    @classmethod
    def parse_jd(cls, raw_text: str, filename: str = None) -> Dict[str, Any]:
        """
        Parses JD text and extracts structured info:
        - Job Title
        - Required Skills
        - Preferred Skills
        - Experience Range (min/max)
        - Industry
        - Keywords
        - Responsibilities
        """
        clean_text = re.sub(r'\s+', ' ', raw_text)
        
        # 1. Title Heuristic
        title = cls.extract_title(raw_text, filename)
        
        # 2. Experience Heuristic
        min_exp, max_exp = cls.extract_experience_range(clean_text)
        
        # 3. Skills Heuristic (required vs preferred)
        required_skills, preferred_skills = cls.extract_skills_split(raw_text)
        
        # 4. Industry Heuristic
        industry = cls.extract_industry(clean_text)
        
        # 5. Keywords
        keywords = cls.extract_keywords(clean_text)
        
        # 6. Responsibilities
        responsibilities = cls.extract_responsibilities(raw_text)
        
        return {
            "title": title,
            "required_skills": required_skills,
            "preferred_skills": preferred_skills,
            "min_experience": min_exp,
            "max_experience": max_exp,
            "industry": industry,
            "keywords": keywords,
            "responsibilities": responsibilities,
            "raw_text": raw_text
        }

    @staticmethod
    def extract_title(raw_text: str, filename: str = None) -> str:
        lines = [l.strip() for l in raw_text.split("\n") if l.strip()]
        if lines:
            first_line = lines[0]
            if len(first_line.split()) <= 6 and not ":" in first_line:
                return first_line
        if filename:
            # clean filename
            base = os.path.splitext(os.path.basename(filename))[0]
            return base.replace("_", " ").replace("-", " ").title()
        return "Job Description Role"

    @staticmethod
    def extract_experience_range(text: str) -> tuple:
        # Match range like "5-9 years", "5 to 9 years", "3-5+ years", "at least 5 years"
        range_match = re.search(r'(\d+)\s*(?:-|to)\s*(\d+)\+?\s*(?:years?|yrs?)', text, re.IGNORECASE)
        if range_match:
            try:
                return float(range_match.group(1)), float(range_match.group(2))
            except ValueError:
                pass
                
        # Match pattern "5+ years", "5+ yrs"
        plus_match = re.search(r'(\d+)\+\s*(?:years?|yrs?)', text, re.IGNORECASE)
        if plus_match:
            try:
                return float(plus_match.group(1)), 100.0
            except ValueError:
                pass
                
        # Match pattern "at least 5 years", "minimum 5 years"
        at_least_match = re.search(r'(?:at least|minimum|min)\s*(\d+)\s*(?:years?|yrs?)', text, re.IGNORECASE)
        if at_least_match:
            try:
                return float(at_least_match.group(1)), 100.0
            except ValueError:
                pass

        # Return default 0 to 100 if not found
        return 0.0, 100.0

    @staticmethod
    def extract_skills_split(raw_text: str) -> tuple:
        # Split text into sentences or lines
        sentences = re.split(r'[.!?\n]', raw_text)
        
        required_skills = []
        preferred_skills = []
        
        # Scan sentences to identify context
        for sentence in sentences:
            sentence_lower = sentence.lower()
            if not sentence_lower.strip():
                continue
                
            # Find which skills exist in this sentence
            found_in_sentence = []
            for skill in COMMON_SKILLS:
                pattern = r'\b' + re.escape(skill) + r'\b'
                if re.search(pattern, sentence_lower):
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
                    found_in_sentence.append(cap_skill)
                    
            if not found_in_sentence:
                continue
                
            # Classify sentence as preferred or required
            is_preferred = any(word in sentence_lower for word in ["preferred", "nice to have", "plus", "optional", "bonus", "desirable", "advantage"])
            
            if is_preferred:
                preferred_skills.extend(found_in_sentence)
            else:
                required_skills.extend(found_in_sentence)
                
        # Clean duplicates
        req_set = set(required_skills)
        pref_set = set(preferred_skills) - req_set # Skills shouldn't be in both
        
        # If required is completely empty, put everything in required as default
        if not req_set and pref_set:
            req_set = pref_set
            pref_set = set()
            
        return list(req_set), list(pref_set)

    @staticmethod
    def extract_industry(text: str) -> str:
        text_lower = text.lower()
        industries = {
            "Technology / AI": ["ai", "artificial intelligence", "machine learning", "deep learning", "nlp", "llm", "software", "tech"],
            "Finance / Fintech": ["finance", "fintech", "banking", "crypto", "risk", "investment", "trading"],
            "E-commerce": ["e-commerce", "retail", "shop", "sales", "transaction", "cart"],
            "Healthcare": ["healthcare", "medical", "clinical", "health", "hospital", "pharma"],
            "Telecommunications": ["telecom", "networking", "network", "communication", "wireless"]
        }
        for ind, keywords in industries.items():
            if any(k in text_lower for k in keywords):
                return ind
        return "Technology"

    @staticmethod
    def extract_keywords(text: str) -> List[str]:
        # Top tech words found
        keywords = []
        words = ["Generative AI", "RAG", "LLM", "Dense Retrieval", "Search", "Microservices", "MLOps", "Database", "Embeddings"]
        text_lower = text.lower()
        for w in words:
            if w.lower() in text_lower:
                keywords.append(w)
        return keywords[:5]

    @staticmethod
    def extract_responsibilities(raw_text: str) -> List[str]:
        responsibilities = []
        lines = raw_text.split("\n")
        in_resp = False
        
        for line in lines:
            l = line.strip()
            if not l:
                continue
            if ("responsibilit" in l.lower() or "duties" in l.lower() or "what you will do" in l.lower()) and len(l) < 25:
                in_resp = True
                continue
            if in_resp:
                if ("requirements" in l.lower() or "qualifications" in l.lower() or "skills" in l.lower() or "about us" in l.lower()) and len(l) < 25:
                    break
                # Bullet points starting with common markers
                if l.startswith(("-", "*", "•", "1.", "2.", "3.", "4.")):
                    clean_l = re.sub(r'^[-*•\d\.\s]+', '', l)
                    responsibilities.append(clean_l)
                elif len(l) > 30 and len(responsibilities) < 6:
                    responsibilities.append(l)
                    
        # Fallback list if none found via bullet points
        if not responsibilities:
            sentences = re.split(r'[.!?\n]', raw_text)
            for s in sentences:
                s_strip = s.strip()
                if len(s_strip) > 40 and any(s_strip.lower().startswith(v) for v in ["build", "design", "develop", "implement", "create", "manage", "lead", "optimize", "work"]):
                    responsibilities.append(s_strip)
                    if len(responsibilities) >= 5:
                        break
        return responsibilities[:6]
