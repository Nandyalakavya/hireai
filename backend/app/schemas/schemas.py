from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Candidate Schemas
class CandidateBase(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    skills: List[str] = []
    experience: float = 0.0
    education: List[Dict[str, Any]] = []
    certifications: List[str] = []
    projects: List[Dict[str, Any]] = []
    summary: Optional[str] = None
    career_history: List[Dict[str, Any]] = []
    source: str = "dataset"
    
    # Behavior metrics
    profile_completeness: float = 0.0
    recent_activity: float = 0.0
    response_rate: float = 0.0
    recruiter_interest: float = 0.0
    interview_success: float = 0.0

class CandidateCreate(CandidateBase):
    pass

class CandidateResponse(CandidateBase):
    created_at: datetime

    class Config:
        from_attributes = True

# Job Description Schemas
class JobDescriptionBase(BaseModel):
    title: str
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    min_experience: float = 0.0
    max_experience: float = 100.0
    industry: Optional[str] = None
    keywords: List[str] = []
    responsibilities: List[str] = []
    raw_text: Optional[str] = None
    is_active: bool = False

class JobDescriptionCreate(BaseModel):
    title: str
    raw_text: str
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    min_experience: Optional[float] = None
    max_experience: Optional[float] = None
    industry: Optional[str] = None

class JobDescriptionResponse(JobDescriptionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Ranking Schemas
class RankingResponse(BaseModel):
    rank: int
    candidate_id: str
    candidate_name: str
    semantic_score: float
    skill_score: float
    experience_score: float
    behavior_score: float
    final_score: float

    class Config:
        from_attributes = True

class RunRankingRequest(BaseModel):
    jd_id: int

# Copilot Schemas
class CopilotRequest(BaseModel):
    prompt: str
    session_id: Optional[str] = "default"

class CopilotResponse(BaseModel):
    answer: str
    conversation_history: List[Dict[str, str]] = []

# Analytics Schemas
class AnalyticsResponse(BaseModel):
    total_candidates: int
    uploaded_candidates: int
    dataset_candidates: int
    job_descriptions_count: int
    average_match_score: float
    top_score: float
    average_experience: float
    shortlisted_candidates: int
    
    # Chart Data
    match_score_distribution: List[Dict[str, Any]]
    experience_distribution: List[Dict[str, Any]]
    top_skills: List[Dict[str, Any]]
    missing_skills_frequency: List[Dict[str, Any]]
    behavior_score_distribution: List[Dict[str, Any]]
    ranking_curve: List[Dict[str, Any]]
