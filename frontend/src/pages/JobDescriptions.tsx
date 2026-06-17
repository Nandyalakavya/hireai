import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import type { JobDescription } from '../services/api';
import {
  getJobDescriptions,
  activateJd,
  deleteJd,
  uploadJd,
  updateJd
} from '../services/api';
import {
  Plus,
  Eye,
  Trash2,
  Check,
  FileText,
  Loader2,
  X,
  Clock,
  Briefcase,
  Layers,
  Pencil
} from 'lucide-react';

export const JobDescriptions: React.FC = () => {
  const [jds, setJds] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedJd, setSelectedJd] = useState<JobDescription | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [rawText, setRawText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJds = async () => {
    try {
      setLoading(true);
      const res = await getJobDescriptions();
      setJds(res);

    } catch (err) {
      console.error('Error fetching job descriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJds();
  }, []);

  const handleActivate = async (id: number) => {
    try {
      await activateJd(id);
      sessionStorage.setItem('hireai_selected_jd_id', String(id));
      fetchJds();
    } catch (err) {
      console.error('Error activating job description:', err);
    }
  };

  const handleDelete = async (id: number, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this job description?')) return;
    try {
      await deleteJd(id);
      fetchJds();
    } catch (err) {
      console.error('Error deleting job description:', err);
    }
  };

  const handleOpenAdd = () => {
    setTitle('');
    setRawText('');
    setError(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (jd: JobDescription, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditId(jd.id);
    setTitle(jd.title);
    setRawText(jd.raw_text || '');
    setError(null);
    setShowEditModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !rawText.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const newJd = await uploadJd(title, rawText);
      if (newJd && newJd.id) {
        sessionStorage.setItem('hireai_selected_jd_id', String(newJd.id));
      }
      setShowAddModal(false);
      setTitle('');
      setRawText('');
      fetchJds();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit Job Description.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId || !title.trim() || !rawText.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const updatedJd = await updateJd(editId, title, rawText);
      if (updatedJd && updatedJd.id && updatedJd.is_active) {
        sessionStorage.setItem('hireai_selected_jd_id', String(updatedJd.id));
      }
      setShowEditModal(false);
      setEditId(null);
      setTitle('');
      setRawText('');
      fetchJds();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update Job Description.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && jds.length === 0) {
    return (
      <div className="flex-grow flex flex-col min-h-screen">
        <Header title="Job Descriptions" subtitle="Manage and analyze job descriptions" />
        <div className="flex-grow flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col min-h-screen">
      <Header title="Job Descriptions" subtitle="Manage and analyze job descriptions" />

      <div className="flex-1 p-8 space-y-6 bg-background max-w-5xl w-full mx-auto">
        {/* Top bar with Add Button */}
        <div className="flex justify-end items-center">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add JD
          </button>
        </div>

        {/* JDs List */}
        {jds.length === 0 ? (
          <div className="text-center py-20 bg-card border border-card-border rounded-xl shadow-sm">
            <FileText className="w-16 h-16 stroke-1 mx-auto text-text-muted mb-3" />
            <h3 className="text-lg font-bold text-text-main">No Job Descriptions Yet</h3>
            <p className="text-sm text-text-muted max-w-sm mx-auto mt-1">
              Add a new job description to begin comparing candidates and compiling semantic match rankings.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover transition-colors"
            >
              Add Your First JD
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {jds.map((jd) => (
              <div
                key={jd.id}
                onClick={() => {
                  setSelectedJd(jd);
                  setShowViewModal(true);
                }}
                className={`group p-6 rounded-xl border transition-all duration-200 bg-card cursor-pointer shadow-sm ${
                  jd.is_active
                    ? 'border-primary shadow-md'
                    : 'border-card-border hover:border-text-muted/40 hover:shadow'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-bold text-text-main group-hover:text-primary transition-colors">
                        {jd.title}
                      </h3>
                      {jd.is_active && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary text-white">
                          active
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-text-muted">
                      {jd.industry || 'General Industry'} &bull; {jd.min_experience}-{jd.max_experience} years &bull; pasted
                    </p>

                    {/* Skill tags */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {jd.required_skills.slice(0, 6).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 rounded bg-background border border-card-border text-xs text-text-main font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                      {jd.required_skills.length > 6 && (
                        <span className="px-2 py-0.5 rounded bg-background border border-card-border text-xs text-text-muted font-bold">
                          +{jd.required_skills.length - 6}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 md:self-center self-end">
                    {!jd.is_active && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActivate(jd.id);
                        }}
                        className="px-3 py-1.5 border border-card-border rounded-lg text-xs font-semibold text-text-muted hover:border-primary hover:text-primary transition-all bg-card"
                      >
                        Set Active
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedJd(jd);
                        setShowViewModal(true);
                      }}
                      className="p-2 border border-card-border rounded-lg text-text-muted hover:text-text-main hover:bg-background transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleOpenEdit(jd, e)}
                      className="p-2 border border-card-border rounded-lg text-text-muted hover:text-text-main hover:bg-background transition-colors"
                      title="Edit Job Description"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(jd.id, e)}
                      className="p-2 border border-card-border rounded-lg text-danger hover:bg-danger/10 hover:border-danger/30 transition-colors"
                      title="Delete"
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

      {/* Add Job Description Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-card border border-card-border rounded-xl w-full max-w-xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-main transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-text-main mb-4">Add Job Description</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-main uppercase mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste details, requirements, responsibilities, and experience guidelines here..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-card-border bg-background text-text-main placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              {error && (
                <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-xs font-medium">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-lg border border-card-border bg-card hover:bg-background text-text-main transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary hover:bg-primary-hover text-white flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Submit JD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View JD Details Modal */}
      {showViewModal && selectedJd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-card border border-card-border rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col p-6 shadow-2xl relative">
            <button
              onClick={() => setShowViewModal(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-main transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header info */}
            <div className="border-b border-card-border pb-4 mb-4 pr-8">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-xl font-bold text-text-main">{selectedJd.title}</h3>
                {selectedJd.is_active && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary text-white">
                    active
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted mt-1.5">
                {selectedJd.industry || 'General Industry'} &bull; {selectedJd.min_experience}-{selectedJd.max_experience} years experience &bull; pasted
              </p>
            </div>

            {/* Content Body - Scrollable */}
            <div className="flex-grow overflow-y-auto space-y-6 pr-2">
              {/* Core Skill Tags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-card-border bg-background/50 space-y-2">
                  <h4 className="text-xs font-bold text-text-main uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-primary" /> Required Skills
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedJd.required_skills.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-card border border-card-border text-xs text-text-main">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-card-border bg-background/50 space-y-2">
                  <h4 className="text-xs font-bold text-text-main uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-primary" /> Preferred Skills
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedJd.preferred_skills.length > 0 ? (
                      selectedJd.preferred_skills.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-card border border-card-border text-xs text-text-main">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-text-muted italic">None extracted</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Responsibilities list */}
              {selectedJd.responsibilities && selectedJd.responsibilities.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-text-main uppercase tracking-wider">
                    Responsibilities
                  </h4>
                  <ul className="list-disc list-inside text-sm text-text-muted space-y-1">
                    {selectedJd.responsibilities.map((resp, idx) => (
                      <li key={idx}>{resp}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Raw Job description text */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-text-main uppercase tracking-wider">
                  Raw Description Text
                </h4>
                <div className="p-4 rounded-xl border border-card-border bg-background text-sm text-text-muted whitespace-pre-wrap leading-relaxed">
                  {selectedJd.raw_text}
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="border-t border-card-border pt-4 mt-4 flex justify-between items-center">
              <span className="text-xs text-text-muted flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Added: {selectedJd.created_at ? new Date(selectedJd.created_at).toLocaleDateString() : 'N/A'}
              </span>
              <div className="flex gap-2">
                {!selectedJd.is_active && (
                  <button
                    onClick={() => {
                      handleActivate(selectedJd.id);
                      setShowViewModal(false);
                    }}
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" /> Activate This JD
                  </button>
                )}
                <button
                  onClick={(e) => {
                    setShowViewModal(false);
                    handleOpenEdit(selectedJd, e);
                  }}
                  className="px-4 py-2 border border-card-border bg-card hover:bg-background text-xs font-semibold text-text-main rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 border border-card-border bg-card hover:bg-background text-xs font-semibold text-text-main rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Job Description Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-card border border-card-border rounded-xl w-full max-w-xl p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setShowEditModal(false);
                setEditId(null);
              }}
              className="absolute top-4 right-4 text-text-muted hover:text-text-main transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-text-main mb-4">Edit Job Description</h3>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-main uppercase mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste details, requirements, responsibilities, and experience guidelines here..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-card-border bg-background text-text-main placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              {error && (
                <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-xs font-medium">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditId(null);
                  }}
                  className="px-4 py-2 text-sm font-semibold rounded-lg border border-card-border bg-card hover:bg-background text-text-main transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary hover:bg-primary-hover text-white flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default JobDescriptions;
