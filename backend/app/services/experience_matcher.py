import logging

logger = logging.getLogger(__name__)

class ExperienceMatcher:
    @staticmethod
    def calculate_experience_score(candidate_exp: float, min_exp: float, max_exp: float) -> float:
        """
        Compare candidate experience with JD requirements.
        If it fits within [min_exp, max_exp], return 100.0.
        If it is below min_exp, scale down.
        If it is above max_exp, return 100.0 (overqualification is fine).
        """
        if min_exp <= 0.0:
            # No minimum requirement
            return 100.0
            
        if candidate_exp >= min_exp:
            return 100.0
            
        # Below minimum experience - linear scaling
        score = (candidate_exp / min_exp) * 100.0
        return round(max(0.0, min(100.0, score)), 1)
