import json
import logging
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.database.models import Candidate, JobDescription, Ranking, SkillGap

logger = logging.getLogger(__name__)

class ExplainabilityService:
    @staticmethod
    def get_candidate_explanation(db: Session, candidate_id: str, jd_id: int) -> Dict[str, Any]:
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        jd = db.query(JobDescription).filter(JobDescription.id == jd_id).first()
        ranking = db.query(Ranking).filter(
            Ranking.candidate_id == candidate_id, Ranking.jd_id == jd_id
        ).first()
        gap = db.query(SkillGap).filter(
            SkillGap.candidate_id == candidate_id, SkillGap.jd_id == jd_id
        ).first()

        if not candidate or not jd or not ranking:
            return {"summary": "Ranking calculations required.", "strengths": [], "weaknesses": [],
                    "matched_skills": [], "missing_skills": [], "recommended_skills": []}

        matched_skills = json.loads(gap.matched_skills) if gap and gap.matched_skills else []
        missing_skills = json.loads(gap.missing_skills) if gap and gap.missing_skills else []
        recommended_skills = json.loads(gap.recommended_skills) if gap and gap.recommended_skills else []
        req_skills = json.loads(jd.required_skills) if jd.required_skills else []

        strengths = []
        weaknesses = []

        if candidate.experience >= jd.min_experience:
            strengths.append(f"Strong experience: {candidate.experience}y matches {jd.min_experience}-{jd.max_experience}y requirement.")
        else:
            weaknesses.append(f"Experience gap: {candidate.experience}y below {jd.min_experience}y minimum.")

        if not missing_skills:
            strengths.append(f"All required skills matched: {', '.join(matched_skills[:5])}.")
        else:
            matched_req = [s for s in matched_skills if s in req_skills]
            if matched_req:
                strengths.append(f"Key skills matched: {', '.join(matched_req[:4])}.")
            weaknesses.append(f"Missing required skills: {', '.join(missing_skills)}.")

        if recommended_skills:
            weaknesses.append(f"Missing preferred skills: {', '.join(recommended_skills)}.")

        if ranking.semantic_score >= 80.0:
            strengths.append(f"Excellent semantic alignment ({ranking.semantic_score}%).")
        elif ranking.semantic_score < 50.0:
            weaknesses.append(f"Weak semantic match ({ranking.semantic_score}%).")

        if ranking.behavior_score >= 85.0:
            strengths.append("High engagement and platform activity indicators.")
        elif ranking.behavior_score < 60.0:
            weaknesses.append("Low behavioral indicators.")

        summary = f"{candidate.name} has a matching score of {ranking.final_score}%. "
        if ranking.final_score >= 90.0:
            summary += "Exceptional fit with high relevance across all dimensions."
        elif ranking.final_score >= 75.0:
            summary += "Solid candidate meeting core requirements with minor gaps."
        else:
            summary += "Lower match due to skill gaps and reduced profile relevance."

        return {
            "summary": summary, "strengths": strengths, "weaknesses": weaknesses,
            "matched_skills": matched_skills, "missing_skills": missing_skills,
            "recommended_skills": recommended_skills
        }

    @classmethod
    def get_comparison(cls, db: Session, jd_id: int, candidate_ids: List[str]) -> List[Dict[str, Any]]:
        results = []
        for cid in candidate_ids:
            cand = db.query(Candidate).filter(Candidate.id == cid).first()
            rank = db.query(Ranking).filter(
                Ranking.candidate_id == cid, Ranking.jd_id == jd_id
            ).first()
            if not cand or not rank:
                continue
            explanation = cls.get_candidate_explanation(db, cid, jd_id)
            results.append({
                "candidate_id": cid, "name": cand.name,
                "final_score": rank.final_score, "semantic_score": rank.semantic_score,
                "skill_score": rank.skill_score, "experience_score": rank.experience_score,
                "behavior_score": rank.behavior_score,
                **explanation
            })
        return results
