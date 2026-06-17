import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import type { JobDescription, RankingItem, Candidate } from '../services/api';
import {
  getJobDescriptions,
  getRankings,
  runRanking,
  getExportDetailedUrl,
  getExportSubmissionUrl,
  getCandidates
} from '../services/api';
import {
  Download,
  Play,
  Star,
  Eye,
  ChevronDown,
  ChevronUp,
  Loader2,
  Trophy
} from 'lucide-react';

export const Rankings: React.FC = () => {
  const navigate = useNavigate();
  const [jds, setJds] = useState<JobDescription[]>([]);
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedJdId, setSelectedJdId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [rankingRunning, setRankingRunning] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [hasRanked, setHasRanked] = useState(false);

  // Local storage shortlist state to persist favorite candidates
  const [shortlisted, setShortlisted] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem('shortlisted_candidates') || '[]');
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const jdsRes = await getJobDescriptions();
      setJds(jdsRes);

      // Restore selected JD from sessionStorage or find active JD
      let targetJdId: number | null = null;
      const storedJdId = sessionStorage.getItem('hireai_selected_jd_id');
      const storedJdExists = storedJdId ? jdsRes.some((jd) => jd.id === Number(storedJdId)) : false;

      if (storedJdId && storedJdExists) {
        targetJdId = Number(storedJdId);
      } else {
        let activeJd = jdsRes.find((jd) => jd.is_active);
        if (!activeJd && jdsRes.length > 0) {
          activeJd = jdsRes[0];
        }
        targetJdId = activeJd?.id ?? null;
      }
      setSelectedJdId(targetJdId);

      // Fetch rankings if already run for this JD in current session
      if (targetJdId && sessionStorage.getItem(`hireai_ranking_run_${targetJdId}`) === 'true') {
        const rankingsRes = await getRankings(targetJdId);
        setRankings(rankingsRes);
        setHasRanked(true);
      } else {
        setRankings([]);
        setHasRanked(false);
      }

      const candidatesRes = await getCandidates();
      setCandidates(candidatesRes);
    } catch (err) {
      console.error('Error fetching rankings data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleJdChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const jdId = Number(e.target.value);
    setSelectedJdId(jdId);
    sessionStorage.setItem('hireai_selected_jd_id', String(jdId));
    
    if (sessionStorage.getItem(`hireai_ranking_run_${jdId}`) === 'true') {
      try {
        const rankingsRes = await getRankings(jdId);
        setRankings(rankingsRes);
        setHasRanked(true);
      } catch (err) {
        console.error('Error fetching rankings for JD:', err);
        setRankings([]);
        setHasRanked(false);
      }
    } else {
      setRankings([]);
      setHasRanked(false);
    }
  };

  const handleRunRanking = async () => {
    if (!selectedJdId) return;
    setRankingRunning(true);
    try {
      await runRanking(selectedJdId);
      const rankingsRes = await getRankings(selectedJdId);
      setRankings(rankingsRes);
      setHasRanked(true);
      // Persist so Dashboard knows rankings exist in this session
      sessionStorage.setItem('hireai_ranking_run', 'true');
      sessionStorage.setItem(`hireai_ranking_run_${selectedJdId}`, 'true');
      sessionStorage.setItem('hireai_selected_jd_id', String(selectedJdId));
    } catch (err) {
      console.error('Error running ranking compilation:', err);
    } finally {
      setRankingRunning(false);
    }
  };

  const handleToggleShortlist = (candId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    let updated: string[];
    if (shortlisted.includes(candId)) {
      updated = shortlisted.filter((id) => id !== candId);
    } else {
      updated = [...shortlisted, candId];
    }
    setShortlisted(updated);
    localStorage.setItem('shortlisted_candidates', JSON.stringify(updated));
  };

  const handleExport = (type: 'submission' | 'detailed') => {
    const url = type === 'submission' ? getExportSubmissionUrl() : getExportDetailedUrl();
    window.open(url, '_blank');
  };

  const toggleRowExpansion = (candId: string) => {
    setExpandedRow(expandedRow === candId ? null : candId);
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

  const getCandidateSkills = (candId: string) => {
    const cand = candidates.find((c) => c.id === candId);
    return cand?.skills || [];
  };

  const getCandidateSummary = (candId: string) => {
    const cand = candidates.find((c) => c.id === candId);
    return cand?.summary || 'No summary parsed.';
  };

  if (loading && jds.length === 0) {
    return (
      <div className="flex-grow flex flex-col min-h-screen">
        <Header title="Rankings" subtitle="AI-powered candidate ranking" />
        <div className="flex-grow flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col min-h-screen">
      {/* Top Header */}
      <header className="h-16 border-b border-card-border bg-card px-8 flex items-center justify-between z-10 select-none">
        <div>
          <h1 className="text-xl font-bold text-text-main m-0 p-0 leading-none">Rankings</h1>
          <p className="text-xs text-text-muted mt-1 leading-none">AI-powered candidate ranking</p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('submission')}
            disabled={!selectedJdId || rankings.length === 0}
            className="px-3.5 py-1.5 border border-card-border bg-card hover:bg-background text-text-main rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" /> Submission
          </button>
          <button
            onClick={() => handleExport('detailed')}
            disabled={!selectedJdId || rankings.length === 0}
            className="px-3.5 py-1.5 border border-card-border bg-card hover:bg-background text-text-main rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" /> Detailed
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 p-8 space-y-6 bg-background max-w-6xl w-full mx-auto">
        {/* Selection & Run ranking bar */}
        <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 space-y-1">
            <label className="block text-xs font-bold text-text-main uppercase">
              Select Job Description
            </label>
            <select
              value={selectedJdId ?? ''}
              onChange={handleJdChange}
              className="w-full md:max-w-xl px-3 py-2 rounded-lg border border-card-border bg-card text-text-main text-sm focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
            >
              {jds.map((jd) => (
                <option key={jd.id} value={jd.id}>
                  {jd.title} {jd.is_active ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRunRanking}
            disabled={!selectedJdId || rankingRunning}
            className="self-end md:self-center px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-sm font-semibold rounded-lg flex items-center gap-1.5 shadow transition-colors"
          >
            {rankingRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-white text-white" />
            )}
            Run Ranking
          </button>
        </div>

        {/* Rankings Leaderboard */}
        {!hasRanked ? (
          <div className="text-center py-20 bg-card border border-card-border rounded-xl shadow-sm">
            <Trophy className="w-16 h-16 stroke-1 mx-auto text-text-muted mb-3" />
            <h3 className="text-lg font-bold text-text-main">No Rankings Generated</h3>
            <p className="text-sm text-text-muted max-w-sm mx-auto mt-1">
              Select a job description and click <strong>Run Ranking</strong> to trigger the AI-powered ranking engine.
            </p>
          </div>
        ) : (
          <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-card-border bg-background/50 text-[10px] text-text-muted font-bold uppercase tracking-wider select-none">
                    <th className="py-4 px-6 text-center w-16">Rank</th>
                    <th className="py-4 px-6">Candidate</th>
                    <th className="py-4 px-6 text-center">Semantic</th>
                    <th className="py-4 px-6 text-center">Skill</th>
                    <th className="py-4 px-6 text-center">Exp</th>
                    <th className="py-4 px-6 text-center">Behavior</th>
                    <th className="py-4 px-6 text-center">Final</th>
                    <th className="py-4 px-6 text-center w-36">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {rankings.map((row) => {
                    const isExpanded = expandedRow === row.candidate_id;
                    const isStarred = shortlisted.includes(row.candidate_id);

                    return (
                      <React.Fragment key={row.candidate_id}>
                        <tr
                          onClick={() => toggleRowExpansion(row.candidate_id)}
                          className={`hover:bg-background/30 transition-colors cursor-pointer ${isExpanded ? 'bg-background/20' : ''
                            }`}
                        >
                          {/* Rank badge */}
                          <td className="py-4 px-6 text-center">
                            <span className="inline-flex w-7 h-7 rounded-full bg-primary text-white text-xs font-bold items-center justify-center">
                              {row.rank}
                            </span>
                          </td>

                          {/* Candidate info */}
                          <td className="py-4 px-6">
                            <div>
                              <p className="text-sm font-bold text-text-main">{row.candidate_name}</p>
                              <p className="text-xs text-text-muted mt-0.5">{row.candidate_id}</p>
                            </div>
                          </td>

                          {/* Scores pills */}
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${getScoreBadgeClass(row.semantic_score)}`}>
                              {row.semantic_score}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${getScoreBadgeClass(row.skill_score)}`}>
                              {row.skill_score}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${getScoreBadgeClass(row.experience_score)}`}>
                              {row.experience_score}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${getScoreBadgeClass(row.behavior_score)}`}>
                              {row.behavior_score}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${getScoreBadgeClass(row.final_score)}`}>
                              {row.final_score}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-2">
                              {/* Star Shortlist */}
                              <button
                                onClick={(e) => handleToggleShortlist(row.candidate_id, e)}
                                className={`p-1.5 rounded-lg border transition-colors ${isStarred
                                  ? 'bg-amber-50 border-amber-300 text-amber-500 hover:bg-amber-100'
                                  : 'border-card-border hover:bg-background text-text-muted hover:text-text-main'
                                  }`}
                                title="Shortlist Candidate"
                              >
                                <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-500' : ''}`} />
                              </button>

                              {/* View Details */}
                              <button
                                onClick={() => navigate(`/candidate/${row.candidate_id}`)}
                                className="p-1.5 border border-card-border rounded-lg text-text-muted hover:text-text-main hover:bg-background transition-colors"
                                title="View Profile"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Collapse/Expand details */}
                              <button
                                onClick={() => toggleRowExpansion(row.candidate_id)}
                                className="p-1.5 border border-card-border rounded-lg text-text-muted hover:text-text-main hover:bg-background transition-colors"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expand Row Drawer */}
                        {isExpanded && (
                          <tr className="bg-background/10 select-none">
                            <td colSpan={8} className="py-4 px-8 border-b border-card-border">
                              <div className="space-y-3 animate-fadeIn">
                                <div>
                                  <h4 className="text-xs font-bold text-text-main uppercase tracking-wider">Candidate Summary</h4>
                                  <p className="text-xs text-text-muted leading-relaxed mt-1">{getCandidateSummary(row.candidate_id)}</p>
                                </div>
                                <div className="space-y-1.5">
                                  <h4 className="text-xs font-bold text-text-main uppercase tracking-wider">Top parsed skills</h4>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {getCandidateSkills(row.candidate_id).slice(0, 10).map((s, idx) => (
                                      <span key={idx} className="px-2 py-0.5 rounded bg-card border border-card-border text-[10px] text-text-main font-medium">
                                        {s}
                                      </span>
                                    ))}
                                    {getCandidateSkills(row.candidate_id).length > 10 && (
                                      <span className="px-2 py-0.5 rounded bg-card border border-card-border text-[10px] text-text-muted font-bold">
                                        +{getCandidateSkills(row.candidate_id).length - 10}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default Rankings;
