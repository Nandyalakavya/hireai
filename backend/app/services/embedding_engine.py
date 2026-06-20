import os
import json
import logging
from typing import List

# Set Hugging Face cache directory to a persistent folder within data/ to prevent re-downloading on startup/restart
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ["HF_HOME"] = os.path.join(BASE_DIR, "data", "hf_cache")

logger = logging.getLogger(__name__)

# Try to use sentence-transformers. If not installed/failed, we use a scikit-learn based fallback.
HAS_SENTENCE_TRANSFORMERS = False
try:
    from sentence_transformers import SentenceTransformer
    HAS_SENTENCE_TRANSFORMERS = True
except Exception as e:
    logger.warning(f"Failed to import sentence-transformers: {e}. Falling back to TF-IDF matching.")

class EmbeddingEngine:
    def __init__(self):
        self._model = None  # Lazy-loaded on first use to avoid startup OOM

    @property
    def model(self):
        """Load model on first access (lazy loading) to avoid OOM at startup."""
        if self._model is None and HAS_SENTENCE_TRANSFORMERS:
            try:
                self._model = SentenceTransformer("all-MiniLM-L6-v2")
                logger.info("SentenceTransformer model 'all-MiniLM-L6-v2' loaded successfully.")
            except Exception as e:
                logger.error(f"Failed to load SentenceTransformer model: {e}. Using fallback.")
        return self._model

    def get_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for a given text.
        If sentence-transformers is not available, we return a simulated embedding (a normalized TF-IDF vector representation).
        """
        if self.model is not None:
            try:
                embedding = self.model.encode(text)
                return embedding.tolist()
            except Exception as e:
                logger.error(f"Error in SentenceTransformer encoding: {e}")
        
        # Fallback pseudo-embedding: construct a deterministic vector from text
        # Let's generate a vector of size 384 (same as MiniLM-L6-v2) based on hash values or simple bag-of-words
        import numpy as np
        import hashlib
        vector = np.zeros(384)
        words = text.lower().split()
        if not words:
            return vector.tolist()
        
        for word in words:
            # Deterministic MD5 hash to map word to index [0, 383]
            h = hashlib.md5(word.encode('utf-8')).digest()
            idx = int.from_bytes(h, 'big') % 384
            vector[idx] += 1.0
            
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm
        return vector.tolist()

    def calculate_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """
        Calculate cosine similarity between two vectors.
        """
        import numpy as np
        v1 = np.array(vec1)
        v2 = np.array(vec2)
        norm_v1 = np.linalg.norm(v1)
        norm_v2 = np.linalg.norm(v2)
        if norm_v1 == 0 or norm_v2 == 0:
            return 0.0
        return float(np.dot(v1, v2) / (norm_v1 * norm_v2))

    @staticmethod
    def get_candidate_profile_text(candidate) -> str:
        """
        Combine: Headline, Summary, Skills, Career History, Education, Projects, Certifications, Behavior Signals
        """
        parts = []
        # Name and basic description
        parts.append(candidate.name)
        if candidate.summary:
            parts.append(candidate.summary)
            
        # Skills
        if candidate.skills:
            try:
                skills_list = json.loads(candidate.skills)
                if isinstance(skills_list, list):
                    parts.append("Skills: " + ", ".join(skills_list))
            except Exception:
                parts.append("Skills: " + str(candidate.skills))
                
        # Career History
        if candidate.career_history:
            try:
                history = json.loads(candidate.career_history)
                if isinstance(history, list):
                    for job in history:
                        title = job.get("title", "")
                        company = job.get("company", "")
                        desc = job.get("description", "")
                        parts.append(f"Job: {title} at {company}. {desc}")
            except Exception:
                parts.append("Experience: " + str(candidate.career_history))

        # Education
        if candidate.education:
            try:
                edu = json.loads(candidate.education)
                if isinstance(edu, list):
                    for deg in edu:
                        degree = deg.get("degree", "")
                        field = deg.get("field", "")
                        school = deg.get("school", "")
                        parts.append(f"Education: {degree} in {field} from {school}")
            except Exception:
                pass

        # Projects
        if candidate.projects:
            try:
                projects = json.loads(candidate.projects)
                if isinstance(projects, list):
                    for proj in projects:
                        name = proj.get("name", "")
                        desc = proj.get("description", "")
                        parts.append(f"Project: {name}. {desc}")
            except Exception:
                pass

        # Certifications
        if candidate.certifications:
            try:
                certs = json.loads(candidate.certifications)
                if isinstance(certs, list):
                    parts.append("Certifications: " + ", ".join(certs))
            except Exception:
                pass

        return " ".join(parts)

    @staticmethod
    def get_jd_profile_text(jd) -> str:
        """
        Combine: Job Title, Required Skills, Preferred Skills, Responsibilities, Raw Text
        """
        parts = []
        parts.append(jd.title)
        if jd.raw_text:
            parts.append(jd.raw_text)
            
        if jd.required_skills:
            try:
                skills = json.loads(jd.required_skills)
                parts.append("Required Skills: " + ", ".join(skills))
            except Exception:
                pass
                
        if jd.preferred_skills:
            try:
                skills = json.loads(jd.preferred_skills)
                parts.append("Preferred Skills: " + ", ".join(skills))
            except Exception:
                pass

        if jd.responsibilities:
            try:
                resps = json.loads(jd.responsibilities)
                parts.append("Responsibilities: " + " ".join(resps))
            except Exception:
                pass
                
        return " ".join(parts)

# Singleton Instance
embedding_engine = EmbeddingEngine()
