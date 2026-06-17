import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import type { Candidate } from '../services/api';
import {
  getCandidates,
  deleteCandidate,
  uploadResume
} from '../services/api';
import {
  Search,
  Upload,
  Eye,
  Trash2,
  Database,
  Loader2,
  X,
  CheckCircle2,
  Users
} from 'lucide-react';

export const Candidates: React.FC = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');

  // Resume upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Toast notification
  const [showToast, setShowToast] = useState(false);

  const fetchCandidates = async (search = searchQuery, source = sourceFilter) => {
    try {
      setLoading(true);
      const res = await getCandidates(search, source);
      setCandidates(res);

      // Show "Ranked X candidates!" toast briefly on fetch if there are candidates
      if (res.length > 0) {
        setShowToast(true);
        const timer = setTimeout(() => setShowToast(false), 4000);
        return () => clearTimeout(timer);
      }
    } catch (err) {
      console.error('Error fetching candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates(searchQuery, sourceFilter);
  }, [sourceFilter]);

  // Handle Search submit/trigger
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    // Fetch immediately on input changes
    fetchCandidates(val, sourceFilter);
  };

  const handleDelete = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete candidate ${id}?`)) return;
    try {
      await deleteCandidate(id);
      fetchCandidates(searchQuery, sourceFilter);
    } catch (err) {
      console.error('Error deleting candidate:', err);
    }
  };

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
        setShowUploadModal(false);
        setUploadSuccess(false);
      }, 1500);
      fetchCandidates(searchQuery, sourceFilter);
    } catch (err: any) {
      setUploadError(err.response?.data?.detail || 'Failed to upload resume.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col min-h-screen relative">
      <Header title="Candidates" subtitle={`${candidates.length} candidates in database`} />

      <div className="flex-1 p-8 space-y-6 bg-background max-w-5xl w-full mx-auto">
        {/* Top actions */}
        <div className="flex justify-end items-center gap-3">
          <button
            onClick={() => alert('Demo Import: Dataset is already pre-seeded in database.')}
            className="px-4 py-2 border border-card-border hover:bg-background/80 text-text-main rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-sm bg-card"
          >
            <Database className="w-4 h-4 text-text-muted" /> Import Dataset
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" /> Upload Resumes
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by name, skill, title, industry..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-card-border bg-card text-text-main placeholder-text-muted text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-sm"
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-card-border bg-card text-text-main text-sm focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
            >
              <option value="all">All Sources</option>
              <option value="dataset">From Dataset</option>
              <option value="uploaded">Uploaded Resume</option>
            </select>
          </div>
        </div>

        {/* Candidates List */}
        {loading && candidates.length === 0 ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-20 bg-card border border-card-border rounded-xl shadow-sm">
            <Users className="w-16 h-16 stroke-1 mx-auto text-text-muted mb-3" />
            <h3 className="text-lg font-bold text-text-main">No Candidates Found</h3>
            <p className="text-sm text-text-muted max-w-sm mx-auto mt-1">
              No profiles match your search criteria. Try adjusting your search query, source filters, or upload more resumes.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {candidates.map((cand) => (
              <div
                key={cand.id}
                onClick={() => navigate(`/candidate/${cand.id}`)}
                className="group p-6 rounded-xl border border-card-border bg-card hover:border-text-muted/40 hover:shadow transition-all duration-200 cursor-pointer shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-text-main group-hover:text-primary transition-colors">
                        {cand.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded bg-background border border-card-border text-[10px] text-text-muted font-bold tracking-wider uppercase">
                        {cand.source}
                      </span>
                    </div>

                    <p className="text-xs text-text-muted font-medium">
                      {cand.career_history[0]?.title || 'Software Engineer'} &bull; {cand.experience}y exp &bull; {cand.education[0]?.field || 'Engineering'}
                    </p>

                    {/* Skill Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {cand.skills.slice(0, 6).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 rounded bg-background border border-card-border text-xs text-text-main font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                      {cand.skills.length > 6 && (
                        <span className="px-2 py-0.5 rounded bg-background border border-card-border text-xs text-text-muted font-bold">
                          +{cand.skills.length - 6}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 md:self-center self-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/candidate/${cand.id}`);
                      }}
                      className="p-2 border border-card-border rounded-lg text-text-muted hover:text-text-main hover:bg-background transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(cand.id, e)}
                      className="p-2 border border-card-border rounded-lg text-danger hover:bg-danger/10 hover:border-danger/30 transition-colors"
                      title="Delete Candidate"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Slide-in / Toast notification bottom-right */}
      {showToast && candidates.length > 0 && (
        <div className="fixed bottom-6 right-6 p-4 rounded-lg bg-card border border-card-border shadow-2xl flex items-center gap-2 animate-fadeIn z-50 text-sm font-bold text-text-main">
          <CheckCircle2 className="w-5 h-5 text-success" />
          Ranked {candidates.length} candidates!
        </div>
      )}

      {/* Resume Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-card border border-card-border rounded-xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-main transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-text-main mb-4">Upload Candidate Resumes</h3>

            {uploadSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-success mb-2" />
                <p className="text-sm font-semibold text-text-main">Resume Uploaded Successfully!</p>
                <p className="text-xs text-text-muted mt-1">Extracting profile details...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-text-muted">
                  Drag and drop or select PDF, DOCX, or TXT resume files. Candidate information is parsed using AI and scored automatically against the active job description.
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
                      <span className="text-xs font-semibold text-text-main">Parsing resume profile...</span>
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
    </div>
  );
};
export default Candidates;
