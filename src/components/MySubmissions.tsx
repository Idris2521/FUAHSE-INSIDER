import React, { useState, useEffect } from "react";
import {
  ListChecks,
  Clock,
  CheckCircle2,
  XCircle,
  Share2,
  Eye,
  Edit3,
  Trash2,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Mic,
  AlertTriangle,
  RefreshCw,
  X,
  ExternalLink,
  MessageSquare,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Submission, SubmissionStatus, UserProfile } from "../types";
import { api, getUserToken } from "../lib/api";
import { WhatsAppButton } from "./WhatsAppButton";

interface MySubmissionsProps {
  user: UserProfile | null;
  onOpenAuth: () => void;
  onNavigateSubmit: () => void;
}

export const MySubmissions: React.FC<MySubmissionsProps> = ({
  user,
  onOpenAuth,
  onNavigateSubmit,
}) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Confirmation State
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchSubmissions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.getMySubmissions();
      setSubmissions(res.submissions || []);
    } catch (err: any) {
      console.error("Error fetching submissions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSubmissions();
    }
  }, [user]);

  // Realtime updates via Server-Sent Events (SSE)
  useEffect(() => {
    if (!user) return;
    const token = getUserToken();
    if (!token) return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/realtime?token=${encodeURIComponent(token)}`);

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "SUBMISSION_UPDATED" && payload.data) {
            setSubmissions((prev) =>
              prev.map((s) => (s.id === payload.data.id ? { ...s, ...payload.data } : s))
            );
            if (selectedSubmission?.id === payload.data.id) {
              setSelectedSubmission((prev) => (prev ? { ...prev, ...payload.data } : null));
            }
          } else if (payload.type === "SUBMISSION_DELETED" && payload.data) {
            setSubmissions((prev) => prev.filter((s) => s.id !== payload.data.id));
          } else if (payload.type === "NEW_SUBMISSION" && payload.data && payload.data.user_id === user.id) {
            setSubmissions((prev) => [payload.data, ...prev.filter((s) => s.id !== payload.data.id)]);
          }
        } catch (err) {
          console.error("Error handling SSE message in MySubmissions:", err);
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
      };
    } catch (err) {
      console.warn("SSE connection error:", err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [user, selectedSubmission]);

  if (!user) {
    return (
      <div id="submissions-login-prompt" className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-100 space-y-5">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <ListChecks className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Track Your Submissions</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Please register or log in with your Follower ID to view your confidential submission history, track editorial status, and edit pending messages.
          </p>
          <button
            type="button"
            id="btn-login-to-view-submissions"
            onClick={onOpenAuth}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-sm shadow-md shadow-rose-600/20 transition-all cursor-pointer"
          >
            Register / Log In
          </button>
        </div>
      </div>
    );
  }

  const filtered = submissions.filter((s) => {
    if (filterStatus === "all") return true;
    return s.status === filterStatus;
  });

  const getStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending Review
          </span>
        );
      case "reviewing":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">
            <Eye className="w-3 h-3 text-sky-600" />
            Under Review
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Approved
          </span>
        );
      case "posted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
            <Share2 className="w-3 h-3 text-purple-600" />
            Posted to Channel
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            Rejected
          </span>
        );
    }
  };

  const handleOpenEdit = (sub: Submission) => {
    setSelectedSubmission(sub);
    setEditText(sub.text_content || "");
    setEditCategory(sub.category_name || "");
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedSubmission) return;
    setIsUpdating(true);
    setFeedbackMessage(null);

    try {
      const res = await api.updateMySubmission(selectedSubmission.id, {
        text_content: editText,
        category_name: editCategory,
      });

      setSubmissions((prev) =>
        prev.map((s) => (s.id === selectedSubmission.id ? { ...s, ...res.submission } : s))
      );
      setIsEditing(false);
      setSelectedSubmission(null);
      setFeedbackMessage({ type: "success", text: "Submission updated successfully" });
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err: any) {
      setFeedbackMessage({ type: "error", text: err.message || "Failed to update submission" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    setFeedbackMessage(null);

    try {
      await api.deleteMySubmission(deleteTargetId);
      setSubmissions((prev) => prev.filter((s) => s.id !== deleteTargetId));
      setDeleteTargetId(null);
      if (selectedSubmission?.id === deleteTargetId) {
        setSelectedSubmission(null);
      }
      setFeedbackMessage({ type: "success", text: "Submission deleted successfully" });
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err: any) {
      setFeedbackMessage({ type: "error", text: err.message || "Failed to delete submission" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div id="my-submissions-view" className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs uppercase tracking-wider font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
              Personal Archive
            </span>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              {user.follower_id}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            My Submissions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time feed of your tips and gossip. Submissions can be edited or deleted while in <strong className="text-amber-600 font-semibold">Pending</strong> status.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            id="btn-refresh-my-submissions"
            onClick={fetchSubmissions}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
            title="Refresh submissions"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-rose-600" : ""}`} />
          </button>
          <WhatsAppButton variant="compact" />
        </div>
      </div>

      {feedbackMessage && (
        <div
          id="my-submissions-feedback-alert"
          className={`p-3.5 rounded-xl border text-xs font-bold ${
            feedbackMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-rose-50 border-rose-200 text-rose-700"
          }`}
        >
          {feedbackMessage.text}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {["all", "pending", "reviewing", "approved", "posted", "rejected"].map((status) => (
          <button
            key={status}
            type="button"
            id={`filter-tab-${status}`}
            onClick={() => setFilterStatus(status)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
              filterStatus === status
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            {status} ({status === "all" ? submissions.length : submissions.filter((s) => s.status === status).length})
          </button>
        ))}
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 mx-auto border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold tracking-wider uppercase text-slate-500">Loading your submissions...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-10 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <ListChecks className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            {filterStatus === "all" ? "No submissions found" : `No ${filterStatus} submissions`}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            Got an exclusive campus story, voice note, or verified photo? Submit anonymously now.
          </p>
          <button
            type="button"
            id="btn-navigate-submit-from-empty"
            onClick={onNavigateSubmit}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer"
          >
            Submit Content Now
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filtered.map((sub) => (
            <div
              key={sub.id}
              id={`submission-card-${sub.id}`}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 sm:p-6 transition-all space-y-3 shadow-sm hover:shadow"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                    #{sub.id.slice(0, 8)}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                    {sub.category_name}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 capitalize">
                    {sub.submission_type === "audio" && <Mic className="w-3.5 h-3.5 text-sky-600" />}
                    {sub.submission_type === "image" && <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />}
                    {sub.submission_type === "video" && <VideoIcon className="w-3.5 h-3.5 text-amber-600" />}
                    {sub.submission_type === "text" && <FileText className="w-3.5 h-3.5 text-rose-600" />}
                    <span>{sub.submission_type}</span>
                  </span>
                </div>
                <div>{getStatusBadge(sub.status)}</div>
              </div>

              {/* Text Snippet */}
              {sub.text_content && (
                <p className="text-sm text-slate-800 line-clamp-3 leading-relaxed">
                  {sub.text_content}
                </p>
              )}

              {/* Media indicator */}
              {sub.media && sub.media.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-600">
                    {sub.media.length} media file{sub.media.length > 1 ? "s" : ""} attached
                  </span>
                </div>
              )}

              {/* Rejection notice if rejected */}
              {sub.status === "rejected" && sub.rejection_reason && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                  <strong className="font-bold">Moderator Feedback:</strong> {sub.rejection_reason}
                </div>
              )}

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
                <span>Submitted {new Date(sub.created_at).toLocaleDateString()} at {new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id={`btn-view-sub-${sub.id}`}
                    onClick={() => setSelectedSubmission(sub)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                  </button>

                  {/* Edit/Delete allowed ONLY if Pending */}
                  {sub.status === "pending" && (
                    <>
                      <button
                        type="button"
                        id={`btn-edit-sub-${sub.id}`}
                        onClick={() => handleOpenEdit(sub)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold transition-colors cursor-pointer"
                        title="Edit Submission"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>

                      <button
                        type="button"
                        id={`btn-delete-sub-${sub.id}`}
                        onClick={() => setDeleteTargetId(sub.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold transition-colors cursor-pointer"
                        title="Delete Submission"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUBMISSION DETAIL MODAL */}
      {/* ------------------------------------------------------------- */}
      {selectedSubmission && !isEditing && (
        <div id="modal-submission-detail" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              id="btn-close-sub-detail"
              onClick={() => setSelectedSubmission(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  ID: {selectedSubmission.id}
                </span>
                {getStatusBadge(selectedSubmission.status)}
              </div>
              <h3 className="text-xl font-black text-slate-900">
                {selectedSubmission.category_name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Submitted on {new Date(selectedSubmission.created_at).toLocaleString()}
              </p>
            </div>

            {/* Text details */}
            {selectedSubmission.text_content && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-xs uppercase font-bold text-slate-500 mb-2">Message Content</div>
                <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {selectedSubmission.text_content}
                </p>
              </div>
            )}

            {/* Media details */}
            {selectedSubmission.media && selectedSubmission.media.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs uppercase font-bold text-slate-500">Attached Media</div>
                {selectedSubmission.media.map((m, idx) => (
                  <div key={m.id || idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    {m.file_type === "image" && (
                      <img
                        src={m.file_url}
                        alt="Media attachment"
                        className="max-h-80 w-auto mx-auto rounded-lg object-contain border border-slate-200 bg-white"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    {m.file_type === "video" && (
                      <video src={m.file_url} controls className="w-full max-h-80 rounded-lg bg-black" />
                    )}
                    {m.file_type === "audio" && (
                      <audio src={m.file_url} controls className="w-full" />
                    )}
                    {m.file_type === "file" && (
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 truncate max-w-xs">{m.file_name || "Document Attachment"}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{m.mime_type || "Document File"}</p>
                          </div>
                        </div>
                        <a
                          href={m.file_url}
                          target="_blank"
                          rel="noreferrer"
                          download={m.file_name || "document"}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open File</span>
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Rejection Notice */}
            {selectedSubmission.status === "rejected" && selectedSubmission.rejection_reason && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                <strong className="font-bold">Editorial Note:</strong> {selectedSubmission.rejection_reason}
              </div>
            )}

            {/* Footer controls */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                Follower Badge: <strong className="text-rose-600 font-mono">{user.follower_id}</strong>
              </div>
              <div className="flex items-center gap-2">
                {selectedSubmission.status === "pending" && (
                  <button
                    type="button"
                    id="btn-modal-edit-sub"
                    onClick={() => handleOpenEdit(selectedSubmission)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs cursor-pointer shadow-sm"
                  >
                    Edit Content
                  </button>
                )}
                <button
                  type="button"
                  id="btn-modal-close-sub"
                  onClick={() => setSelectedSubmission(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* EDIT MODAL (PENDING SUBMISSIONS ONLY) */}
      {/* ------------------------------------------------------------- */}
      {isEditing && selectedSubmission && (
        <div id="modal-edit-submission" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <button
              type="button"
              id="btn-close-edit-modal"
              onClick={() => setIsEditing(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-slate-900">Edit Submission</h3>
            <p className="text-xs text-slate-500">
              You can modify text details while your submission is pending editorial review.
            </p>

            <div>
              <label htmlFor="input-edit-category" className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                Category
              </label>
              <input
                id="input-edit-category"
                type="text"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white"
              />
            </div>

            <div>
              <label htmlFor="input-edit-text-content" className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                Message Content
              </label>
              <textarea
                id="input-edit-text-content"
                rows={5}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                id="btn-cancel-edit-sub"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-save-edit-sub"
                onClick={handleSaveEdit}
                disabled={isUpdating}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold disabled:opacity-50 cursor-pointer shadow-md shadow-rose-600/20"
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ------------------------------------------------------------- */}
      {deleteTargetId && (
        <div id="modal-delete-confirm" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-black text-slate-900">Delete Submission?</h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Are you sure you want to delete this pending submission? This action cannot be undone.
            </p>

            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                type="button"
                id="btn-cancel-delete-modal"
                onClick={() => setDeleteTargetId(null)}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-delete-submission"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

