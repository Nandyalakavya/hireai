import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import type { AnalyticsData, RankingItem } from '../services/api';
import {
  getAnalytics,
  getRankings,
  uploadResume,
  uploadJd,
  getJobDescriptions
} from '../services/api';
import {
  Users,
  FileText,
  Trophy,
  Award,
  Upload,
  Database,
  Calendar,
  Layers,
  Sparkles,
  ChevronRight,
  Plus,
  Loader2,
  CheckCircle2,
  X
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [topRankings, setTopRankings] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showJdModal, setShowJdModal] = useState(false);

  // JD Form State
  const [jdTitle, setJdTitle] = useState('');
  const [jdText, setJdText] = useState('');
  const [jdSubmitting, setJdSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const jdsRes = await getJobDescriptions();

      // Determine which JD rankings and analytics to show on dashboard.
      // Use the last selected JD from session storage if available, otherwise fallback to active JD.
      const storedJdId = sessionStorage.getItem('hireai_selected_jd_id');
      const storedJdExists = storedJdId ? jdsRes.some((jd) => jd.id === Number(storedJdId)) : false;

      const targetJd = (storedJdId && storedJdExists)
        ? jdsRes.find((jd) => jd.id === Number(storedJdId))
        : (jdsRes.find((jd) => jd.is_active) || jdsRes[0]);

      const targetJdId = targetJd?.id ?? undefined;
      const analyticsRes = await getAnalytics(targetJdId);
      setAnalytics(analyticsRes);

      if (targetJd) {
        const hasRun = sessionStorage.getItem(`hireai_ranking_run_${targetJd.id}`) === 'true';
        if (hasRun) {
          const rankingsRes = await getRankings(targetJd.id);
          setTopRankings(rankingsRes.slice(0, 5));
        } else {
          setTopRankings([]);
        }
      } else {
        setTopRankings([]);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      await uploadResume(files[0]);
      setUploadSuccess(true);
      setTimeout(() => {
        setShowResumeModal(false);
        setUploadSuccess(false);
      }, 1500);
      fetchData();
    } catch (err: any) {
      setUploadError(err.response?.data?.detail || 'Failed to upload and parse resume.');
    } finally {
      setUploading(false);
    }
  };

  const handleJdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdTitle.trim() || !jdText.trim()) return;

    setJdSubmitting(true);
    setUploadError(null);

    try {
      const newJd = await uploadJd(jdTitle, jdText);
      if (newJd && newJd.id) {
        sessionStorage.setItem('hireai_selected_jd_id', String(newJd.id));
      }
      setShowJdModal(false);
      setJdTitle('');
      setJdText('');
      fetchData();
    } catch (err: any) {
      setUploadError(err.response?.data?.detail || 'Failed to add job description.');
    } finally {
      setJdSubmitting(false);
    }
  };

  const getScoreBadgeClass = (score: number) => {
    if (score >= 80) {
      return 'text-emerald-800 bg-emerald-100 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60';
    } else if (score >= 50) {
      return 'text-amber-800 bg-amber-100 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60';
    } else {
      return 'text-red-800 bg-red-100 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/60';
    }
  };

  if (loading && !analytics) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <Header title="Dashboard" subtitle="AI-Powered Candidate Ranking & Semantic Alignment" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  const kpis = [
    { title: 'Total Candidates', value: analytics?.total_candidates ?? 0, icon: Users, bg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300' },
    { title: 'Job Descriptions', value: analytics?.job_descriptions_count ?? 0, icon: FileText, bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' },
    { title: 'Avg Match Score', value: analytics?.average_match_score ? `${analytics.average_match_score}` : '0', icon: Trophy, bg: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' },
    { title: 'Top Score', value: analytics?.top_score ? `${analytics.top_score}` : '0', icon: Award, bg: 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300' },
    { title: 'Uploaded', value: analytics?.uploaded_candidates ?? 0, icon: Upload, bg: 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300' },
    { title: 'From Dataset', value: analytics?.dataset_candidates ?? 0, icon: Database, bg: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' },
    { title: 'Avg Experience', value: analytics?.average_experience ? `${analytics.average_experience}y` : '0y', icon: Calendar, bg: 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300' },
    { title: 'Shortlisted', value: analytics?.shortlisted_candidates ?? 0, icon: Layers, bg: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300' },
  ];

  return (
    <div className="flex-grow flex flex-col min-h-screen">
      <Header title="Dashboard" subtitle="AI-Powered Candidate Ranking & Semantic Alignment" />

      <div className="flex-1 p-8 space-y-8 bg-background max-w-7xl w-full mx-auto">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, idx) => (
            <div
              key={idx}
              className="bg-card border border-card-border rounded-xl p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className={`p-3 rounded-lg ${kpi.bg}`}>
                <kpi.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-text-muted font-medium">{kpi.title}</p>
                <p className="text-2xl font-bold text-text-main mt-1">{kpi.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Dashboard Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Ranked Candidates */}
          <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-text-main">Top Ranked Candidates</h2>
                <Link
                  to="/rankings"
                  className="text-sm font-semibold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
                >
                  View All <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {topRankings.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-text-muted text-sm border-2 border-dashed border-card-border rounded-lg">
                  <Award className="w-12 h-12 stroke-1 mb-2" />
                  No candidate rankings compiled.
                  <button
                    onClick={() => navigate('/rankings')}
                    className="mt-3 text-xs font-semibold text-primary underline"
                  >
                    Run rankings engine
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {topRankings.map((cand) => (
                    <div
                      key={cand.candidate_id}
                      onClick={() => navigate(`/candidate/${cand.candidate_id}`)}
                      className="flex items-center justify-between p-3 rounded-lg border border-card-border bg-card hover:bg-background/40 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <span className="w-7 h-7 rounded-full bg-primary-light text-primary flex items-center justify-center text-xs font-bold">
                          #{cand.rank}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-text-main">{cand.candidate_name}</p>
                          <p className="text-xs text-text-muted mt-0.5">{cand.candidate_id}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getScoreBadgeClass(cand.final_score)}`}>
                        {cand.final_score}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-text-main mb-6">Quick Actions</h2>

              <div className="space-y-4">
                {/* Upload Job Description */}
                <button
                  onClick={() => setShowJdModal(true)}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-card-border bg-card hover:bg-primary-light/30 text-left transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 group-hover:bg-indigo-200 transition-colors">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-main">Upload Job Description</p>
                      <p className="text-xs text-text-muted mt-0.5">Add a new JD to start matching</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-muted group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Upload Resume */}
                <button
                  onClick={() => setShowResumeModal(true)}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-card-border bg-card hover:bg-emerald-light/30 text-left transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 group-hover:bg-emerald-200 transition-colors">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-main">Upload Resumes</p>
                      <p className="text-xs text-text-muted mt-0.5">Add candidate resumes for ranking</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-muted group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Ask Copilot */}
                <button
                  onClick={() => navigate('/copilot')}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-card-border bg-card hover:bg-amber-light/30 text-left transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 group-hover:bg-amber-200 transition-colors">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-main">Ask Copilot</p>
                      <p className="text-xs text-text-muted mt-0.5">Get AI-powered insights</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-muted group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resume Upload Modal */}
      {showResumeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-card border border-card-border rounded-xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowResumeModal(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-main transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-text-main mb-4">Upload Candidate Resume</h3>

            {uploadSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-success mb-2" />
                <p className="text-sm font-semibold text-text-main">Resume Uploaded Successfully!</p>
                <p className="text-xs text-text-muted mt-1">Extracting details and updating dashboard...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-text-muted">
                  Supported formats: **PDF, DOCX, TXT**. The AI parsing engine will automatically extract applicant summary, skills, experience, and certifications.
                </p>

                <div className="border-2 border-dashed border-card-border rounded-xl p-8 flex flex-col items-center justify-center hover:bg-background/50 transition-colors relative cursor-pointer group">
                  <input
                    type="file"
                    onChange={handleResumeUpload}
                    accept=".pdf,.docx,.txt"
                    disabled={uploading}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {uploading ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                      <span className="text-xs font-semibold text-text-main">Parsing resume...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center">
                      <Upload className="w-8 h-8 text-primary group-hover:-translate-y-1 transition-transform mb-2" />
                      <span className="text-xs font-bold text-text-main">Drag file here or click to select</span>
                      <span className="text-[10px] text-text-muted mt-1">Max size: 10MB</span>
                    </div>
                  )}
                </div>

                {uploadError && (
                  <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-xs font-medium">
                    {uploadError}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* JD Upload/Paste Modal */}
      {showJdModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-card border border-card-border rounded-xl w-full max-w-xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowJdModal(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-main transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-text-main mb-4">Add Job Description</h3>

            <form onSubmit={handleJdSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-main uppercase mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  required
                  value={jdTitle}
                  onChange={(e) => setJdTitle(e.target.value)}
                  placeholder="e.g. Senior Machine Learning Engineer"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-card-border bg-background text-text-main placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-main uppercase mb-1">
                  Job Description Text
                </label>
                <textarea
                  required
                  rows={8}
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste details, requirements, responsibilities, and experience guidelines here..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-card-border bg-background text-text-main placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              {uploadError && (
                <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-xs font-medium">
                  {uploadError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJdModal(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-lg border border-card-border bg-card hover:bg-background text-text-main transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={jdSubmitting}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary hover:bg-primary-hover text-white flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {jdSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Submit JD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Dashboard;
