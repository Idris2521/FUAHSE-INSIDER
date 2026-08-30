import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Mic,
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
} from "lucide-react";
import confetti from "canvas-confetti";
import { Category, SubmissionType, UserProfile } from "../types";
import { api } from "../lib/api";
import { WhatsAppButton } from "./WhatsAppButton";

interface SubmitContentProps {
  user: UserProfile | null;
  onOpenAuth: (mode?: "login" | "register") => void;
  onSubmissionComplete?: () => void;
  onNavigateMySubmissions?: () => void;
}

export const SubmitContent: React.FC<SubmitContentProps> = ({
  user,
  onOpenAuth,
  onSubmissionComplete,
  onNavigateMySubmissions,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [submissionType, setSubmissionType] = useState<SubmissionType>("text");
  const [textContent, setTextContent] = useState("");

  // Media state
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaDataUrl, setMediaDataUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | "audio">("image");

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
      if (active.length > 0) {
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
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Convert to base64 data url for upload preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setMediaDataUrl(reader.result as string);
          setMediaType("audio");
        };
        reader.readAsDataURL(audioBlob);

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

  // Handle File Input Selection (Image / Video / Audio)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Size check
    const maxMb = submissionType === "video" ? 50 : submissionType === "audio" ? 25 : 10;
    if (file.size > maxMb * 1024 * 1024) {
      setErrorMessage(`File exceeds maximum size of ${maxMb}MB`);
      return;
    }

    setErrorMessage(null);
    setMediaFile(file);
    const mType = file.type.startsWith("video")
      ? "video"
      : file.type.startsWith("audio")
      ? "audio"
      : "image";
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
      onOpenAuth();
      return;
    }

    if (!selectedCategory) {
      setErrorMessage("Please select a category");
      return;
    }

    if (submissionType === "text" && !textContent.trim()) {
      setErrorMessage("Please write some text content for your submission");
      return;
    }

    if (["image", "video", "audio"].includes(submissionType) && !mediaDataUrl && !textContent.trim()) {
      setErrorMessage(`Please provide a ${submissionType} or text content`);
      return;
    }

    setStep("preview");
  };

  const handleFinalSubmit = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(20);
    setErrorMessage(null);

    try {
      let uploadedMediaItems: any[] = [];

      // 1. Upload media if present
      if (mediaDataUrl) {
        setUploadProgress(40);
        const resMedia = await api.uploadMedia({
          file_data: mediaDataUrl,
          file_name: mediaFile?.name || (mediaType === "audio" ? "voice-note.webm" : "upload.media"),
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

      setUploadProgress(75);

      // 2. Create submission record
      const catObj = categories.find((c) => c.name === selectedCategory);
      const res = await api.submitContent({
        category_id: catObj?.id,
        category_name: selectedCategory,
        submission_type: submissionType,
        text_content: textContent,
        media_items: uploadedMediaItems,
      });

      setUploadProgress(100);
      setLastSubmissionId(res.submission.id);
      setStep("success");

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
          colors: ["#e11d48", "#10b981", "#38bdf8", "#fbbf24"],
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
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* ------------------------------------------------------------- */}
      {/* STEP 3: SUBMISSION SUCCESS SCREEN */}
      {/* ------------------------------------------------------------- */}
      {step === "success" && (
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-10 text-center space-y-6 shadow-2xl animate-fadeIn">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Submission Received
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Gossip & Story Dispatched!
            </h2>
            <p className="text-sm text-stone-400 mt-2 max-w-md mx-auto">
              Your submission has been queued for review. Our administrators will review and publish selected content to the WhatsApp Channel.
            </p>
          </div>

          <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 text-left max-w-md mx-auto space-y-2 text-xs">
            <div className="flex justify-between items-center text-stone-400">
              <span>Submitted As:</span>
              <span className="font-mono font-bold text-rose-400">{user?.follower_id}</span>
            </div>
            <div className="flex justify-between items-center text-stone-400">
              <span>Category:</span>
              <span className="font-semibold text-white">{selectedCategory}</span>
            </div>
            <div className="flex justify-between items-center text-stone-400">
              <span>Current Status:</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase">
                Pending Review
              </span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              id="btn-view-my-submissions-success"
              onClick={onSubmissionComplete}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-sm border border-stone-700 transition-colors"
            >
              Track in My Submissions
            </button>
            <WhatsAppButton variant="primary" className="w-full sm:w-auto" />
            <button
              type="button"
              onClick={handleResetForm}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-colors"
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
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-stone-800 pb-4">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-stone-500">
                Step 2 of 2
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <Eye className="w-6 h-6 text-rose-500" />
                Review Your Submission
              </h2>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-xs font-mono font-bold text-rose-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{user?.follower_id}</span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Category & Type badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Category: {selectedCategory}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-stone-800 text-stone-300 border border-stone-700 capitalize">
                Format: {submissionType === "audio" ? "Voice Note / Audio" : submissionType}
              </span>
            </div>

            {/* Text Preview */}
            {textContent && (
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800">
                <div className="text-xs uppercase tracking-wider font-bold text-stone-500 mb-2">
                  Message / Text Content
                </div>
                <p className="text-sm text-stone-200 whitespace-pre-wrap leading-relaxed">
                  {textContent}
                </p>
              </div>
            )}

            {/* Media Preview */}
            {mediaDataUrl && (
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-bold text-stone-500">
                    Attached Media
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMediaDataUrl(null);
                      setMediaFile(null);
                      resetRecording();
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove Media
                  </button>
                </div>

                {mediaType === "image" && (
                  <div className="rounded-xl overflow-hidden max-h-96 bg-black flex items-center justify-center">
                    <img
                      src={mediaDataUrl}
                      alt="Submission preview"
                      className="max-h-96 w-auto object-contain rounded-lg"
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
                  <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 flex items-center gap-3">
                    <audio src={mediaDataUrl} controls className="w-full" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Privacy Note */}
          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              <strong>Anonymous Guarantee:</strong> Content moderators will only see your Follower ID (<strong>{user?.follower_id}</strong>). Your real identity (name, WhatsApp number, state, age) is isolated on the backend and never exposed during content review.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep("compose")}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-sm border border-stone-700 transition-colors"
            >
              Back to Edit
            </button>

            <button
              type="button"
              id="btn-confirm-submission"
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-sm tracking-wide shadow-lg shadow-rose-950/50 disabled:opacity-50 transition-all cursor-pointer"
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
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          {/* Header */}
          <div className="border-b border-stone-800 pb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs uppercase tracking-wider font-bold text-rose-400">
                Anonymous Campus Submission
              </span>
              {user ? (
                <span className="text-xs font-mono font-bold text-stone-400">
                  Posting as: <strong className="text-rose-400">{user.follower_id}</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="text-xs font-bold text-rose-400 hover:underline"
                >
                  Register to get ID
                </button>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Submit to The Campus Mirror
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 mt-1">
              Share your story, gossip, tip, confession or message with The Campus Mirror.
            </p>
          </div>

          {/* Anonymous Safety Notice */}
          <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800 flex items-center justify-between text-xs text-stone-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Anonymous Follower Protection Active</span>
            </div>
            <WhatsAppButton variant="compact" />
          </div>

          {/* Form */}
          <div className="space-y-5">
            {/* 1. Category Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-2">
                1. Select Category <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`p-2.5 rounded-xl text-xs font-bold text-left transition-all border ${
                      selectedCategory === cat.name
                        ? "bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/30"
                        : "bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-700 hover:text-stone-200"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Format / Type Tabs */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-2">
                2. Submission Format <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setSubmissionType("text")}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold transition-all border ${
                    submissionType === "text"
                      ? "bg-stone-800 text-white border-stone-700 shadow-sm"
                      : "bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-700"
                  }`}
                >
                  <FileText className="w-4 h-4 text-rose-400" />
                  <span>Text / Story</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSubmissionType("image")}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold transition-all border ${
                    submissionType === "image"
                      ? "bg-stone-800 text-white border-stone-700 shadow-sm"
                      : "bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-700"
                  }`}
                >
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  <span>Photo / Image</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSubmissionType("video")}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold transition-all border ${
                    submissionType === "video"
                      ? "bg-stone-800 text-white border-stone-700 shadow-sm"
                      : "bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-700"
                  }`}
                >
                  <VideoIcon className="w-4 h-4 text-amber-400" />
                  <span>Video Clip</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSubmissionType("audio")}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold transition-all border ${
                    submissionType === "audio"
                      ? "bg-stone-800 text-white border-stone-700 shadow-sm"
                      : "bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-700"
                  }`}
                >
                  <Mic className="w-4 h-4 text-sky-400" />
                  <span>Voice Note / Audio</span>
                </button>
              </div>
            </div>

            {/* 3. Text Message Area */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-300">
                  {submissionType === "text" ? "Gossip / Story Details" : "Caption / Description (Optional)"}
                  {submissionType === "text" && <span className="text-rose-400"> *</span>}
                </label>
                <span className="text-[11px] font-mono text-stone-500">
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
                className="w-full p-4 rounded-2xl bg-stone-950 border border-stone-800 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors resize-none leading-relaxed"
              />
            </div>

            {/* 4. Media Upload Controls */}
            {submissionType !== "text" && (
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-300">
                  Attach {submissionType === "image" ? "Image" : submissionType === "video" ? "Video" : "Voice Note"} File
                </label>

                {/* AUDIO RECORDING WORKFLOW */}
                {submissionType === "audio" && (
                  <div className="p-5 rounded-2xl bg-stone-950 border border-stone-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                        Live Voice Note Recorder (Microphone)
                      </span>
                      {recordingDuration > 0 && (
                        <span className="text-xs font-mono font-bold text-rose-400">
                          {formatSeconds(recordingDuration)}
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
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-950/40 active:scale-95 cursor-pointer"
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
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all animate-pulse shadow-md active:scale-95 cursor-pointer"
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
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                          >
                            {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                            <span>{isPlayingAudio ? "Pause" : "Play Preview"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={resetRecording}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold"
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

                      <span className="text-xs text-stone-500">or upload audio file below</span>
                    </div>

                    {micError && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                        {micError}
                      </div>
                    )}
                  </div>
                )}

                {/* FILE PICKER (For images, videos, or audio file upload) */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-stone-800 hover:border-stone-700 rounded-2xl p-6 text-center cursor-pointer bg-stone-950/60 hover:bg-stone-950 transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={
                      submissionType === "image"
                        ? "image/jpeg,image/png,image/webp,image/gif"
                        : submissionType === "video"
                        ? "video/mp4,video/webm,video/quicktime"
                        : "audio/mpeg,audio/mp3,audio/wav,audio/webm,audio/ogg,audio/m4a"
                    }
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800 text-stone-400">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-rose-400 hover:underline">
                        Click to upload {submissionType}
                      </span>
                      <span className="text-xs text-stone-500"> or drag and drop</span>
                    </div>
                    <p className="text-[11px] text-stone-500">
                      {submissionType === "image"
                        ? "JPG, PNG, WEBP, GIF up to 10MB"
                        : submissionType === "video"
                        ? "MP4, WebM, MOV up to 50MB"
                        : "MP3, WAV, WEBM, M4A up to 25MB"}
                    </p>
                  </div>
                </div>

                {/* Selected File Badge */}
                {mediaFile && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-300">
                    <span className="truncate font-medium">{mediaFile.name} ({(mediaFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                    <button
                      type="button"
                      onClick={() => {
                        setMediaFile(null);
                        setMediaDataUrl(null);
                      }}
                      className="text-rose-400 hover:text-rose-300 font-bold ml-2 shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2">
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
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-sm tracking-wide shadow-lg shadow-rose-950/50 transition-all active:scale-98 cursor-pointer"
              >
                <span>Preview Submission</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
