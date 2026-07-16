import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Upload as UploadIcon, FileText, CheckCircle2, Mic, Video, ArrowRight, FileDown, BookOpen, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Progress } from '@/components/ui/Progress';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { meetingService, type DuplicateMeetingInfo, type UploadDuplicateError } from '@/services';
import { useSubscription } from '@/hooks/useAuth';
import { useAppDispatch } from '@/store/hooks';
import { addToast } from '@/store/slices/uiSlice';
import { API_BASE_URL } from '@/services/api.config';
import { getAccessToken } from '@/services/api.client';
import { retryWithBackoff, isNetworkError, describeNetworkError } from '@/utils/retry.utils';

const GRAD = '#5B3FD6';
const GRAD2 = '#8B5CF6';
const CARD_SHADOW = '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(91,63,214,0.07), inset 0 1px 0 rgba(255,255,255,0.95)';
const AMBER_TINT = 'rgba(244,177,131,0.18)';
const MESH_BG: React.CSSProperties = {
  background:
    'radial-gradient(ellipse 70% 50% at 15% 5%, rgba(91,63,214,0.07) 0%, transparent 55%),' +
    'radial-gradient(ellipse 50% 40% at 90% 90%, rgba(244,114,182,0.05) 0%, transparent 55%),' +
    '#FCFBFF',
};

interface FileUploadState {
  file: File | null;
  uploading: boolean;
  progress: number;
  error: string | null;
  exportUrl: string | null;
  meetingId: string | null;
}

const Upload: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [meetingTitle, setMeetingTitle] = useState('');
  const { data: subscription } = useSubscription();
  const [uploadState, setUploadState] = useState<FileUploadState>({
    file: null, uploading: false, progress: 0, error: null, exportUrl: null, meetingId: null,
  });
  const [drag, setDrag] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [duplicateMeeting, setDuplicateMeeting] = useState<DuplicateMeetingInfo | null>(null);
  const [processingMode, setProcessingMode] = useState<'tasks' | 'minutes' | 'both' | null>(null);
  const [completedMode, setCompletedMode] = useState<'tasks' | 'minutes' | 'both' | null>(null);
  const [processing, setProcessing] = useState(false);
  const lastNudgedCount = useRef<number | null>(null);

  const acceptedExtensions = '.mp3,.wav,.m4a,.aac,.mp4,.mpeg,.mov,.avi,.txt';
  const audioExtensions = ['mp3', 'wav', 'm4a', 'aac', 'mpeg'];
  const videoExtensions = ['mp4', 'mov', 'avi'];

  const getFileCategory = (file: File): 'audio' | 'video' | 'text' => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (audioExtensions.includes(ext)) return 'audio';
    if (videoExtensions.includes(ext)) return 'video';
    return 'text';
  };

  useEffect(() => {
    if (!subscription || subscription.isSubscribed) return;
    if (subscription.meetingCountThisMonth === 0) { lastNudgedCount.current = null; return; }
    if (subscription.meetingsRemaining === 1 && lastNudgedCount.current !== 1) {
      lastNudgedCount.current = 1;
      dispatch(addToast({ type: 'warning', message: 'You have 1 meeting remaining this month. Upgrade to PRO for unlimited meetings.', duration: 8000 }));
    }
  }, [subscription, dispatch]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (uploadState.uploading) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [uploadState.uploading]);

  const validateFile = (file: File): string | null => {
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) return 'File size must be less than 25MB.';
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['mp3', 'wav', 'm4a', 'aac', 'mp4', 'mpeg', 'mov', 'avi', 'txt'];
    if (!fileExtension || !validExtensions.includes(fileExtension)) return 'Upload an audio, video, or .txt transcript file.';
    return null;
  };

  const handleFile = (file: File) => {
    const error = validateFile(file);
    if (error) { setUploadState({ file: null, uploading: false, progress: 0, error, exportUrl: null, meetingId: null }); return; }
    setUploadState({ file, uploading: false, progress: 0, error: null, exportUrl: null, meetingId: null });
    if (!meetingTitle) setMeetingTitle(file.name.replace(/\.[^/.]+$/, ''));
  };

  const processMeeting = async (mode: 'tasks' | 'minutes' | 'both') => {
    setProcessingMode(mode);
    setProcessing(true);
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_BASE_URL}/meetings/${uploadState.meetingId}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mode }),
      });
      const result = await res.json();
      if (res.ok) {
        setCompletedMode(mode);
        setUploadState(prev => ({ ...prev, exportUrl: mode === 'minutes' ? result.minutesExportUrl : result.actionItemsExportUrl }));
      } else {
        setUploadState(prev => ({ ...prev, error: result.message || 'Processing failed' }));
      }
    } catch {
      setUploadState(prev => ({ ...prev, error: 'Processing failed' }));
    } finally {
      setProcessing(false);
      setProcessingMode(null);
    }
  };

  const handleUpload = async () => {
    if (!uploadState.file) return;
    try {
      setDuplicateMeeting(null);
      setCompletedMode(null);
      setUploadState((prev) => ({ ...prev, uploading: true, error: null, exportUrl: null, meetingId: null }));
      const result = await retryWithBackoff(() =>
        meetingService.uploadMeetingFile(uploadState.file!, meetingTitle || uploadState.file!.name,
          `Meeting uploaded on ${new Date().toLocaleDateString()}`, undefined,
          (progress) => setUploadState((prev) => ({ ...prev, progress }))),
        { maxAttempts: 3 }
      );
      setUploadState((prev) => ({ ...prev, uploading: false, progress: 100, meetingId: result.data.id }));
      await queryClient.invalidateQueries({ queryKey: ['meetings'] });
    } catch (error) {
      if ((error as UploadDuplicateError)?.code === 'MEETING_DUPLICATE') {
        setUploadState((prev) => ({ ...prev, uploading: false, error: null }));
        setDuplicateMeeting((error as UploadDuplicateError).existingMeeting);
        return;
      }
      const errorMessage = isNetworkError(error)
        ? `Upload failed — ${describeNetworkError(error)}`
        : (error instanceof Error ? error.message : 'Failed to upload file.');
      setUploadState((prev) => ({ ...prev, uploading: false, error: errorMessage }));
    }
  };

  const clearFile = () => {
    if (uploadState.uploading) { setShowCancelDialog(true); return; }
    setUploadState({ file: null, uploading: false, progress: 0, error: null, exportUrl: null, meetingId: null });
    setDuplicateMeeting(null);
    setCompletedMode(null);
    setMeetingTitle('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  };

  const formats = ['MP4', 'MP3', 'M4A', 'WAV', 'TXT', 'PDF', 'MOV', 'AVI'];

  return (
    <div className="h-full flex flex-col min-h-0" style={MESH_BG}>
      <div className="max-w-5xl mx-auto w-full p-7 pb-0 flex flex-col min-h-0">
        <ConfirmDialog isOpen={showCancelDialog} title="Cancel Upload?"
          message="Upload is in progress. Are you sure you want to cancel? All progress will be lost."
          confirmText="Yes, Cancel" cancelText="Continue Upload" variant="warning"
          onConfirm={clearFile} onCancel={() => setShowCancelDialog(false)} />

        <div className="mb-4">
          <h1 className="text-xl font-bold text-[#1D1B22] tracking-tight">Upload Meeting</h1>
          <p className="text-sm font-normal text-[#64607A] mt-1">Drop a recording or paste a call link to start extracting insights.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
          {/* Left column: input + drop zone — stays completely fixed */}
          <div className="lg:w-3/5 space-y-4">
            {/* Meeting title */}
            <div className="bg-white rounded-2xl border border-[#E4E0F5] p-5" style={{ boxShadow: CARD_SHADOW }}>
              <label className="block text-[11px] font-bold text-[#1D1B22] uppercase tracking-widest mb-2">Meeting title</label>
              <Input
                placeholder="e.g. Q3 Planning Session, Engineering Standup"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                disabled={uploadState.uploading}
              />
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => fileInputRef.current?.click()}
              className={`bg-white rounded-3xl border-2 border-dashed p-12 text-center cursor-pointer transition-all ${
                drag ? 'border-[#5B3FD6] bg-[#5B3FD6]/3' : 'border-[#E4E0F5] hover:border-[#B8ACEC] hover:bg-[#EDE9FF]'
              }`}
              style={{ boxShadow: CARD_SHADOW }}
            >
              <input ref={fileInputRef} type="file" className="hidden" accept={acceptedExtensions} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} disabled={uploadState.uploading} />

              {!uploadState.file ? (
                <>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: AMBER_TINT }}>
                    <UploadIcon size={22} className="text-[#5B3FD6]" />
                  </div>
                  <div className="text-base font-bold text-[#1D1B22] mb-1">Drop your recording here</div>
                  <p className="text-sm font-normal text-[#64607A] mb-5 max-w-xs mx-auto leading-relaxed">
                    Drag and drop your file here, or click to select from your computer.
                  </p>
                  <div className="flex items-center justify-center gap-2 flex-wrap mb-6">
                    {formats.map((f) => (
                      <span key={f} className="px-3 py-1 rounded-full text-[11px] font-semibold border border-[#E4E0F5] bg-[#FCFBFF] text-[#64607A]">{f}</span>
                    ))}
                  </div>
                  <button onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm rounded-full font-bold text-white transition-all duration-150 hover:opacity-90 hover:scale-[1.015] active:scale-[0.985] cursor-pointer select-none"
                    style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})`, boxShadow: `0 4px 16px rgba(91,63,214,0.35)` }}>
                    Select file
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-2" style={{ background: AMBER_TINT }}>
                    {getFileCategory(uploadState.file) === 'audio' ? <Mic size={22} className="text-[#5B3FD6]" /> :
                     getFileCategory(uploadState.file) === 'video' ? <Video size={22} className="text-[#5B3FD6]" /> :
                     <FileText size={22} className="text-[#5B3FD6]" />}
                  </div>
                  <div className="text-base font-bold text-[#1D1B22]">{uploadState.file.name}</div>
                  <div className="text-sm text-[#64607A]">{formatFileSize(uploadState.file.size)} &bull; {getFileCategory(uploadState.file)} file</div>
                  {!uploadState.uploading && (
                    <button onClick={(e) => { e.stopPropagation(); clearFile(); }}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs rounded-full font-semibold bg-white border border-[#E4E0F5] transition-all duration-150 hover:border-[#B8ACEC] cursor-pointer select-none"
                      style={{ color: GRAD }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#EDE9FF'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'white'; }}>
                      Change file
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Progress bar */}
            {uploadState.uploading && (
              <div className="bg-white rounded-2xl border border-[#E4E0F5] p-5" style={{ boxShadow: CARD_SHADOW }}>
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="text-[#1D1B22] font-semibold">{getFileCategory(uploadState.file!) === 'text' ? 'Uploading...' : 'Uploading and transcribing...'}</span>
                  <span className="text-[#64607A]">{Math.round(uploadState.progress)}%</span>
                </div>
                <Progress value={uploadState.progress} />
              </div>
            )}

            {/* Error state */}
            {uploadState.error && (
              <div className="bg-white rounded-2xl border border-red-200 p-5" style={{ boxShadow: CARD_SHADOW }}>
                <p className="text-sm font-semibold text-red-600">{uploadState.error}</p>
              </div>
            )}

            {/* Duplicate meeting */}
            {duplicateMeeting && (
              <div className="bg-white rounded-2xl border border-amber-200 p-5" style={{ boxShadow: CARD_SHADOW }}>
                <p className="text-sm font-semibold text-[#1D1B22]">This meeting already exists.</p>
                <p className="text-sm text-[#64607A] mt-1">Existing meeting: {duplicateMeeting.title}</p>                  <button onClick={() => navigate(`/dashboard/meetings/${duplicateMeeting.id}`)}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-xs rounded-full font-semibold bg-white border border-[#E4E0F5] transition-all duration-150 hover:border-[#B8ACEC] cursor-pointer select-none"
                  style={{ color: GRAD }}>Open existing meeting</button>
              </div>
            )}

            {/* Processing state */}
            {processing && (
              <div className="bg-white rounded-2xl border border-[#E4E0F5] p-5" style={{ boxShadow: CARD_SHADOW }}>
                <div className="flex items-center justify-center gap-3 text-sm">
                  <Loader2 size={16} className="animate-spin text-[#5B3FD6]" />
                  <span className="text-[#1D1B22] font-semibold">
                    {processingMode === 'tasks' ? 'Extracting tasks...' : processingMode === 'minutes' ? 'Generating minutes...' : 'Processing meeting...'}
                  </span>
                </div>
              </div>
            )}

            {/* Choice state — after upload, ask what to do */}
            {uploadState.meetingId && !processing && !uploadState.exportUrl && (
              <div className="bg-white rounded-3xl border border-[#E4E0F5] p-6" style={{ boxShadow: CARD_SHADOW }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(5,150,105,0.10)' }}>
                    <CheckCircle2 size={22} className="text-[#059669]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-[#1D1B22]">Meeting uploaded successfully</h3>
                    <p className="text-sm text-[#64607A] mt-1">What would you like to do with this meeting?</p>
                    <div className="flex flex-wrap gap-3 mt-5">
                      <button onClick={() => processMeeting('tasks')}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-xs rounded-full font-bold text-white transition-all duration-150 hover:opacity-90 cursor-pointer select-none"
                        style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})`, boxShadow: `0 4px 16px rgba(91,63,214,0.35)` }}>
                        <FileDown size={13} /> Extract Tasks
                      </button>
                      <button onClick={() => processMeeting('minutes')}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-xs rounded-full font-semibold bg-white border border-[#E4E0F5] transition-all duration-150 hover:border-[#B8ACEC] cursor-pointer select-none"
                        style={{ color: GRAD }}>
                        <BookOpen size={13} /> Generate Minutes
                      </button>
                      <button onClick={() => processMeeting('both')}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-xs rounded-full font-semibold border border-[#E4E0F5] transition-all duration-150 hover:border-[#B8ACEC] cursor-pointer select-none"
                        style={{ color: '#64607A' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = GRAD; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#64607A'; }}>
                        Do Both
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Success state after processing */}
            {uploadState.exportUrl && uploadState.meetingId && !processing && (
              <div className="bg-white rounded-3xl border border-[#E4E0F5] p-6" style={{ boxShadow: CARD_SHADOW }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(5,150,105,0.10)' }}>
                    <CheckCircle2 size={22} className="text-[#059669]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-[#1D1B22]">Done!</h3>
                    <p className="text-sm text-[#64607A] mt-1">
                      {completedMode === 'tasks' ? 'Tasks extracted successfully.' :
                       completedMode === 'minutes' ? 'Minutes generated successfully.' :
                       'Tasks extracted and minutes generated successfully.'}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-5">
                      <button onClick={() => navigate(`/dashboard/meetings/${uploadState.meetingId}`)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-xs rounded-full font-bold text-white transition-all duration-150 hover:opacity-90 cursor-pointer select-none"
                        style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})`, boxShadow: `0 4px 16px rgba(91,63,214,0.35)` }}>
                        Open meeting
                      </button>
                      <button onClick={() => navigate('/dashboard/minutes')}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-xs rounded-full font-semibold bg-white border border-[#E4E0F5] transition-all duration-150 hover:border-[#B8ACEC] cursor-pointer select-none"
                        style={{ color: GRAD }}>
                        View minutes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Upload button */}
            {uploadState.file && !uploadState.uploading && !uploadState.exportUrl && !uploadState.meetingId && (
              <div className="flex justify-center pt-2">
                <button onClick={handleUpload}
                  className="inline-flex items-center gap-2 px-8 py-3 text-sm rounded-full font-bold text-white transition-all duration-150 hover:opacity-90 hover:scale-[1.015] active:scale-[0.985] cursor-pointer select-none"
                  style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})`, boxShadow: `0 4px 16px rgba(91,63,214,0.35)` }}>
                  <ArrowRight size={15} /> Upload &amp; process
                </button>
              </div>
            )}
          </div>

          {/* Right column: scrolls independently */}
          <div className="lg:w-2/5 space-y-4 overflow-y-auto min-h-0 pl-1">
            {/* What happens next */}
            <div className="bg-white rounded-2xl border border-[#E4E0F5] p-5" style={{ boxShadow: CARD_SHADOW }}>
              <div className="text-sm font-bold text-[#1D1B22] mb-5">What happens next</div>
              <div className="space-y-5">
                {[
                  { n: '1', title: 'Upload or connect', desc: 'Drop a recording, transcript, or paste a Zoom / Meet link.' },
                  { n: '2', title: 'AI extracts the signal', desc: 'Summaries, decisions, action items, and priorities appear automatically.' },
                  { n: '3', title: 'Momentum keeps moving', desc: 'Calendar sync and ownership keep the whole team aligned.' },
                ].map((step) => (
                  <div key={step.n} className="flex gap-4">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})` }}>
                      {step.n}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#1D1B22]">{step.title}</div>
                      <div className="text-xs text-[#64607A] mt-0.5 leading-snug">{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Supported formats */}
            <div className="bg-white rounded-2xl border border-[#E4E0F5] p-5" style={{ boxShadow: CARD_SHADOW }}>
              <div className="text-sm font-bold text-[#1D1B22] mb-4">Supported formats</div>
              <div className="flex flex-wrap gap-2">
                {formats.map((f) => (
                  <span key={f} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-[#E4E0F5] text-[#5B3FD6]" style={{ background: AMBER_TINT }}>{f}</span>
                ))}
              </div>
              <p className="mt-3 text-xs text-[#64607A]">Max 25 MB. Uploads are processed securely.</p>
            </div>

            {/* Meeting credits */}
            <div className="bg-white rounded-2xl border border-[#E4E0F5] p-5" style={{ boxShadow: CARD_SHADOW }}>
              <div className="text-sm font-bold text-[#1D1B22] mb-4">Meeting credits</div>
              {!subscription ? (
                <div className="flex items-center justify-center py-4">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#5B3FD6] border-t-transparent" />
                </div>
              ) : subscription.isSubscribed ? (
                <>
                  <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(91,63,214,0.08)' }}>
                    <p className="text-2xl font-bold text-[#1D1B22]">Unlimited</p>
                    <p className="mt-1 text-sm text-[#5B3FD6]">You&apos;re on the {subscription.tier} plan</p>
                  </div>
                  <p className="mt-3 text-xs text-[#64607A] text-center">No meeting limits — upload as many as you need.</p>
                </>
              ) : (
                <>
                  <div className="rounded-2xl p-4 text-center" style={{ background: '#EDE9FF' }}>
                    <p className="text-xs text-[#64607A] uppercase tracking-wider">Free tier — {subscription.monthlyLimit} meetings/month</p>
                    <p className="mt-3 text-4xl font-bold tracking-tight text-[#1D1B22]">{subscription.meetingsRemaining}</p>
                    <p className="mt-1 text-sm text-[#64607A]">remaining this month</p>
                  </div>
                  <div className="flex h-2 overflow-hidden rounded-full bg-[#EDE9FF] mt-4">
                    <div className="rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(0, Math.min(100, (subscription.meetingCountThisMonth / subscription.monthlyLimit) * 100))}%`, background: `linear-gradient(90deg, ${GRAD}, ${GRAD2})` }} />
                  </div>
                  <p className="text-xs text-[#64607A] mt-1">{subscription.meetingCountThisMonth} of {subscription.monthlyLimit} used</p>
                  <button onClick={() => navigate('/dashboard/upgrade')}
                    className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs rounded-full font-semibold border border-[#E4E0F5] bg-white transition-all duration-150 hover:border-[#B8ACEC] cursor-pointer select-none"
                    style={{ color: GRAD }}>
                    Upgrade to PRO
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
