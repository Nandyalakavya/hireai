import json
import logging
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.database.models import Candidate, JobDescription, Ranking, SkillGap, ChatHistory
from .explainability import ExplainabilityService
from .resume_parser import COMMON_SKILLS

logger = logging.getLogger(__name__)

class CopilotEngine:
    @classmethod
    def answer_query(cls, db: Session, prompt: str, session_id: str = "default") -> Dict[str, Any]:
        chat_query = ChatHistory(session_id=session_id, role="user", content=prompt)
        db.add(chat_query)
        db.commit()

        active_jd = db.query(JobDescription).filter(JobDescription.is_active == True).first()
        if not active_jd:
            active_jd = db.query(JobDescription).first()
        jd_id = active_jd.id if active_jd else None

        prompt_lower = prompt.lower()
        answer = ""

        if "ranked first" in prompt_lower or "ranked #1" in prompt_lower or ("why" in prompt_lower and "first" in prompt_lower):
            answer = cls._get_why_first(db, jd_id)
        elif "below" in prompt_lower or "higher than" in prompt_lower or "above" in prompt_lower:
            answer = cls._get_relative(db, jd_id, prompt)
        elif "candidates with" in prompt_lower or "who has" in prompt_lower or "experience with" in prompt_lower:
            answer = cls._get_by_skill(db, prompt)
        elif "retrieval" in prompt_lower:
            answer = cls._get_retrieval(db)
        elif "missing" in prompt_lower or "gap" in prompt_lower:
            answer = cls._get_missing(db, jd_id, prompt)
        elif "compare" in prompt_lower:
            answer = cls._get_compare(db, jd_id, prompt)
        else:
            answer = cls._get_general()

        chat_reply = ChatHistory(session_id=session_id, role="assistant", content=answer)
        db.add(chat_reply)
        db.commit()

        histories = db.query(ChatHistory).filter(ChatHistory.session_id == session_id).order_by(ChatHistory.created_at.asc()).all()
        return {"answer": answer, "conversation_history": [{"role": h.role, "content": h.content} for h in histories]}

    @classmethod
    def _get_why_first(cls, db, jd_id):
        if not jd_id:
            return "No job descriptions found."
        top = db.query(Ranking).filter(Ranking.jd_id == jd_id).order_by(Ranking.final_score.desc()).first()
        if not top:
            return "No rankings calculated yet. Please run rankings first."
        c = db.query(Candidate).filter(Candidate.id == top.candidate_id).first()
        exp = ExplainabilityService.get_candidate_explanation(db, c.id, jd_id)
        bullets = "\n".join([f"- {s}" for s in exp["strengths"]])
        return f"""### Why is {c.name} ranked #1?

**{c.name}** leads with **{top.final_score}%** overall score:

| Dimension | Score |
|-----------|-------|
| Semantic Match | {top.semantic_score}% |
| Skill Match | {top.skill_score}% |
| Experience | {top.experience_score}% |
| Behavior | {top.behavior_score}% |

**Key Strengths:**
{bullets}"""

    @classmethod
    def _get_relative(cls, db, jd_id, prompt):
        if not jd_id:
            return "No job description loaded."
        candidates = db.query(Candidate).all()
        found = [c for c in candidates if c.name.split()[0].lower() in prompt.lower()]
        if len(found) < 2:
            ranks = db.query(Ranking).filter(Ranking.jd_id == jd_id).order_by(Ranking.final_score.desc()).limit(2).all()
            if len(ranks) < 2:
                return "Not enough ranked candidates."
            found = [db.query(Candidate).filter(Candidate.id == r.candidate_id).first() for r in ranks]
        a, b = found[0], found[1]
        ra = db.query(Ranking).filter(Ranking.candidate_id == a.id, Ranking.jd_id == jd_id).first()
        rb = db.query(Ranking).filter(Ranking.candidate_id == b.id, Ranking.jd_id == jd_id).first()
        if ra.final_score < rb.final_score:
            a, b, ra, rb = b, a, rb, ra
        return f"""### {a.name} vs {b.name}

| Metric | {a.name} | {b.name} |
|--------|----------|----------|
| Final Score | **{ra.final_score}%** | {rb.final_score}% |
| Semantic | {ra.semantic_score}% | {rb.semantic_score}% |
| Skill | {ra.skill_score}% | {rb.skill_score}% |
| Experience | {ra.experience_score}% | {rb.experience_score}% |
| Behavior | {ra.behavior_score}% | {rb.behavior_score}% |

**{a.name}** ranks higher due to stronger semantic alignment and skill coverage."""

    @classmethod
    def _get_by_skill(cls, db, prompt):
        candidates = db.query(Candidate).all()
        skills_to_search = [s for s in COMMON_SKILLS if s in prompt.lower()]
        if not skills_to_search:
            skills_to_search = ["python"]
        matched = []
        for c in candidates:
            cskills = [s.lower() for s in json.loads(c.skills)] if c.skills else []
            if all(s in cskills for s in skills_to_search):
                matched.append(c)
        label = ", ".join([s.capitalize() for s in skills_to_search])
        if not matched:
            return f"No candidates found with **{label}** skills."
        lines = "\n".join([f"- **{c.name}** ({c.experience}y exp)" for c in matched])
        return f"### Candidates with {label}\n\n{lines}"

    @classmethod
    def _get_retrieval(cls, db):
        candidates = db.query(Candidate).all()
        matched = [c for c in candidates if any(t in (c.summary or "").lower() for t in ["retrieval", "rag", "search", "vector"])]
        if not matched:
            return "No candidates mention retrieval experience."
        lines = "\n".join([f"- **{c.name}**: {(c.summary or '')[:120]}..." for c in matched])
        return f"### Retrieval Experience\n\n{lines}"

    @classmethod
    def _get_missing(cls, db, jd_id, prompt):
        if not jd_id:
            return "No active job description."
        gaps = db.query(SkillGap).filter(SkillGap.jd_id == jd_id).all()
        lines = ""
        for g in gaps:
            c = db.query(Candidate).filter(Candidate.id == g.candidate_id).first()
            missing = json.loads(g.missing_skills) if g.missing_skills else []
            if missing:
                lines += f"- **{c.name}**: {', '.join(missing)}\n"
        return f"### Skill Gaps\n\n{lines}" if lines else "No skill gaps detected!"

    @classmethod
    def _get_compare(cls, db, jd_id, prompt):
        if not jd_id:
            return "No job description loaded."
        candidates = db.query(Candidate).all()
        ids = [c.id for c in candidates if c.name.split()[0].lower() in prompt.lower()]
        if len(ids) < 2:
            ids = ["C003", "C001"]
        data = ExplainabilityService.get_comparison(db, jd_id, ids)
        if not data:
            return "Cannot compare. Run rankings first."
        parts = []
        for d in data:
            parts.append(f"#### {d['name']} ({d['final_score']}%)\n- Matched: {', '.join(d['matched_skills'][:5])}\n- Missing: {', '.join(d['missing_skills']) if d['missing_skills'] else 'None'}")
        return "### Comparison\n\n" + "\n\n".join(parts)

    @staticmethod
    def _get_general():
        return """### HireAI Copilot

I can help you understand candidate rankings. Try asking:

1. **Why is Candidate #1 ranked first?**
2. **Why is Sofia below Priya?**
3. **Show candidates with Python and PyTorch experience**
4. **Who has strongest Retrieval experience?**
5. **Which candidates have missing skills?**
6. **Compare Priya and Amara**"""
