import os
import json
import shutil
import logging
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database.connection import engine, get_db, Base, SessionLocal
from app.database.models import Candidate, JobDescription, Ranking, SkillGap, Upload, ChatHistory
from app.services.data_loader import seed_data
from app.services.resume_parser import ResumeParser
from app.services.jd_parser import JDParser
from app.services.ranking_engine import RankingEngine
from app.services.analytics_engine import AnalyticsService
from app.services.copilot_engine import CopilotEngine
from app.services.export_service import ExportService
from app.services.explainability import ExplainabilityService
from app.schemas.schemas import CopilotRequest

logger = logging.getLogger(__name__)

# Ensure upload data folders exist
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(os.path.join(BASE_DIR, "data", "resumes"), exist_ok=True)
os.makedirs(os.path.join(BASE_DIR, "data", "job_descriptions"), exist_ok=True)
os.makedirs(os.path.join(BASE_DIR, "data", "exports"), exist_ok=True)

# Create Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="HireAI – AI-Powered Candidate Ranking & Semantic Alignment API")

# CORS configuration - must be before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed initial data on startup
@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        seed_data(db)
        # Automatically run rankings if an active JD exists
        active_jd = db.query(JobDescription).filter(JobDescription.is_active == True).first()
        if active_jd:
            try:
                RankingEngine.run_ranking_for_jd(db, active_jd.id)
            except Exception as e:
                logger.warning(f"Auto-ranking on startup failed: {e}")
    finally:
        db.close()

# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {"message": "Welcome to HireAI – AI-Powered Candidate Ranking & Semantic Alignment Platform backend!"}

@app.post("/api/upload/resume")
def upload_resume(file: UploadFile = File(...), db: Session = Depends(get_db)):
    upload_record = Upload(filename=file.filename, file_type="resume", status="pending")
    db.add(upload_record)
    db.commit()

    file_path = os.path.join(BASE_DIR, "data", "resumes", f"{upload_record.id}_{file.filename}")
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        parsed_profile = ResumeParser.parse_resume(file_path)

        # Generate unique ID
        max_id_row = db.query(Candidate).order_by(Candidate.id.desc()).first()
        if max_id_row:
            try:
                num = int(max_id_row.id.replace("C", "")) + 1
            except:
                num = upload_record.id + 100
        else:
            num = upload_record.id + 100
        candidate_id = f"C{num:03d}"

        candidate = Candidate(
            id=candidate_id,
            name=parsed_profile["name"],
            email=parsed_profile["email"],
            phone=parsed_profile["phone"],
            skills=json.dumps(parsed_profile["skills"]),
            experience=parsed_profile["experience"],
            education=json.dumps(parsed_profile["education"]),
            certifications=json.dumps(parsed_profile["certifications"]),
            projects=json.dumps(parsed_profile["projects"]),
            summary=parsed_profile["summary"],
            career_history=json.dumps(parsed_profile["career_history"]),
            source="uploaded",
            profile_completeness=parsed_profile["profile_completeness"],
            recent_activity=parsed_profile["recent_activity"],
            response_rate=parsed_profile["response_rate"],
            recruiter_interest=parsed_profile["recruiter_interest"],
            interview_success=parsed_profile["interview_success"]
        )
        db.add(candidate)
        upload_record.status = "success"
        db.commit()

        active_jd = db.query(JobDescription).filter(JobDescription.is_active == True).first()
        if active_jd:
            RankingEngine.run_ranking_for_jd(db, active_jd.id)

        ranking_info = None
        if active_jd:
            ranking_info = db.query(Ranking).filter(
                Ranking.candidate_id == candidate.id, Ranking.jd_id == active_jd.id
            ).first()

        return {
            "id": candidate.id,
            "name": candidate.name,
            "email": candidate.email,
            "skills": parsed_profile["skills"],
            "experience": candidate.experience,
            "summary": candidate.summary,
            "score": ranking_info.final_score if ranking_info else None
        }
    except Exception as e:
        upload_record.status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Resume upload & parsing failed: {e}")

@app.post("/api/upload/jd")
def upload_jd(
    title: str = Form(...),
    raw_text: str = Form(...),
    db: Session = Depends(get_db)
):
    try:
        parsed_jd = JDParser.parse_jd(raw_text)

        db.query(JobDescription).update({JobDescription.is_active: False})

        jd = JobDescription(
            title=title if title else parsed_jd["title"],
            required_skills=json.dumps(parsed_jd["required_skills"]),
            preferred_skills=json.dumps(parsed_jd["preferred_skills"]),
            min_experience=parsed_jd["min_experience"],
            max_experience=parsed_jd["max_experience"],
            industry=parsed_jd["industry"],
            keywords=json.dumps(parsed_jd["keywords"]),
            responsibilities=json.dumps(parsed_jd["responsibilities"]),
            raw_text=raw_text,
            is_active=True
        )
        db.add(jd)
        db.commit()
        db.refresh(jd)

        RankingEngine.run_ranking_for_jd(db, jd.id)

        return {
            "id": jd.id,
            "title": jd.title,
            "required_skills": parsed_jd["required_skills"],
            "preferred_skills": parsed_jd["preferred_skills"],
            "min_experience": jd.min_experience,
            "max_experience": jd.max_experience,
            "industry": jd.industry,
            "is_active": jd.is_active
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Job description parsing failed: {e}")

@app.get("/api/candidates")
def get_candidates(
    search: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Candidate)
    if source and source != "all":
        query = query.filter(Candidate.source == source)

    candidates = query.all()

    if search:
        search_lower = search.lower()
        filtered = []
        for c in candidates:
            skills_list = [s.lower() for s in json.loads(c.skills)] if c.skills else []
            match = (
                search_lower in c.name.lower() or
                (c.summary and search_lower in c.summary.lower()) or
                any(search_lower in s for s in skills_list)
            )
            if match:
                filtered.append(c)
        candidates = filtered

    active_jd = db.query(JobDescription).filter(JobDescription.is_active == True).first()

    result = []
    for c in candidates:
        score = None
        if active_jd:
            rank_rec = db.query(Ranking).filter(
                Ranking.candidate_id == c.id, Ranking.jd_id == active_jd.id
            ).first()
            if rank_rec:
                score = rank_rec.final_score

        result.append({
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "phone": c.phone,
            "skills": json.loads(c.skills) if c.skills else [],
            "experience": c.experience,
            "education": json.loads(c.education) if c.education else [],
            "certifications": json.loads(c.certifications) if c.certifications else [],
            "projects": json.loads(c.projects) if c.projects else [],
            "summary": c.summary,
            "career_history": json.loads(c.career_history) if c.career_history else [],
            "source": c.source,
            "score": score
        })
    return result

@app.get("/api/candidates/{id}")
def get_candidate_details(id: str, db: Session = Depends(get_db)):
    c = db.query(Candidate).filter(Candidate.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")

    active_jd = db.query(JobDescription).filter(JobDescription.is_active == True).first()
    if not active_jd:
        active_jd = db.query(JobDescription).first()

    ranking_details = None
    skill_gap_details = None
    explainability = None

    if active_jd:
        rank_rec = db.query(Ranking).filter(
            Ranking.candidate_id == c.id, Ranking.jd_id == active_jd.id
        ).first()
        if rank_rec:
            ranking_details = {
                "semantic_score": rank_rec.semantic_score,
                "skill_score": rank_rec.skill_score,
                "experience_score": rank_rec.experience_score,
                "behavior_score": rank_rec.behavior_score,
                "final_score": rank_rec.final_score
            }

        gap = db.query(SkillGap).filter(
            SkillGap.candidate_id == c.id, SkillGap.jd_id == active_jd.id
        ).first()
        if gap:
            skill_gap_details = {
                "matched_skills": json.loads(gap.matched_skills) if gap.matched_skills else [],
                "missing_skills": json.loads(gap.missing_skills) if gap.missing_skills else [],
                "recommended_skills": json.loads(gap.recommended_skills) if gap.recommended_skills else []
            }

        explainability = ExplainabilityService.get_candidate_explanation(db, c.id, active_jd.id)

    return {
        "id": c.id,
        "name": c.name,
        "email": c.email,
        "phone": c.phone,
        "skills": json.loads(c.skills) if c.skills else [],
        "experience": c.experience,
        "education": json.loads(c.education) if c.education else [],
        "certifications": json.loads(c.certifications) if c.certifications else [],
        "projects": json.loads(c.projects) if c.projects else [],
        "summary": c.summary,
        "career_history": json.loads(c.career_history) if c.career_history else [],
        "source": c.source,
        "profile_completeness": c.profile_completeness,
        "recent_activity": c.recent_activity,
        "response_rate": c.response_rate,
        "recruiter_interest": c.recruiter_interest,
        "interview_success": c.interview_success,
        "active_jd_title": active_jd.title if active_jd else None,
        "ranking": ranking_details,
        "skill_gap": skill_gap_details,
        "explanation": explainability
    }

@app.delete("/api/candidates/{id}")
def delete_candidate(id: str, db: Session = Depends(get_db)):
    c = db.query(Candidate).filter(Candidate.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")
    db.delete(c)
    db.commit()
    return {"message": "Candidate deleted successfully"}

@app.get("/api/job-descriptions")
def get_job_descriptions(db: Session = Depends(get_db)):
    jds = db.query(JobDescription).all()
    result = []
    for jd in jds:
        result.append({
            "id": jd.id,
            "title": jd.title,
            "required_skills": json.loads(jd.required_skills) if jd.required_skills else [],
            "preferred_skills": json.loads(jd.preferred_skills) if jd.preferred_skills else [],
            "min_experience": jd.min_experience,
            "max_experience": jd.max_experience,
            "industry": jd.industry,
            "keywords": json.loads(jd.keywords) if jd.keywords else [],
            "responsibilities": json.loads(jd.responsibilities) if jd.responsibilities else [],
            "raw_text": jd.raw_text,
            "is_active": jd.is_active,
            "created_at": str(jd.created_at) if jd.created_at else None
        })
    return result

@app.post("/api/job-descriptions/{id}/activate")
def activate_jd(id: int, db: Session = Depends(get_db)):
    db.query(JobDescription).update({JobDescription.is_active: False})
    jd = db.query(JobDescription).filter(JobDescription.id == id).first()
    if not jd:
        raise HTTPException(status_code=404, detail="Job description not found")

    jd.is_active = True
    db.commit()
    RankingEngine.run_ranking_for_jd(db, jd.id)
    return {"message": f"Job description '{jd.title}' activated, rankings computed."}

@app.delete("/api/job-descriptions/{id}")
def delete_jd(id: int, db: Session = Depends(get_db)):
    jd = db.query(JobDescription).filter(JobDescription.id == id).first()
    if not jd:
        raise HTTPException(status_code=404, detail="Job description not found")
    db.delete(jd)
    db.commit()
    return {"message": "Job description deleted successfully"}

@app.put("/api/job-descriptions/{id}")
def update_jd(
    id: int,
    title: str = Form(...),
    raw_text: str = Form(...),
    db: Session = Depends(get_db)
):
    jd = db.query(JobDescription).filter(JobDescription.id == id).first()
    if not jd:
        raise HTTPException(status_code=404, detail="Job description not found")

    try:
        parsed_jd = JDParser.parse_jd(raw_text)

        jd.title = title if title else parsed_jd["title"]
        jd.required_skills = json.dumps(parsed_jd["required_skills"])
        jd.preferred_skills = json.dumps(parsed_jd["preferred_skills"])
        jd.min_experience = parsed_jd["min_experience"]
        jd.max_experience = parsed_jd["max_experience"]
        jd.industry = parsed_jd["industry"]
        jd.keywords = json.dumps(parsed_jd["keywords"])
        jd.responsibilities = json.dumps(parsed_jd["responsibilities"])
        jd.raw_text = raw_text

        db.commit()
        db.refresh(jd)

        # Re-run rankings if this JD is the active one
        if jd.is_active:
            RankingEngine.run_ranking_for_jd(db, jd.id)

        return {
            "id": jd.id,
            "title": jd.title,
            "required_skills": parsed_jd["required_skills"],
            "preferred_skills": parsed_jd["preferred_skills"],
            "min_experience": jd.min_experience,
            "max_experience": jd.max_experience,
            "industry": jd.industry,
            "is_active": jd.is_active
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Job description update failed: {e}")

@app.post("/api/rank")
def run_ranking(payload: dict, db: Session = Depends(get_db)):
    jd_id = payload.get("jd_id")
    if not jd_id:
        raise HTTPException(status_code=400, detail="jd_id is required")
    try:
        RankingEngine.run_ranking_for_jd(db, jd_id)
        return {"message": "Rankings compiled successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ranking failed: {e}")

@app.get("/api/rankings")
def get_rankings(jd_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    if jd_id:
        active_jd = db.query(JobDescription).filter(JobDescription.id == jd_id).first()
    else:
        active_jd = db.query(JobDescription).filter(JobDescription.is_active == True).first()
        if not active_jd:
            active_jd = db.query(JobDescription).first()

    if not active_jd:
        return []

    rankings = db.query(Ranking).filter(
        Ranking.jd_id == active_jd.id
    ).order_by(Ranking.final_score.desc()).all()

    result = []
    for idx, r in enumerate(rankings):
        candidate = db.query(Candidate).filter(Candidate.id == r.candidate_id).first()
        result.append({
            "rank": idx + 1,
            "candidate_id": r.candidate_id,
            "candidate_name": candidate.name if candidate else r.candidate_id,
            "semantic_score": r.semantic_score,
            "skill_score": r.skill_score,
            "experience_score": r.experience_score,
            "behavior_score": r.behavior_score,
            "final_score": r.final_score
        })
    return result

@app.get("/api/analytics")
def get_analytics(jd_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    if jd_id:
        target_jd = db.query(JobDescription).filter(JobDescription.id == jd_id).first()
    else:
        target_jd = db.query(JobDescription).filter(JobDescription.is_active == True).first()
        if not target_jd:
            target_jd = db.query(JobDescription).first()
    target_jd_id = target_jd.id if target_jd else None
    return AnalyticsService.get_dashboard_analytics(db, target_jd_id)

@app.post("/api/copilot")
def copilot(request: CopilotRequest, db: Session = Depends(get_db)):
    try:
        response = CopilotEngine.answer_query(db, request.prompt, request.session_id)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Copilot query failed: {e}")

@app.get("/api/export/submission")
def export_submission(db: Session = Depends(get_db)):
    active_jd = db.query(JobDescription).filter(JobDescription.is_active == True).first()
    if not active_jd:
        active_jd = db.query(JobDescription).first()
    if not active_jd:
        raise HTTPException(status_code=400, detail="No job description found.")

    csv_data = ExportService.generate_submission_csv(db, active_jd.id)
    return StreamingResponse(
        iter([csv_data]),
        media_type="text/csv",
        headers={'Content-Disposition': f'attachment; filename="submission_jd_{active_jd.id}.csv"'}
    )

@app.get("/api/export/detailed")
def export_detailed(db: Session = Depends(get_db)):
    active_jd = db.query(JobDescription).filter(JobDescription.is_active == True).first()
    if not active_jd:
        active_jd = db.query(JobDescription).first()
    if not active_jd:
        raise HTTPException(status_code=400, detail="No job description found.")

    csv_data = ExportService.generate_detailed_csv(db, active_jd.id)
    return StreamingResponse(
        iter([csv_data]),
        media_type="text/csv",
        headers={'Content-Disposition': f'attachment; filename="detailed_jd_{active_jd.id}.csv"'}
    )
