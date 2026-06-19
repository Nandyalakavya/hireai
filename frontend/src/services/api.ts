import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://hireai-50ba.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export interface Candidate {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  skills: string[];
  experience: number;
  education: Array<{ degree: string; field: string; school: string }>;
  certifications: string[];
  projects: Array<{ name: string; description: string }>;
  summary: string | null;
  career_history: Array<{ title: string; company: string; duration: string; description: string }>;
  source: string;
  score: number | null;
}

export interface CandidateDetails extends Candidate {
  profile_completeness: number;
  recent_activity: number;
  response_rate: number;
  recruiter_interest: number;
  interview_success: number;
  active_jd_title: string | null;
  ranking: {
    semantic_score: number;
    skill_score: number;
    experience_score: number;
    behavior_score: number;
    final_score: number;
  } | null;
  skill_gap: {
    matched_skills: string[];
    missing_skills: string[];
    recommended_skills: string[];
  } | null;
  explanation: {
    strengths: string[];
    weaknesses: string[];
    reasoning: string;
  } | null;
}

export interface JobDescription {
  id: number;
  title: string;
  required_skills: string[];
  preferred_skills: string[];
  min_experience: number;
  max_experience: number;
  industry: string | null;
  keywords: string[];
  responsibilities: string[];
  raw_text: string | null;
  is_active: boolean;
  created_at: string | null;
}

export interface RankingItem {
  rank: number;
  candidate_id: string;
  candidate_name: string;
  semantic_score: number;
  skill_score: number;
  experience_score: number;
  behavior_score: number;
  final_score: number;
}

export interface AnalyticsData {
  total_candidates: number;
  uploaded_candidates: number;
  dataset_candidates: number;
  job_descriptions_count: number;
  average_match_score: number;
  top_score: number;
  average_experience: number;
  shortlisted_candidates: number;
  match_score_distribution: Array<{ range: string; count: number }>;
  experience_distribution: Array<{ range: string; count: number }>;
  top_skills: Array<{ skill: string; count: number }>;
  missing_skills_frequency: Array<{ skill: string; count: number }>;
  behavior_score_distribution: Array<{ range: string; count: number }>;
  ranking_curve: Array<{ rank: number; name: string; score: number }>;
}

export interface CopilotResponse {
  answer: string;
  conversation_history: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export const uploadResume = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/api/upload/resume', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const uploadJd = async (title: string, rawText: string) => {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('raw_text', rawText);
  const response = await api.post('/api/upload/jd', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateJd = async (id: number, title: string, rawText: string) => {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('raw_text', rawText);
  const response = await api.put(`/api/job-descriptions/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};


export const getCandidates = async (search?: string, source?: string): Promise<Candidate[]> => {
  const response = await api.get<Candidate[]>('/api/candidates', {
    params: { search, source },
  });
  return response.data;
};

export const getCandidateDetails = async (id: string): Promise<CandidateDetails> => {
  const response = await api.get<CandidateDetails>(`/api/candidates/${id}`);
  return response.data;
};

export const deleteCandidate = async (id: string) => {
  const response = await api.delete(`/api/candidates/${id}`);
  return response.data;
};

export const getJobDescriptions = async (): Promise<JobDescription[]> => {
  const response = await api.get<JobDescription[]>('/api/job-descriptions');
  return response.data;
};

export const activateJd = async (id: number) => {
  const response = await api.post(`/api/job-descriptions/${id}/activate`);
  return response.data;
};

export const deleteJd = async (id: number) => {
  const response = await api.delete(`/api/job-descriptions/${id}`);
  return response.data;
};

export const runRanking = async (jdId: number) => {
  const response = await api.post('/api/rank', { jd_id: jdId });
  return response.data;
};

export const getRankings = async (jdId?: number): Promise<RankingItem[]> => {
  const response = await api.get<RankingItem[]>('/api/rankings', {
    params: { jd_id: jdId },
  });
  return response.data;
};

export const getAnalytics = async (jdId?: number): Promise<AnalyticsData> => {
  const response = await api.get<AnalyticsData>('/api/analytics', {
    params: { jd_id: jdId },
  });
  return response.data;
};

export const askCopilot = async (prompt: string, sessionId: string = 'default'): Promise<CopilotResponse> => {
  const response = await api.post<CopilotResponse>('/api/copilot', {
    prompt,
    session_id: sessionId,
  });
  return response.data;
};

export const getExportSubmissionUrl = () => `${API_BASE_URL}/api/export/submission`;
export const getExportDetailedUrl = () => `${API_BASE_URL}/api/export/detailed`;

export default api;
