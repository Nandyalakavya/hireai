import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import type { CandidateDetails as DetailsType } from '../services/api';
import { getCandidateDetails } from '../services/api';
import {
  ArrowLeft,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Award,
  FolderGit2,
  AlertTriangle,
  CheckCircle,
  ThumbsUp,
  User,
  Loader2,
  Calendar
} from 'lucide-react';

export const CandidateDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<DetailsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getCandidateDetails(id);
        setCandidate(data);
      } catch (err) {
        console.error('Error fetching candidate details:', err);
        setError('Candidate not found or failed to retrieve profiles.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-grow flex flex-col min-h-screen">
        <Header title="Candidate Details" subtitle="Loading profile..." />
        <div className="flex-grow flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="flex-grow flex flex-col min-h-screen">
        <Header title="Candidate Details" subtitle="Profile unavailable" />
        <div className="flex-grow flex flex-col items-center justify-center bg-background space-y-4">
          <AlertTriangle className="w-12 h-12 text-danger" />
          <p className="text-sm font-bold text-text-main">{error || 'Failed to load details'}</p>
          <button
            onClick={() => navigate('/candidates')}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold transition-colors hover:bg-primary-hover"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-700 dark:text-emerald-400 border-emerald-500/30 dark:border-emerald-600/30';
    if (score >= 50) return 'text-amber-700 dark:text-amber-400 border-amber-500/30 dark:border-amber-600/30';
    return 'text-red-700 dark:text-red-400 border-red-500/30 dark:border-red-600/30';
  };

  const scoreLabel = (label: string, score: number | undefined) => (
    <div className="flex flex-col items-center p-3 rounded-lg border border-card-border bg-background">
      <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{label}</span>
      <span className={`text-xl font-bold mt-1 ${getScoreColor(score ?? 0)}`}>
        {score !== undefined ? `${Math.round(score)}` : 'N/A'}
      </span>
    </div>
  );

  return (
    <div className="flex-grow flex flex-col min-h-screen bg-background">
      <Header title="Candidate Profile" subtitle={`Details for ${candidate.name} (${candidate.id})`} />

      <div className="flex-1 p-8 space-y-8 max-w-7xl w-full mx-auto">
        {/* Back Button */}
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-text-main transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to list
          </button>
        </div>

        {/* Profile Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Personal details & Behavior scores */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-2xl">
                  {candidate.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-main leading-tight">{candidate.name}</h2>
                  <p className="text-xs text-text-muted mt-1 font-medium">{candidate.career_history[0]?.title || 'Applicant'}</p>
                </div>
              </div>

              <div className="border-t border-card-border pt-4 space-y-3">
                <div className="flex items-center gap-2.5 text-sm text-text-muted">
                  <Mail className="w-4 h-4 text-text-muted flex-shrink-0" />
                  <span className="truncate">{candidate.email || 'No email available'}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-text-muted">
                  <Phone className="w-4 h-4 text-text-muted flex-shrink-0" />
                  <span>{candidate.phone || 'No phone number'}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-text-muted">
                  <Briefcase className="w-4 h-4 text-text-muted flex-shrink-0" />
                  <span>{candidate.experience} Years Experience</span>
                </div>
              </div>
            </div>

            {/* Match Scores Card */}
            <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-text-main uppercase tracking-wider">Evaluation Scores</h3>
              <p className="text-xs text-text-muted">
                Scores calculated matching this profile with the active JD: <span className="font-semibold text-text-main">{candidate.active_jd_title || 'Active Position'}</span>.
              </p>

              {candidate.ranking ? (
                <div className="space-y-4">
                  {/* Final score gauge */}
                  <div className="flex flex-col items-center py-3 bg-primary-light/30 rounded-xl border border-primary/20">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">Final Match Score</span>
                    <span className="text-4xl font-extrabold text-primary mt-1">{Math.round(candidate.ranking.final_score)}%</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {scoreLabel('Semantic', candidate.ranking.semantic_score)}
                    {scoreLabel('Skill Match', candidate.ranking.skill_score)}
                    {scoreLabel('Experience', candidate.ranking.experience_score)}
                    {scoreLabel('Behavior', candidate.ranking.behavior_score)}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-background border border-card-border rounded-xl text-center text-xs text-text-muted italic">
                  Rankings have not been generated for this candidate.
                </div>
              )}
            </div>

            {/* Behavior Signals Card */}
            <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-text-main uppercase tracking-wider">Behavioral Signals</h3>
              <div className="space-y-3">
                {[
                  { label: 'Profile Completeness', val: candidate.profile_completeness },
                  { label: 'Recent Activity', val: candidate.recent_activity },
                  { label: 'Response Rate', val: candidate.response_rate },
                  { label: 'Recruiter Interest', val: candidate.recruiter_interest },
                  { label: 'Interview Success', val: candidate.interview_success },
                ].map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-text-muted">{item.label}</span>
                      <span className="text-text-main font-bold">{item.val}%</span>
                    </div>
                    <div className="w-full bg-background border border-card-border h-1.5 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${item.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Experience, Timeline, Projects, Education, Gaps */}
          <div className="lg:col-span-8 space-y-6">
            {/* Candidate Summary */}
            {candidate.summary && (
              <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-text-main uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-primary" /> Professional Summary
                </h3>
                <p className="text-sm text-text-muted leading-relaxed">{candidate.summary}</p>
              </div>
            )}

            {/* Career Timeline */}
            <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-text-main uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-primary" /> Career History
              </h3>
              <div className="relative border-l-2 border-card-border pl-6 space-y-6 ml-2">
                {candidate.career_history.map((job, idx) => (
                  <div key={idx} className="relative space-y-1.5">
                    {/* Bullet marker */}
                    <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-primary border border-card" />
                    
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <h4 className="text-sm font-bold text-text-main">{job.title}</h4>
                      <span className="px-2 py-0.5 rounded bg-background border border-card-border text-[10px] text-text-muted font-bold flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {job.duration}
                      </span>
                    </div>
                    <p className="text-xs text-primary font-semibold">{job.company}</p>
                    <p className="text-sm text-text-muted leading-relaxed pt-1">{job.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Gap Analysis & Explanation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Skill Gaps details */}
              <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-text-main uppercase tracking-wider">Skill Gap Analysis</h3>
                
                {candidate.skill_gap ? (
                  <div className="space-y-4">
                    {/* Matched skills */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-success flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" /> Matched Skills
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {candidate.skill_gap.matched_skills.map((s, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 text-xs font-medium text-green-700 dark:text-green-400">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Missing skills */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-danger flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" /> Missing Skills
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {candidate.skill_gap.missing_skills.length > 0 ? (
                          candidate.skill_gap.missing_skills.map((s, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-xs font-medium text-danger dark:text-red-400">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-text-muted italic">No missing skills detected!</span>
                        )}
                      </div>
                    </div>

                    {/* Recommended skills */}
                    {candidate.skill_gap.recommended_skills.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                          <ThumbsUp className="w-4 h-4" /> Recommended Additional
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {candidate.skill_gap.recommended_skills.map((s, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-primary-light border border-primary/20 text-xs font-medium text-primary">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-text-muted italic">Skill gap details not compiled.</div>
                )}
              </div>

              {/* Explanations strengths */}
              <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-text-main uppercase tracking-wider">Recruiter Evaluation</h3>
                
                {candidate.explanation ? (
                  <div className="space-y-4">
                    {/* Strengths list */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-text-main uppercase tracking-wider">Key Strengths</span>
                      <ul className="list-disc list-inside text-xs text-text-muted space-y-1">
                        {candidate.explanation.strengths.map((str, idx) => (
                          <li key={idx} className="leading-normal">{str}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Reasoning narrative */}
                    <div className="space-y-2 border-t border-card-border pt-3">
                      <span className="text-xs font-bold text-text-main uppercase tracking-wider">Summary Reasoning</span>
                      <p className="text-xs text-text-muted leading-relaxed whitespace-pre-wrap">{candidate.explanation.reasoning}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-text-muted italic">Recruiter reasoning not generated. Run evaluation first.</div>
                )}
              </div>
            </div>

            {/* Projects, Education, Certifications */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Projects Card */}
              <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm space-y-3 md:col-span-2">
                <h3 className="text-sm font-bold text-text-main uppercase tracking-wider flex items-center gap-1.5">
                  <FolderGit2 className="w-4 h-4 text-primary" /> Key Projects
                </h3>
                <div className="space-y-4">
                  {candidate.projects.length > 0 ? (
                    candidate.projects.map((proj, idx) => (
                      <div key={idx} className="space-y-1">
                        <h4 className="text-xs font-bold text-text-main">{proj.name}</h4>
                        <p className="text-xs text-text-muted leading-normal">{proj.description}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-text-muted italic">No project listings available</p>
                  )}
                </div>
              </div>

              {/* Education & Certs Column */}
              <div className="space-y-6">
                {/* Education Card */}
                <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm space-y-3">
                  <h3 className="text-sm font-bold text-text-main uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-primary" /> Education
                  </h3>
                  <div className="space-y-3">
                    {candidate.education.map((edu, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <p className="text-xs font-bold text-text-main">{edu.degree} in {edu.field}</p>
                        <p className="text-[10px] text-text-muted">{edu.school}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Certifications Card */}
                <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm space-y-3">
                  <h3 className="text-sm font-bold text-text-main uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-primary" /> Certifications
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {candidate.certifications.length > 0 ? (
                      candidate.certifications.map((cert, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-background border border-card-border text-[10px] text-text-main font-medium">
                          {cert}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-text-muted italic">None certified</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
export default CandidateDetails;
