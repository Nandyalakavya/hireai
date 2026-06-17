import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import type { AnalyticsData } from '../services/api';
import { getAnalytics } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  Users,
  FileText,
  Trophy,
  Award,
  Calendar,
  Layers,
  Upload,
  Database,
  Loader2,
  TrendingUp
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await getAnalytics();
        setData(res);
      } catch (err) {
        console.error('Error fetching analytics details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex-grow flex flex-col min-h-screen">
        <Header title="Analytics" subtitle="Candidate and database analytics overview" />
        <div className="flex-grow flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  const kpis = [
    { title: 'Total Candidates', value: data?.total_candidates ?? 0, icon: Users, bg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' },
    { title: 'Job Descriptions', value: data?.job_descriptions_count ?? 0, icon: FileText, bg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' },
    { title: 'Avg Match Score', value: data?.average_match_score ? `${data.average_match_score}` : '0', icon: Trophy, bg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' },
    { title: 'Top Score', value: data?.top_score ? `${data.top_score}` : '0', icon: Award, bg: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400' },
    { title: 'Uploaded', value: data?.uploaded_candidates ?? 0, icon: Upload, bg: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400' },
    { title: 'From Dataset', value: data?.dataset_candidates ?? 0, icon: Database, bg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' },
    { title: 'Avg Experience', value: data?.average_experience ? `${data.average_experience}y` : '0y', icon: Calendar, bg: 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400' },
    { title: 'Shortlisted', value: data?.shortlisted_candidates ?? 0, icon: Layers, bg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' },
  ];

  // Custom tooltips for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-card-border p-3 rounded-lg shadow-xl text-xs font-bold text-text-main">
          <p className="label">{`${label} : ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-grow flex flex-col min-h-screen bg-background">
      <Header title="Analytics" subtitle="Candidate and database analytics overview" />

      <div className="flex-1 p-8 space-y-8 max-w-7xl w-full mx-auto">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, idx) => (
            <div
              key={idx}
              className="bg-card border border-card-border rounded-xl p-5 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className={`p-2.5 rounded-lg ${kpi.bg}`}>
                <kpi.icon className="w-5.5 h-5.5" />
              </div>
              <div>
                <p className="text-xs text-text-muted font-bold tracking-wider uppercase">{kpi.title}</p>
                <p className="text-xl font-extrabold text-text-main mt-0.5">{kpi.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Match Score Distribution */}
          <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <h3 className="text-sm font-bold text-text-main uppercase tracking-wider mb-6">
              Match Score Distribution
            </h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.match_score_distribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="range" tick={{ fill: '#64748B', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Experience Distribution */}
          <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <h3 className="text-sm font-bold text-text-main uppercase tracking-wider mb-6">
              Experience Distribution
            </h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.experience_distribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="range" tick={{ fill: '#64748B', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Skills frequency */}
          <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <h3 className="text-sm font-bold text-text-main uppercase tracking-wider mb-6">
              Top Database Skills
            </h3>
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.top_skills} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" tick={{ fill: '#64748B', fontSize: 11 }} allowDecimals={false} />
                  <YAxis dataKey="skill" type="category" tick={{ fill: '#64748B', fontSize: 11 }} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#6366F1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Missing Skills frequency */}
          <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <h3 className="text-sm font-bold text-text-main uppercase tracking-wider mb-6">
              Missing Skills Frequency
            </h3>
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.missing_skills_frequency} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" tick={{ fill: '#64748B', fontSize: 11 }} allowDecimals={false} />
                  <YAxis dataKey="skill" type="category" tick={{ fill: '#64748B', fontSize: 11 }} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#EF4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Behavior Score Distribution */}
          <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <h3 className="text-sm font-bold text-text-main uppercase tracking-wider mb-6">
              Behavior Score Distribution
            </h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.behavior_score_distribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="range" tick={{ fill: '#64748B', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ranking Curve Area Chart */}
          <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-text-main uppercase tracking-wider">
                Candidate Ranking Curve
              </h3>
              <span className="text-xs text-primary font-bold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Ordered by Score
              </span>
            </div>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.ranking_curve} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748B', fontSize: 11 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#4F46E5"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorScore)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
export default Analytics;
