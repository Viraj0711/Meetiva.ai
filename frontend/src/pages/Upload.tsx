import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useBeforeUnload } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, FileText, FileUp, Mic, Video } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Progress } from '@/components/ui/Progress';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { meetingService, type DuplicateMeetingInfo, type UploadDuplicateError } from '@/services';
import { API_BASE_URL } from '@/services/api.config';
import { retryWithBackoff, isRetryableError } from '@/utils/retry.utils';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [uploadState, setUploadState] = useState<FileUploadState>({ file: null, uploading: false, progress: 0, error: null, exportUrl: null, meetingId: null });
  const [dragActive, setDragActive] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [duplicateMeeting, setDuplicateMeeting] = useState<DuplicateMeetingInfo | null>(null);

  const acceptedExtensions = '.mp3,.wav,.m4a,.aac,.mp4,.mpeg,.mov,.avi,.txt';
  const audioExtensions = ['mp3', 'wav', 'm4a', 'aac', 'mpeg'];
  const videoExtensions = ['mp4', 'mov', 'avi'];

  const getFileCategory = (file: File): 'audio' | 'video' | 'text' => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (audioExtensions.includes(ext)) return 'audio';
    if (videoExtensions.includes(ext)) return 'video';
    return 'text';
  };

  useBeforeUnload(useCallback((event) => {
    if (uploadState.uploading) {
      event.preventDefault();
      return (event.returnValue = 'Upload in progress. Are you sure you want to leave?');
    }
  }, [uploadState.uploading]));

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (uploadState.uploading) {
        e.preventDefault();
        e.returnValue = '';
      }
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

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const handleFile = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setUploadState({ file: null, uploading: false, progress: 0, error, exportUrl: null, meetingId: null });
      return;
    }
    setUploadState({ file, uploading: false, progress: 0, error: null, exportUrl: null, meetingId: null });
    if (!meetingTitle) setMeetingTitle(file.name.replace(/\.[^/.]+$/, ''));
  };

  const handleExcelDownload = async (exportUrl: string, title?: string) => {
    setDownloading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${exportUrl}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(title || 'meeting').replace(/[^a-z0-9-_]+/gi, '_')}_tasks.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadState.file) return;
    try {
      setDuplicateMeeting(null);
      setUploadState((prev) => ({ ...prev, uploading: true, error: null, exportUrl: null, meetingId: null }));
      const result = await retryWithBackoff(() => meetingService.uploadMeetingFile(uploadState.file!, meetingTitle || uploadState.file!.name, `Meeting uploaded on ${new Date().toLocaleDateString()}`, undefined, (progress) => setUploadState((prev) => ({ ...prev, progress }))), { maxAttempts: 3 });
      setUploadState((prev) => ({ ...prev, uploading: false, progress: 100, error: null, exportUrl: result.actionItemsExportUrl, meetingId: result.data.id }));
      await queryClient.invalidateQueries({ queryKey: ['meetings'] });
    } catch (error) {
      if ((error as UploadDuplicateError)?.code === 'MEETING_DUPLICATE') {
        setUploadState((prev) => ({ ...prev, uploading: false, error: null }));
        setDuplicateMeeting((error as UploadDuplicateError).existingMeeting);
        return;
      }
      const errorMessage = isRetryableError(error) ? 'Upload failed due to network issues. Please try again.' : (error instanceof Error ? error.message : 'Failed to upload file.');
      setUploadState((prev) => ({ ...prev, uploading: false, error: errorMessage }));
    }
  };

  const clearFile = () => {
    if (uploadState.uploading) {
      setShowCancelDialog(true);
      return;
    }
    setUploadState({ file: null, uploading: false, progress: 0, error: null, exportUrl: null, meetingId: null });
    setDuplicateMeeting(null);
    setMeetingTitle('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCancelUpload = () => {
    setShowCancelDialog(false);
    clearFile();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  };

  return (
    <div className="relative mx-auto max-w-7xl space-y-8 overflow-hidden">
      <ConfirmDialog isOpen={showCancelDialog} title="Cancel Upload?" message="Upload is in progress. Are you sure you want to cancel? All progress will be lost." confirmText="Yes, Cancel" cancelText="Continue Upload" variant="warning" onConfirm={handleCancelUpload} onCancel={() => setShowCancelDialog(false)} />

      <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(124,92,255,0.2),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(48,213,246,0.12),transparent_26%),rgba(255,255,255,0.03)] p-8 backdrop-blur-2xl">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Upload pipeline</p>
            <h1 className="mt-3 font-display text-5xl font-bold tracking-tight text-white md:text-6xl">Upload meetings into a cinematic AI workflow.</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-white/60">Drop in recordings, transcripts, or video files and watch Meetiva extract the signal, build tasks, and package the next steps.</p>
          </div>

          <Card className="p-7">
            <label className="mb-3 block text-sm font-medium text-white/70">Meeting title</label>
            <Input type="text" placeholder="Sprint planning, leadership sync, client review..." value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} disabled={uploadState.uploading} />
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className={`relative rounded-[1.5rem] border border-dashed p-8 md:p-10 transition-all ${dragActive ? 'border-cyan-300 bg-cyan-300/[0.06]' : 'border-white/10 bg-white/[0.03]'} ${uploadState.uploading ? 'pointer-events-none opacity-60' : ''}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
              <input ref={fileInputRef} type="file" className="hidden" accept={acceptedExtensions} onChange={handleFileInput} disabled={uploadState.uploading} />
              {!uploadState.file ? (
                <div className="space-y-6 text-center">
                  <div className="mx-auto grid h-20 w-20 place-items-center rounded-[1.75rem] bg-gradient-primary shadow-[0_18px_40px_rgba(124,92,255,0.35)]"><FileUp className="h-9 w-9 text-white" /></div>
                  <div><h2 className="text-2xl font-semibold text-white">Drag and drop a file or transcript</h2><p className="mt-2 text-sm text-white/55">Audio, video, and text files are supported.</p></div>
                  <Button onClick={() => fileInputRef.current?.click()} disabled={uploadState.uploading} size="lg">Select file</Button>
                  <div className="flex flex-wrap justify-center gap-2">{['MP3', 'WAV', 'M4A', 'MP4', 'MOV', 'TXT'].map((item) => (<span key={item} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/60">{item}</span>))}</div>
                </div>
              ) : (
                <div className="space-y-6 text-center">
                  <div className="mx-auto grid h-20 w-20 place-items-center rounded-[1.75rem] bg-white/[0.06] text-cyan-300">{getFileCategory(uploadState.file) === 'audio' ? <Mic className="h-9 w-9" /> : getFileCategory(uploadState.file) === 'video' ? <Video className="h-9 w-9" /> : <FileText className="h-9 w-9" />}</div>
                  <div><h2 className="text-2xl font-semibold text-white">{uploadState.file.name}</h2><p className="mt-2 text-sm text-white/55">{formatFileSize(uploadState.file.size)} • {getFileCategory(uploadState.file)} file</p></div>
                  {!uploadState.uploading && <Button variant="outline" onClick={clearFile}>Change file</Button>}
                </div>
              )}
            </div>

            {uploadState.uploading && <div className="border-t border-white/10 p-6"><div className="mb-2 flex items-center justify-between text-sm text-white/60"><span>{getFileCategory(uploadState.file!) === 'text' ? 'Uploading' : 'Uploading and transcribing'}</span><span>{Math.round(uploadState.progress)}%</span></div><Progress value={uploadState.progress} /></div>}
            {uploadState.error && <div className="border-t border-white/10 p-6"><div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{uploadState.error}</div></div>}
          </Card>

          {duplicateMeeting && <Card className="p-6 border-amber-400/20 bg-amber-500/10"><p className="font-medium text-amber-100">This meeting already exists.</p><p className="mt-1 text-sm text-amber-100/70">Existing meeting: {duplicateMeeting.title}</p><Button className="mt-4" variant="outline" onClick={() => navigate(`/dashboard/meetings/${duplicateMeeting.id}`)}>Open existing meeting</Button></Card>}

          {uploadState.exportUrl && uploadState.meetingId && <Card className="p-6 border-cyan-400/20 bg-cyan-500/10"><div className="flex items-start gap-4"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-400/15 text-cyan-300"><CheckCircle2 className="h-6 w-6" /></div><div className="flex-1"><h3 className="text-lg font-semibold text-white">Meeting processed successfully</h3><p className="mt-2 text-sm leading-7 text-white/60">Your transcript, summary, decisions, and action items are ready.</p><div className="mt-5 flex flex-wrap gap-3"><Button onClick={() => handleExcelDownload(uploadState.exportUrl!, meetingTitle)} isLoading={downloading}>Download tasks</Button><Button variant="outline" onClick={() => navigate(`/dashboard/meetings/${uploadState.meetingId}`)}>Open meeting</Button><Button variant="ghost" onClick={() => navigate('/dashboard')}>Go to dashboard</Button></div></div></div></Card>}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">What happens next</p>
            <div className="mt-5 space-y-4">{[['1', 'Whisper transcribes the file', 'Audio and video are converted into clean text with speaker context.'], ['2', 'AI extracts decisions and actions', 'Tasks are labeled, prioritized, and assigned.'], ['3', 'Output is synced into the workflow', 'Summaries, reminders, and exports stay visible.']].map(([step, title, description]) => (<div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="flex items-center gap-3"><div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-primary text-xs font-bold text-white">{step}</div><div><p className="font-medium text-white">{title}</p><p className="mt-1 text-sm text-white/55">{description}</p></div></div></div>))}</div>
          </Card>

          <Card className="p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Supported formats</p>
            <div className="mt-4 flex flex-wrap gap-2">{['MP3', 'WAV', 'M4A', 'AAC', 'MP4', 'MOV', 'AVI', 'TXT'].map((fmt) => (<span key={fmt} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/60">{fmt}</span>))}</div>
            <p className="mt-4 text-sm leading-7 text-white/55">Max 25 MB. Uploads are processed securely and can be exported later as Excel task files.</p>
          </Card>

          <Card className="p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Activity preview</p>
            <div className="mt-4 space-y-3">{['Summary generated', 'Tasks classified', 'Calendar reminder created'].map((item) => (<div key={item} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/75"><span>{item}</span><span className="text-cyan-300">live</span></div>))}</div>
          </Card>
        </div>
      </div>

      <div className="flex justify-center pb-4 pt-2">
        <Button onClick={handleUpload} disabled={!uploadState.file || uploadState.uploading || !meetingTitle.trim()} size="lg"><ArrowRight className="mr-2 h-4 w-4" />{uploadState.uploading ? 'Processing meeting' : 'Upload & process'}</Button>
      </div>
    </div>
  );
};

export default Upload;
