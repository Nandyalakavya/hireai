import csv
import io
import json
import logging
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.database.models import Candidate, JobDescription, Ranking, SkillGap
from .explainability import ExplainabilityService

logger = logging.getLogger(__name__)

class ExportService:
    @staticmethod
    def generate_submission_csv(db: Session, jd_id: int) -> str:
        """
        Generates CSV content for Submission CSV:
        candidate_id,rank,score
        """
        rankings = db.query(Ranking).filter(Ranking.jd_id == jd_id).order_by(Ranking.final_score.desc()).all()
        
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["candidate_id", "rank", "score"])
        
        for idx, r in enumerate(rankings):
            writer.writerow([r.candidate_id, idx + 1, r.final_score])
            
        return output.getvalue()

    @staticmethod
    def generate_detailed_csv(db: Session, jd_id: int) -> str:
        """
        Generates CSV content for Detailed CSV:
        candidate_id,candidate_name,rank,score,semantic_score,skill_score,experience_score,behavior_score,matched_skills,missing_skills,reasoning
        """
        rankings = db.query(Ranking).filter(Ranking.jd_id == jd_id).order_by(Ranking.final_score.desc()).all()
        
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "candidate_id", "candidate_name", "rank", "score", 
            "semantic_score", "skill_score", "experience_score", "behavior_score", 
            "matched_skills", "missing_skills", "reasoning"
        ])
        
        for idx, r in enumerate(rankings):
            candidate = db.query(Candidate).filter(Candidate.id == r.candidate_id).first()
            gap = db.query(SkillGap).filter(SkillGap.candidate_id == r.candidate_id, SkillGap.jd_id == jd_id).first()
            
            matched = ""
            missing = ""
            if gap:
                matched = ", ".join(json.loads(gap.matched_skills)) if gap.matched_skills else ""
                missing = ", ".join(json.loads(gap.missing_skills)) if gap.missing_skills else ""
                
            explanation = ExplainabilityService.get_candidate_explanation(db, r.candidate_id, jd_id)
            reasoning = explanation["summary"]
            
            writer.writerow([
                r.candidate_id,
                candidate.name if candidate else "",
                idx + 1,
                r.final_score,
                r.semantic_score,
                r.skill_score,
                r.experience_score,
                r.behavior_score,
                matched,
                missing,
                reasoning
            ])
            
        return output.getvalue()
