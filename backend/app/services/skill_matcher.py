import json
import logging
from typing import List, Dict, Tuple, Set, Any
from rapidfuzz import fuzz

logger = logging.getLogger(__name__)

# Predefined synonym mapping for technology and recruiting terms
SYNONYMS = {
    "ai": {"artificial intelligence", "ai", "artificial-intelligence"},
    "ml": {"machine learning", "ml", "machine-learning"},
    "llm": {"large language model", "large language models", "llm", "llms"},
    "rag": {"retrieval augmented generation", "retrieval-augmented generation", "rag"},
    "vector database": {"vector database", "vector db", "vectordb", "chroma", "faiss", "milvus", "qdrant", "pinecone"},
    "vector db": {"vector database", "vector db", "vectordb", "chroma", "faiss", "milvus", "qdrant", "pinecone"},
    "postgres": {"postgresql", "postgres"},
    "postgresql": {"postgresql", "postgres"},
    "react": {"react", "react.js", "reactjs"},
    "react.js": {"react", "react.js", "reactjs"},
    "js": {"javascript", "js"},
    "javascript": {"javascript", "js"},
    "ts": {"typescript", "ts"},
    "typescript": {"typescript", "ts"},
    "aws": {"amazon web services", "aws"},
    "nlp": {"natural language processing", "nlp"},
    "fastapi": {"fastapi", "fast-api"},
    "django": {"django", "django web framework"},
    "flask": {"flask", "flask microframework"},
    "kubernetes": {"kubernetes", "k8s"},
    "docker": {"docker", "docker containerization"},
    "pytorch": {"pytorch", "torch"},
    "tensorflow": {"tensorflow", "tf"}
}

class SkillMatcher:
    @staticmethod
    def get_canonical_skill(skill: str) -> str:
        return skill.strip().lower()

    @staticmethod
    def skills_are_synonyms(skill_a: str, skill_b: str) -> bool:
        s_a = SkillMatcher.get_canonical_skill(skill_a)
        s_b = SkillMatcher.get_canonical_skill(skill_b)
        
        if s_a == s_b:
            return True
            
        for primary, syn_set in SYNONYMS.items():
            if s_a in syn_set and s_b in syn_set:
                return True
        return False

    @staticmethod
    def check_match(jd_skill: str, candidate_skills: List[str]) -> Tuple[bool, str]:
        """
        Check if jd_skill matches any candidate_skills using exact, synonym, and fuzzy logic.
        Returns (is_match, matched_candidate_skill).
        """
        jd_s = SkillMatcher.get_canonical_skill(jd_skill)
        
        # 1. Exact / Synonym Match
        for c_skill in candidate_skills:
            c_s = SkillMatcher.get_canonical_skill(c_skill)
            if SkillMatcher.skills_are_synonyms(jd_s, c_s):
                return True, c_skill
                
        # 2. Fuzzy Match
        for c_skill in candidate_skills:
            c_s = SkillMatcher.get_canonical_skill(c_skill)
            # Fuzzy match threshold of 85
            ratio = fuzz.ratio(jd_s, c_s)
            partial_ratio = fuzz.partial_ratio(jd_s, c_s)
            if ratio >= 85 or partial_ratio >= 90:
                return True, c_skill
                
        return False, ""

    @classmethod
    def match_skills(cls, candidate_skills: List[str], required_skills: List[str], preferred_skills: List[str]) -> Dict[str, Any]:
        """
        Match candidate skills against JD required and preferred skills.
        Returns:
            - score (0 to 100)
            - matched_skills: list of skills that matched
            - missing_skills: list of required skills that are missing
            - recommended_skills: preferred skills that are missing
        """
        if not required_skills and not preferred_skills:
            return {
                "score": 100.0,
                "matched_skills": [],
                "missing_skills": [],
                "recommended_skills": []
            }
            
        matched_required = []
        missing_required = []
        
        matched_preferred = []
        missing_preferred = []
        
        # Match Required
        for skill in required_skills:
            is_match, matched_c = cls.check_match(skill, candidate_skills)
            if is_match:
                matched_required.append((skill, matched_c))
            else:
                missing_required.append(skill)
                
        # Match Preferred
        for skill in preferred_skills:
            is_match, matched_c = cls.check_match(skill, candidate_skills)
            if is_match:
                matched_preferred.append((skill, matched_c))
            else:
                missing_preferred.append(skill)
                
        # Calculate Score
        # Required skills are 80%, Preferred are 20%
        req_score = 0.0
        if required_skills:
            req_score = (len(matched_required) / len(required_skills)) * 100.0
            
        pref_score = 0.0
        if preferred_skills:
            pref_score = (len(matched_preferred) / len(preferred_skills)) * 100.0
            
        if required_skills and preferred_skills:
            final_skill_score = (req_score * 0.80) + (pref_score * 0.20)
        elif required_skills:
            final_skill_score = req_score
        else:
            final_skill_score = pref_score
            
        return {
            "score": round(final_skill_score, 1),
            "matched_skills": [m[1] for m in matched_required] + [m[1] for m in matched_preferred],
            "missing_skills": missing_required,
            "recommended_skills": missing_preferred
        }
