import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Mic,
  FileCode2,
  Paperclip,
  Square,
  Play,
  Pause,
  RotateCcw,
  Upload,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  SendHorizontal,
  File as FileIcon,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Category, SubmissionType, UserProfile } from "../types";
import { api } from "../lib/api";
import { WhatsAppButton } from "./WhatsAppButton";
import { FuahseLogo } from "./FuahseLogo";

interface SubmitContentProps {
  user: UserProfile | null;
  onOpenAuth: (mode?: "login" | "register") => void;
  onSubmissionComplete?: () => void;
  onNavigateMySubmissions?: () => void;
  onNavigateHome?: () => void;
}

export const SubmitContent: React.FC<SubmitContentProps> = ({
  user,
  onOpenAuth,
  onSubmissionComplete,
  onNavigateMySubmissions,
  onNavigateHome,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [submissionType, setSubmissionType] = useState<SubmissionType>("text");
  const [textContent, setTextContent] = useState("");

  // Media state
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaDataUrl, setMediaDataUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | "audio" | "file">("image");

  // Audio recording state (Real MediaRecorder API)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Workflow state
  const [step, setStep] = useState<"compose" | "preview" | "success">("compose");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSubmissionId, setLastSubmissionId] = useState<string | null>(null);

  // Fetch categories
  useEffect(() => {
    api.getCategories().then((res) => {
      const active = res.categories.filter((c) => c.is_active);
      setCategories(active);
      if (active.length > 0 && !selectedCategory) {
        setSelectedCategory(active[0].name);
      }
    }).catch((err) => {
      console.error("Error fetching categories:", err);
    });
  }, []);

  // Cleanup audio preview URL on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // Handle Voice Recording via browser MediaRecorder
  const startRecording = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const recordedAudioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(recordedAudioBlob);
        const url = URL.createObjectURL(recordedAudioBlob);
        setAudioUrl(url);

        // Convert to base64 data url for upload preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setMediaDataUrl(reader.result as string);
          setMediaType("audio");
        };
        reader.readAsDataURL(recordedAudioBlob);

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(200);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      setMicError(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Microphone access was denied. Please allow microphone permissions in your browser or upload an audio file directly."
          : "Could not access microphone on this device."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  const resetRecording = () => {
    if (isRecording) stopRecording();
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setMediaDataUrl(null);
    setRecordingDuration(0);
    setIsPlayingAudio(false);
  };

  const togglePlayAudio = () => {
    if (!audioPlayerRef.current) return;
    if (isPlayingAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  // Handle File Input Selection (Image / Video / Audio / File)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Size check
    const maxMb = submissionType === "video" ? 50 : submissionType === "audio" ? 25 : submissionType === "file" ? 20 : 10;
    if (file.size > maxMb * 1024 * 1024) {
      setErrorMessage(`File exceeds maximum size of ${maxMb}MB`);
      return;
    }

    setErrorMessage(null);
    setMediaFile(file);
    const mType: "image" | "video" | "audio" | "file" = file.type.startsWith("video")
      ? "video"
      : file.type.startsWith("audio")
      ? "audio"
      : file.type.startsWith("image")
      ? "image"
      : "file";
    setMediaType(mType);

    const reader = new FileReader();
    reader.onload = () => {
      setMediaDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const formatSeconds = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleProceedToPreview = () => {
    setErrorMessage(null);

    if (!user) {
      setErrorMessage("Please create your anonymous Follower ID or log in to preview & submit your story.");
      onOpenAuth("register");
      return;
    }

    const effectiveCategory = selectedCategory || (categories.length > 0 ? categories[0].name : "General");
    if (!selectedCategory && effectiveCategory) {
      setSelectedCategory(effectiveCategory);
    }

    if (submissionType === "text" && !textContent.trim()) {
      setErrorMessage("Please write some text content for your submission");
      return;
    }

    if (["image", "video", "audio", "file"].includes(submissionType) && !mediaDataUrl && !textContent.trim()) {
      setErrorMessage(`Please provide a ${submissionType} file or write a message`);
      return;
    }

    setStep("preview");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleFinalSubmit = async () => {
    if (!user) {
      onOpenAuth("register");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(25);
    setErrorMessage(null);

    try {
      let uploadedMediaItems: any[] = [];

      // 1. Upload media if present
      if (mediaDataUrl) {
        setUploadProgress(50);
        const defaultName =
          mediaType === "audio"
            ? "voice-note.webm"
            : mediaType === "video"
            ? "video-clip.mp4"
            : mediaType === "file"
            ? "document.pdf"
            : "photo.jpg";

        const resMedia = await api.uploadMedia({
          file_data: mediaDataUrl,
          file_name: mediaFile?.name || defaultName,
          file_type: mediaType,
          mime_type: mediaFile?.type || (mediaType === "audio" ? "audio/webm" : undefined),
        });

        uploadedMediaItems.push({
          file_url: resMedia.file_url,
          storage_path: resMedia.storage_path,
          file_type: resMedia.file_type,
          mime_type: resMedia.mime_type,
          file_size: mediaFile?.size || audioBlob?.size,
        });
      }

      setUploadProgress(80);

      // 2. Create submission record
      const catObj = categories.find((c) => c.name === selectedCategory);
      const res = await api.submitContent({
        category_id: catObj?.id,
        category_name: selectedCategory || "General",
        submission_type: submissionType,
        text_content: textContent,
        media_items: uploadedMediaItems,
      });

      setUploadProgress(100);
      setLastSubmissionId(res.submission.id);
      setStep("success");
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.5 },
          colors: ["#2563eb", "#0284c7", "#10b981", "#3b82f6"],
        });
      } catch (_) {}
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit content. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setTextContent("");
    setMediaFile(null);
    setMediaDataUrl(null);
    resetRecording();
    setStep("compose");
    setErrorMessage(null);
    setLastSubmissionId(null);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* ------------------------------------------------------------- */}
      {/* STEP 3: SUBMISSION SUCCESS SCREEN */}
      {/* ------------------------------------------------------------- */}
      {step === "success" && (
        <div className="bg-white border border-blue-100 rounded-3xl p-6 sm:p-10 text-center space-y-6 shadow-sm animate-fadeIn">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Submission Received & Queued
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-blue-950">
              Story Dispatched to The Mirror!
            </h2>
            <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto font-medium">
              Your submission has been securely stored. Our admin moderators will review, accept or reject, and publish approved gossip to the WhatsApp Channel.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left max-w-md mx-auto space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Submitted As:</span>
              <span className="font-mono font-bold text-blue-700">{user?.follower_id}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Category:</span>
              <span className="font-semibold text-slate-900">{selectedCategory}</span>
            </div>
            {lastSubmissionId && (
              <div className="flex justify-between items-center text-slate-600">
                <span>Submission Reference:</span>
                <span className="font-mono font-bold text-slate-800">#{lastSubmissionId.slice(0, 8)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-slate-600">
              <span>Review Status:</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-200 uppercase">
                Pending Admin Review
              </span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            {onNavigateHome && (
              <button
                type="button"
                id="btn-return-home-success"
                onClick={onNavigateHome}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors shadow-md shadow-blue-600/20"
              >
                Return to Home
              </button>
            )}
            <button
              type="button"
              id="btn-view-my-submissions-success"
              onClick={onNavigateMySubmissions || onSubmissionComplete}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-blue-50 text-blue-950 font-bold text-sm border border-slate-200 hover:border-blue-300 transition-colors shadow-xs"
            >
              Track My Submissions
            </button>
            <WhatsAppButton variant="primary" className="w-full sm:w-auto" />
            <button
              type="button"
              onClick={handleResetForm}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm border border-slate-200 transition-colors"
            >
              Submit Another
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 2: LIVE PREVIEW BEFORE SUBMIT */}
      {/* ------------------------------------------------------------- */}
      {step === "preview" && (
        <div className="bg-white border border-blue-100 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-blue-600">
                Step 2 of 2
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-blue-950 flex items-center gap-2">
                <Eye className="w-6 h-6 text-blue-600" />
                Review Your Submission
              </h2>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-mono font-bold text-blue-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{user?.follower_id}</span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Category & Type badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">
                Category: {selectedCategory}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                Format: {submissionType === "audio" ? "Voice Note / Audio" : submissionType === "file" ? "Document / File" : submissionType}
              </span>
            </div>

            {/* Text Preview */}
            {textContent && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">
                  Message / Text Content
                </div>
                <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                  {textContent}
                </p>
              </div>
            )}

            {/* Media Preview */}
            {mediaDataUrl && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-bold text-slate-500">
                    Attached Media / File
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMediaDataUrl(null);
                      setMediaFile(null);
                      resetRecording();
                    }}
                    className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>

                {mediaType === "image" && (
                  <div className="rounded-xl overflow-hidden max-h-96 bg-slate-100 flex items-center justify-center p-2 border border-slate-200">
                    <img
                      src={mediaDataUrl}
                      alt="Submission preview"
                      className="max-h-96 w-auto object-contain rounded-lg shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                {mediaType === "video" && (
                  <div className="rounded-xl overflow-hidden max-h-96 bg-black">
                    <video
                      src={mediaDataUrl}
                      controls
                      className="w-full max-h-96 rounded-lg"
                    />
                  </div>
                )}

                {mediaType === "audio" && (
                  <div className="p-4 rounded-xl bg-white border border-blue-200 flex items-center gap-3 shadow-xs">
                    <Mic className="w-5 h-5 text-blue-600 shrink-0" />
                    <audio src={mediaDataUrl} controls className="w-full" />
                  </div>
                )}

                {mediaType === "file" && (
                  <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center gap-3 shadow-xs">
                    <FileIcon className="w-6 h-6 text-blue-600 shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800 truncate">{mediaFile?.name || "Attached Document"}</p>
                      <p className="text-[10px] text-slate-500">{mediaFile?.size ? `${(mediaFile.size / (1024 * 1024)).toFixed(2)} MB` : "File attached"}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Privacy Note */}
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              <strong>Anonymous Guarantee:</strong> Content moderators will only see your Follower ID (<strong>{user?.follower_id}</strong>). Your real identity (name, WhatsApp number, state, age) is isolated on the backend and never exposed during review.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setStep("compose");
                if (typeof window !== "undefined") {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm border border-slate-200 transition-colors"
            >
              Back to Edit
            </button>

            <button
              type="button"
              id="btn-confirm-submission"
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm tracking-wide shadow-md shadow-blue-600/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Submitting ({uploadProgress}%)...</span>
                </>
              ) : (
                <>
                  <span>Confirm & Send to Mirror</span>
                  <SendHorizontal className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 1: COMPOSE SUBMISSION */}
      {/* ------------------------------------------------------------- */}
      {step === "compose" && (
        <div className="bg-white border border-blue-100 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          {/* Header */}
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs uppercase tracking-wider font-bold text-blue-600">
                Anonymous Campus Submission
              </span>
              {user ? (
                <span className="text-xs font-mono font-bold text-slate-500">
                  Posting as: <strong className="text-blue-700">{user.follower_id}</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenAuth("register")}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Register to get Follower ID
                </button>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-blue-950">
              Submit to The Campus Mirror
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Share your story, gossip, tip, voice note, or media with FUAHSE Insider.
            </p>
          </div>

          {/* Anonymous Safety Notice */}
          <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 flex items-center justify-between text-xs text-blue-950">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% Anonymous Follower Protection Active</span>
            </div>
            <WhatsAppButton variant="compact" />
          </div>

          {/* Form */}
          <div className="space-y-5">
            {/* 1. Category Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                1. Select Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`p-2.5 rounded-xl text-xs font-bold text-left transition-all border ${
                      selectedCategory === cat.name
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Format / Type Tabs */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                2. Submission Format <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <button
                  type="button"
                  onClick={() => setSubmissionType("text")}
                  className={`flex items-center justify-center gap-1.5 p-3 rounded-xl text-xs font-bold transition-all border ${
                    submissionType === "text"
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
                  }`}
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>Text / Story</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSubmissionType("image")}
                  className={`flex items-center justify-center gap-1.5 p-3 rounded-xl text-xs font-bold transition-all border ${
                    submissionType === "image"
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
                  }`}
                >
                  <ImageIcon className="w-4 h-4 shrink-0" />
                  <span>Photo / Image</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSubmissionType("video")}
                  className={`flex items-center justify-center gap-1.5 p-3 rounded-xl text-xs font-bold transition-all border ${
                    submissionType === "video"
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
                  }`}
                >
                  <VideoIcon className="w-4 h-4 shrink-0" />
                  <span>Video Clip</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSubmissionType("audio")}
                  className={`flex items-center justify-center gap-1.5 p-3 rounded-xl text-xs font-bold transition-all border ${
                    submissionType === "audio"
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
                  }`}
                >
                  <Mic className="w-4 h-4 shrink-0" />
                  <span>Voice Note / Audio</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSubmissionType("file")}
                  className={`flex items-center justify-center gap-1.5 p-3 rounded-xl text-xs font-bold transition-all border col-span-2 sm:col-span-1 ${
                    submissionType === "file"
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
                  }`}
                >
                  <Paperclip className="w-4 h-4 shrink-0" />
                  <span>File / Doc</span>
                </button>
              </div>
            </div>

            {/* 3. Text Message Area */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {submissionType === "text" ? "Gossip / Story Details" : "Caption / Description (Optional)"}
                  {submissionType === "text" && <span className="text-red-500"> *</span>}
                </label>
                <span className="text-[11px] font-mono text-slate-500">
                  {textContent.length} characters
                </span>
              </div>
              <textarea
                rows={submissionType === "text" ? 6 : 3}
                placeholder={
                  submissionType === "text"
                    ? "Type the juicy gossip, confession, or news here in full detail..."
                    : "Add any context, background story, or caption for this media..."
                }
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-colors resize-none leading-relaxed"
              />
            </div>

            {/* 4. Media Upload Controls */}
            {submissionType !== "text" && (
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Attach {submissionType === "image" ? "Image" : submissionType === "video" ? "Video" : submissionType === "file" ? "Document / File" : "Voice Note"} File
                </label>

                {/* AUDIO RECORDING WORKFLOW */}
                {submissionType === "audio" && (
                  <div className="p-5 rounded-2xl bg-slate-50 border border-blue-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                        Live Voice Note Recorder (Microphone)
                      </span>
                      {recordingDuration > 0 && (
                        <span className="text-xs font-mono font-bold text-red-600 animate-pulse">
                          ● {formatSeconds(recordingDuration)}
                        </span>
                      )}
                    </div>

                    {/* Recorder controls */}
                    <div className="flex flex-wrap items-center gap-3">
                      {!isRecording && !audioUrl && (
                        <button
                          type="button"
                          id="btn-start-mic-recording"
                          onClick={startRecording}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                        >
                          <Mic className="w-4 h-4 animate-pulse" />
                          <span>Record Voice Note</span>
                        </button>
                      )}

                      {isRecording && (
                        <button
                          type="button"
                          id="btn-stop-mic-recording"
                          onClick={stopRecording}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all animate-pulse shadow-md active:scale-95 cursor-pointer"
                        >
                          <Square className="w-4 h-4 fill-white" />
                          <span>Stop Recording ({formatSeconds(recordingDuration)})</span>
                        </button>
                      )}

                      {audioUrl && !isRecording && (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={togglePlayAudio}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                          >
                            {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                            <span>{isPlayingAudio ? "Pause" : "Play Voice Note"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={resetRecording}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Re-record</span>
                          </button>
                          <audio
                            ref={audioPlayerRef}
                            src={audioUrl}
                            onEnded={() => setIsPlayingAudio(false)}
                            className="hidden"
                          />
                        </div>
                      )}

                      <span className="text-xs text-slate-500">or upload audio file below</span>
                    </div>

                    {micError && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                        {micError}
                      </div>
                    )}
                  </div>
                )}

                {/* FILE PICKER (For images, videos, audio, or files) */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-blue-200 hover:border-blue-400 rounded-2xl p-6 text-center cursor-pointer bg-slate-50 hover:bg-blue-50/50 transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={
                      submissionType === "image"
                        ? "image/jpeg,image/png,image/webp,image/gif"
                        : submissionType === "video"
                        ? "video/mp4,video/webm,video/quicktime,video/x-matroska,video/3gpp"
                        : submissionType === "audio"
                        ? "audio/mpeg,audio/mp3,audio/wav,audio/webm,audio/ogg,audio/m4a,audio/aac"
                        : ".pdf,.doc,.docx,.txt,.zip"
                    }
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="p-3 rounded-2xl bg-white border border-blue-100 text-blue-600 shadow-xs">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-blue-600 hover:underline">
                        Click to upload {submissionType === "file" ? "document/file" : submissionType}
                      </span>
                      <span className="text-xs text-slate-500"> or drag and drop</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {submissionType === "image"
                        ? "JPG, PNG, WEBP, GIF up to 10MB"
                        : submissionType === "video"
                        ? "MP4, WebM, MOV up to 50MB"
                        : submissionType === "audio"
                        ? "MP3, WAV, WEBM, M4A up to 25MB"
                        : "PDF, DOC, DOCX, TXT, ZIP up to 20MB"}
                    </p>
                  </div>
                </div>

                {/* Selected File Badge */}
                {mediaFile && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950">
                    <span className="truncate font-semibold">{mediaFile.name} ({(mediaFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                    <button
                      type="button"
                      onClick={() => {
                        setMediaFile(null);
                        setMediaDataUrl(null);
                      }}
                      className="text-red-600 hover:text-red-700 font-bold ml-2 shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2">
              <button
                type="button"
                id="btn-proceed-preview"
                onClick={handleProceedToPreview}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm tracking-wide shadow-md shadow-blue-600/20 transition-all active:scale-98 cursor-pointer"
              >
                <span>Fast Preview & Submit</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
