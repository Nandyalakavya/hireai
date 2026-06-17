import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import type { JobDescription, RankingItem, CandidateDetails } from '../services/api';
import {
  getJobDescriptions,
  getRankings,
  getCandidateDetails
} from '../services/api';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar
} from 'recharts';
import {
  Loader2,
  Users,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Lightbulb,
  Check
} from 'lucide-react';

export const Compare: React.FC = () => {
  const [jds, setJds] = useState<JobDescription[]>([]);
  const [selectedJdId, setSelectedJdId] = useState<number | null>(null);
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selected candidates ids (max 3)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [compareData, setCompareData] = useState<CandidateDetails[]>([]);
  const [fetchingCompare, setFetchingCompare] = useState(false);

  useEffect(() => {
    const fetchInit = async () => {
      try {
        setLoading(true);
        const jdsRes = await getJobDescriptions();
        setJds(jdsRes);

        let activeJd = jdsRes.find((jd) => jd.is_active);
        if (!activeJd && jdsRes.length > 0) {
          activeJd = jdsRes[0];
        }

        if (activeJd) {
          setSelectedJdId(activeJd.id);
          const rankingsRes = await getRankings(activeJd.id);
          setRankings(rankingsRes);
        }
      } catch (err) {
        console.error('Error fetching initial comparison data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInit();
  }, []);

  const handleJdChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const jdId = Number(e.target.value);
    setSelectedJdId(jdId);
    setLoading(true);
    setSelectedIds([]);
    setCompareData([]);
    try {
      const rankingsRes = await getRankings(jdId);
      setRankings(rankingsRes);
    } catch (err) {
      console.error('Error changing JD on compare:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCandidate = (candId: string) => {
    if (selectedIds.includes(candId)) {
      setSelectedIds(selectedIds.filter((id) => id !== candId));
    } else {
      if (selectedIds.length >= 3) {
        alert('You can select a maximum of 3 candidates to compare.');
        return;
      }
      setSelectedIds([...selectedIds, candId]);
    }
  };

  // Fetch full details for compared candidates when selections change
  useEffect(() => {
    const fetchCompareDetails = async () => {
      if (selectedIds.length < 2) {
        setCompareData([]);
        return;
      }

      setFetchingCompare(true);
      try {
        const promises = selectedIds.map((id) => getCandidateDetails(id));
        const results = await Promise.all(promises);
        setCompareData(results);
      } catch (err) {
        console.error('Error fetching candidate details for comparison:', err);
      } finally {
        setFetchingCompare(false);
      }
    };
    fetchCompareDetails();
  }, [selectedIds]);

  // Colors mapping for charts
  const candidateColors = [
    { stroke: '#4F46E5', fill: '#4F46E5', fillOpacity: 0.2, bar: '#4F46E5' }, // indigo
    { stroke: '#06B6D4', fill: '#06B6D4', fillOpacity: 0.2, bar: '#06B6D4' }, // cyan
    { stroke: '#F59E0B', fill: '#F59E0B', fillOpacity: 0.2, bar: '#F59E0B' }, // amber
  ];

  // Prepare data for Radar Chart
  const chartMetrics = ['Semantic', 'Skill', 'Experience', 'Behavior', 'Final'];
  
  const getRadarData = () => {
    return chartMetrics.map((metric) => {
      const dataPoint: any = { subject: metric };
      compareData.forEach((cand) => {
        if (!cand.ranking) return;
        let val = 0;
        if (metric === 'Semantic') val = cand.ranking.semantic_score;
        else if (metric === 'Skill') val = cand.ranking.skill_score;
        else if (metric === 'Experience') val = cand.ranking.experience_score;
        else if (metric === 'Behavior') val = cand.ranking.behavior_score;
        else if (metric === 'Final') val = cand.ranking.final_score;
        dataPoint[cand.name] = val;
      });
      return dataPoint;
    });
  };

  const getBarData = () => {
    return compareData.map((cand) => {
      if (!cand.ranking) return null;
      return {
        name: cand.name.split(' ')[0], // first name for spacing
        Semantic: cand.ranking.semantic_score,
        Skill: cand.ranking.skill_score,
        Experience: cand.ranking.experience_score,
        Behavior: cand.ranking.behavior_score,
        Final: cand.ranking.final_score,
      };
    }).filter(Boolean);
  };

  if (loading && jds.length === 0) {
    return (
      <div className="flex-grow flex flex-col min-h-screen">
        <Header title="Compare Candidates" subtitle="Select 2-3 candidates to compare side by side" />
        <div className="flex-grow flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col min-h-screen">
      <Header title="Compare Candidates" subtitle="Select 2-3 candidates to compare side by side" />

      <div className="flex-1 p-8 space-y-8 bg-background max-w-6xl w-full mx-auto">
        
        {/* Job Description Dropdown Card */}
        <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm space-y-2">
          <label className="block text-xs font-bold text-text-main uppercase">
            Job Description
          </label>
          <select
            value={selectedJdId ?? ''}
            onChange={handleJdChange}
            className="w-full md:max-w-xl px-3 py-2 rounded-lg border border-card-border bg-card text-text-main text-sm focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
          >
            {jds.map((jd) => (
              <option key={jd.id} value={jd.id}>
                {jd.title}
              </option>
            ))}
          </select>
        </div>

        {/* Candidate Selector Grid */}
        <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-text-main uppercase tracking-wider">
            Select candidates (max 3):
          </h3>

          {rankings.length === 0 ? (
            <p className="text-sm text-text-muted italic">No ranked candidates found. Please activate this JD and run rankings first.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {rankings.map((cand) => {
                const isSelected = selectedIds.includes(cand.candidate_id);
                return (
                  <div
                    key={cand.candidate_id}
                    onClick={() => handleSelectCandidate(cand.candidate_id)}
                    className={`p-4 rounded-xl border cursor-pointer select-none transition-all duration-200 ${
                      isSelected
                        ? 'border-primary bg-primary-light/30 shadow'
                        : 'border-card-border hover:border-text-muted/30 hover:bg-background/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-text-muted font-bold">#{cand.rank} {cand.candidate_id}</span>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-text-main truncate">{cand.candidate_name}</p>
                    <p className="text-xs text-text-muted mt-0.5">Score: <span className="font-bold text-text-main">{cand.final_score}</span></p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Comparison Dashboard (rendered only when 2-3 candidates selected) */}
        {selectedIds.length < 2 ? (
          <div className="py-20 text-center bg-card border border-card-border rounded-xl shadow-sm">
            <Users className="w-16 h-16 stroke-1 mx-auto text-text-muted mb-3" />
            <h3 className="text-base font-bold text-text-main">Awaiting Selection</h3>
            <p className="text-sm text-text-muted max-w-sm mx-auto mt-1">
              Select 2 or 3 candidates from the panel above to begin side-by-side comparisons, radar diagrams, and skill-gap breakdowns.
            </p>
          </div>
        ) : fetchingCompare ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="space-y-8 animate-fadeIn">
            {/* Visualizations Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Radar Chart */}
              <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm flex flex-col items-center">
                <h3 className="text-sm font-bold text-text-main uppercase tracking-wider mb-6 self-start">
                  Score Dimensions Comparison (Radar)
                </h3>
                <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={getRadarData()}>
                      <PolarGrid stroke="#E2E8F0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      {compareData.map((cand, idx) => (
                        <Radar
                          key={cand.id}
                          name={cand.name}
                          dataKey={cand.name}
                          stroke={candidateColors[idx].stroke}
                          fill={candidateColors[idx].fill}
                          fillOpacity={candidateColors[idx].fillOpacity}
                        />
                      ))}
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-text-main uppercase tracking-wider mb-6">
                  Final Match Breakdown (Bar)
                </h3>
                <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getBarData() as any} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 12 }} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Final" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Semantic" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Skill" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Score Breakdown Table */}
            <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-card-border">
                <h3 className="text-sm font-bold text-text-main uppercase tracking-wider">Score Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-card-border bg-background/50 font-semibold text-text-muted">
                      <th className="py-4 px-6">Metric</th>
                      {compareData.map((cand) => (
                        <th key={cand.id} className="py-4 px-6">{cand.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-card-border">
                    <tr>
                      <td className="py-4 px-6 font-semibold">Final Score</td>
                      {compareData.map((cand) => (
                        <td key={cand.id} className="py-4 px-6 text-primary font-bold text-base">
                          {cand.ranking?.final_score}%
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-4 px-6 font-semibold">Semantic Match</td>
                      {compareData.map((cand) => (
                        <td key={cand.id} className="py-4 px-6 text-text-main">
                          {cand.ranking?.semantic_score}%
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-4 px-6 font-semibold">Skill Score</td>
                      {compareData.map((cand) => (
                        <td key={cand.id} className="py-4 px-6 text-text-main">
                          {cand.ranking?.skill_score}%
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-4 px-6 font-semibold">Experience Score</td>
                      {compareData.map((cand) => (
                        <td key={cand.id} className="py-4 px-6 text-text-main">
                          {cand.ranking?.experience_score}%
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-4 px-6 font-semibold">Behavior Score</td>
                      {compareData.map((cand) => (
                        <td key={cand.id} className="py-4 px-6 text-text-main">
                          {cand.ranking?.behavior_score}%
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Strengths / Weaknesses / Skills side-by-side details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {compareData.map((cand, idx) => (
                <div key={cand.id} className="bg-card border border-card-border rounded-xl p-6 shadow-sm space-y-5">
                  <div className="flex items-center gap-3 pb-3 border-b border-card-border">
                    <span
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: candidateColors[idx].stroke }}
                    />
                    <div>
                      <h4 className="text-sm font-bold text-text-main">{cand.name}</h4>
                      <span className="text-[10px] text-text-muted font-bold tracking-wider">{cand.id} &bull; {cand.experience}y exp</span>
                    </div>
                  </div>

                  {/* Matched Skills */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-success flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Matched Skills
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {cand.skill_gap?.matched_skills.slice(0, 8).map((s, index) => (
                        <span key={index} className="px-1.5 py-0.5 rounded bg-green-50 dark:bg-green-950/20 border border-green-200 text-[10px] font-medium text-green-700 dark:text-green-400">
                          {s}
                        </span>
                      ))}
                      {cand.skill_gap?.matched_skills.length === 0 && (
                        <span className="text-xs text-text-muted italic">None matched</span>
                      )}
                    </div>
                  </div>

                  {/* Missing Skills */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-danger flex items-center gap-1.5">
                      <XCircle className="w-4 h-4" /> Missing Skills
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {cand.skill_gap?.missing_skills.slice(0, 8).map((s, index) => (
                        <span key={index} className="px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/20 border border-red-200 text-[10px] font-medium text-danger dark:text-red-400">
                          {s}
                        </span>
                      ))}
                      {cand.skill_gap?.missing_skills.length === 0 && (
                        <span className="text-xs text-text-muted italic">None missing</span>
                      )}
                    </div>
                  </div>

                  {/* Strengths */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-text-main flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-primary" /> Key Strengths
                    </span>
                    <ul className="list-disc list-inside text-xs text-text-muted space-y-1">
                      {cand.explanation?.strengths.slice(0, 3).map((str, index) => (
                        <li key={index} className="leading-tight">{str}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Reasons / Summary */}
                  <div className="space-y-2 border-t border-card-border pt-4">
                    <span className="text-xs font-bold text-text-main flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-warning" /> Decision Reasoning
                    </span>
                    <p className="text-xs text-text-muted leading-relaxed">
                      {cand.explanation?.reasoning ? (
                        cand.explanation.reasoning.split('\n')[0]
                      ) : (
                        'No detailed evaluation compiled yet.'
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
export default Compare;
