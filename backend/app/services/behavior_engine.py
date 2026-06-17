import logging

logger = logging.getLogger(__name__)

class BehaviorEngine:
    @staticmethod
    def calculate_behavior_score(candidate) -> float:
        """
        Calculate Behavior Score as an average of:
        - Profile Completeness (0-100)
        - Recent Activity (0-100)
        - Response Rate (0-100)
        - Recruiter Interest (0-100)
        - Interview Success (0-100)
        """
        metrics = [
            candidate.profile_completeness,
            candidate.recent_activity,
            candidate.response_rate,
            candidate.recruiter_interest,
            candidate.interview_success
        ]
        
        # Avoid division by zero, though we have 5 metrics
        if not metrics:
            return 0.0
            
        score = sum(metrics) / len(metrics)
        return round(max(0.0, min(100.0, score)), 1)
