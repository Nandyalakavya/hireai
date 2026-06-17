import datetime
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .connection import Base

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(String, primary_key=True, index=True) # e.g. "C001", "C002"
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    skills = Column(Text, nullable=True) # JSON array of skills
    experience = Column(Float, default=0.0) # years of experience
    education = Column(Text, nullable=True) # JSON array of education dicts
    certifications = Column(Text, nullable=True) # JSON array of certs
    projects = Column(Text, nullable=True) # JSON array of projects
    summary = Column(Text, nullable=True)
    career_history = Column(Text, nullable=True) # JSON array of career events
    source = Column(String, default="dataset") # "dataset" or "uploaded"
    
    # Behavior metrics
    profile_completeness = Column(Float, default=0.0)
    recent_activity = Column(Float, default=0.0)
    response_rate = Column(Float, default=0.0)
    recruiter_interest = Column(Float, default=0.0)
    interview_success = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    rankings = relationship("Ranking", back_populates="candidate", cascade="all, delete-orphan")
    skill_gaps = relationship("SkillGap", back_populates="candidate", cascade="all, delete-orphan")

class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String, nullable=False)
    required_skills = Column(Text, nullable=True) # JSON array
    preferred_skills = Column(Text, nullable=True) # JSON array
    min_experience = Column(Float, default=0.0)
    max_experience = Column(Float, default=100.0)
    industry = Column(String, nullable=True)
    keywords = Column(Text, nullable=True) # JSON array
    responsibilities = Column(Text, nullable=True) # JSON array
    raw_text = Column(Text, nullable=True)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    rankings = relationship("Ranking", back_populates="job_description", cascade="all, delete-orphan")
    skill_gaps = relationship("SkillGap", back_populates="job_description", cascade="all, delete-orphan")

class Ranking(Base):
    __tablename__ = "rankings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    candidate_id = Column(String, ForeignKey("candidates.id"), nullable=False)
    jd_id = Column(Integer, ForeignKey("job_descriptions.id"), nullable=False)
    
    semantic_score = Column(Float, default=0.0)
    skill_score = Column(Float, default=0.0)
    experience_score = Column(Float, default=0.0)
    behavior_score = Column(Float, default=0.0)
    final_score = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    candidate = relationship("Candidate", back_populates="rankings")
    job_description = relationship("JobDescription", back_populates="rankings")

class SkillGap(Base):
    __tablename__ = "skill_gaps"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    candidate_id = Column(String, ForeignKey("candidates.id"), nullable=False)
    jd_id = Column(Integer, ForeignKey("job_descriptions.id"), nullable=False)
    
    matched_skills = Column(Text, nullable=True) # JSON array
    missing_skills = Column(Text, nullable=True) # JSON array
    recommended_skills = Column(Text, nullable=True) # JSON array
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    candidate = relationship("Candidate", back_populates="skill_gaps")
    job_description = relationship("JobDescription", back_populates="skill_gaps")

class Analytics(Base):
    __tablename__ = "analytics"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    metric_name = Column(String, nullable=False)
    metric_value = Column(Float, nullable=False)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)

class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(String, default="default")
    role = Column(String, nullable=False) # "user" or "assistant"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Upload(Base):
    __tablename__ = "uploads"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False) # "resume" or "jd"
    status = Column(String, default="pending") # "pending", "success", "failed"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
