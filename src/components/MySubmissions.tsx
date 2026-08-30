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
  MessageCircle,
} from "lucide-react";
import { Submission, SubmissionStatus, UserProfile } from "../types";
import { api } from "../lib/api";
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

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-8 space-y-5">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ListChecks className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white">Track Your Submissions</h2>
          <p className="text-sm text-stone-400">
            Please log in with your Follower ID to view, manage, and edit your submitted campus gossip and tips.
          </p>
          <button
            type="button"
            onClick={onOpenAuth}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 text-white font-bold text-sm shadow-md"
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            Pending Review
          </span>
        );
      case "reviewing":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/30">
            <Eye className="w-3 h-3" />
            Under Review
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Approved
          </span>
        );
      case "posted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <Share2 className="w-3 h-3" />
            Posted to Channel
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" />
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
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider font-bold text-rose-400">
              Personal Archive
            </span>
            <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-300">
              {user.follower_id}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            My Submissions
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Manage your submissions. Note: Submissions can be edited or deleted while in <strong className="text-amber-400">Pending</strong> status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchSubmissions}
            className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <WhatsAppButton variant="compact" />
        </div>
      </div>

      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold ${
            feedbackMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}
        >
          {feedbackMessage.text}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-800 pb-3">
        {["all", "pending", "reviewing", "approved", "posted", "rejected"].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilterStatus(status)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
              filterStatus === status
                ? "bg-stone-800 text-white border border-stone-700 shadow-sm"
                : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/40"
            }`}
          >
            {status} ({status === "all" ? submissions.length : submissions.filter((s) => s.status === status).length})
          </button>
        ))}
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="py-16 text-center text-stone-500 space-y-3">
          <div className="w-8 h-8 mx-auto border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold tracking-wider uppercase">Loading your submissions...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-stone-900/60 border border-dashed border-stone-800 rounded-3xl p-10 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-stone-800 flex items-center justify-center text-stone-500">
            <ListChecks className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-stone-300">
            {filterStatus === "all" ? "No submissions found" : `No ${filterStatus} submissions`}
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Got interesting campus gossip, a confession, or an exclusive tip? Submit anonymously right now.
          </p>
          <button
            type="button"
            onClick={onNavigateSubmit}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md"
          >
            Submit Content Now
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((sub) => (
            <div
              key={sub.id}
              className="bg-stone-900 border border-stone-800 hover:border-stone-700 rounded-2xl p-5 transition-all space-y-3 shadow-lg"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-stone-400 font-bold">
                    #{sub.id.slice(0, 8)}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-stone-800 text-rose-400 border border-stone-700">
                    {sub.category_name}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-medium text-stone-400 capitalize">
                    {sub.submission_type === "audio" && <Mic className="w-3.5 h-3.5 text-sky-400" />}
                    {sub.submission_type === "image" && <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />}
                    {sub.submission_type === "video" && <VideoIcon className="w-3.5 h-3.5 text-amber-400" />}
                    {sub.submission_type === "text" && <FileText className="w-3.5 h-3.5 text-rose-400" />}
                    <span>{sub.submission_type}</span>
                  </span>
                </div>
                <div>{getStatusBadge(sub.status)}</div>
              </div>

              {/* Text Snippet */}
              {sub.text_content && (
                <p className="text-sm text-stone-200 line-clamp-3 leading-relaxed">
                  {sub.text_content}
                </p>
              )}

              {/* Media indicator */}
              {sub.media && sub.media.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-stone-400">
                  <span className="px-2 py-0.5 rounded bg-stone-950 border border-stone-800 text-[11px] font-medium">
                    {sub.media.length} media file attached
                  </span>
                </div>
              )}

              {/* Rejection notice if rejected */}
              {sub.status === "rejected" && sub.rejection_reason && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300">
                  <strong>Moderator Feedback:</strong> {sub.rejection_reason}
                </div>
              )}

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-2 text-xs text-stone-500">
                <span>Submitted: {new Date(sub.created_at).toLocaleDateString()} at {new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSubmission(sub)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                  </button>

                  {/* Edit/Delete allowed ONLY if Pending */}
                  {sub.status === "pending" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(sub)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-400 font-bold transition-colors"
                        title="Edit Submission"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteTargetId(sub.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-rose-950 text-rose-400 font-bold transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedSubmission(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-stone-800 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-stone-400">
                  ID: {selectedSubmission.id}
                </span>
                {getStatusBadge(selectedSubmission.status)}
              </div>
              <h3 className="text-xl font-black text-white">
                {selectedSubmission.category_name}
              </h3>
              <p className="text-xs text-stone-400">
                Submitted on {new Date(selectedSubmission.created_at).toLocaleString()}
              </p>
            </div>

            {/* Text details */}
            {selectedSubmission.text_content && (
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800">
                <div className="text-xs uppercase font-bold text-stone-500 mb-2">Content Details</div>
                <p className="text-sm text-stone-200 whitespace-pre-wrap leading-relaxed">
                  {selectedSubmission.text_content}
                </p>
              </div>
            )}

            {/* Media details */}
            {selectedSubmission.media && selectedSubmission.media.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs uppercase font-bold text-stone-500">Attached Media</div>
                {selectedSubmission.media.map((m, idx) => (
                  <div key={m.id || idx} className="p-4 rounded-2xl bg-stone-950 border border-stone-800">
                    {m.file_type === "image" && (
                      <img
                        src={m.file_url}
                        alt="Media attachment"
                        className="max-h-80 w-auto mx-auto rounded-lg object-contain"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    {m.file_type === "video" && (
                      <video src={m.file_url} controls className="w-full max-h-80 rounded-lg" />
                    )}
                    {m.file_type === "audio" && (
                      <audio src={m.file_url} controls className="w-full" />
                    )}
                    {m.file_type === "file" && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-stone-900 border border-stone-800">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-stone-200 truncate max-w-xs">{m.file_name || "Document Attachment"}</p>
                            <p className="text-[10px] text-stone-400 font-mono">{m.mime_type || "Document File"}</p>
                          </div>
                        </div>
                        <a
                          href={m.file_url}
                          target="_blank"
                          rel="noreferrer"
                          download={m.file_name || "document"}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm"
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
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300">
                <strong>Rejection Reason:</strong> {selectedSubmission.rejection_reason}
              </div>
            )}

            {/* Footer controls */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-800">
              <div className="text-xs text-stone-500">
                Follower Badge: <strong className="text-rose-400 font-mono">{user.follower_id}</strong>
              </div>
              <div className="flex items-center gap-2">
                {selectedSubmission.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(selectedSubmission)}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
                  >
                    Edit Content
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedSubmission(null)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-white">Edit Submission</h3>
            <p className="text-xs text-stone-400">
              You can modify text details while your submission is pending review.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-300 mb-1.5">
                Category
              </label>
              <input
                type="text"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-sm text-stone-100 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-300 mb-1.5">
                Message Content
              </label>
              <textarea
                rows={5}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full p-4 rounded-xl bg-stone-950 border border-stone-800 text-sm text-stone-100 focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isUpdating}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-black text-white">Delete Submission?</h3>
            <p className="text-xs text-stone-400">
              Are you sure you want to delete this pending submission? This action cannot be undone.
            </p>

            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-delete-submission"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md disabled:opacity-50"
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
