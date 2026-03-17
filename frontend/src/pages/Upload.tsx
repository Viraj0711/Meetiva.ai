import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useBeforeUnload } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Progress } from '@/components/ui/Progress';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { meetingService } from '@/services';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [uploadState, setUploadState] = useState<FileUploadState>({
    file: null,
    uploading: false,
    progress: 0,
    error: null,
    exportUrl: null,
    meetingId: null,
  });
  const [dragActive, setDragActive] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleExcelDownload = async (exportUrl: string, meetingTitle?: string) => {
    setDownloading(true);
    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
      const response = await fetch(`${API_BASE_URL}${exportUrl}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(meetingTitle || 'meeting').replace(/[^a-z0-9-_]+/gi, '_')}_tasks.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download Excel file. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const acceptedExtensions = '.mp3,.wav,.m4a,.aac,.mp4,.mpeg,.mov,.avi,.txt';

  const audioExtensions = ['mp3', 'wav', 'm4a', 'aac', 'mpeg'];
  const videoExtensions = ['mp4', 'mov', 'avi'];

  const getFileCategory = (file: File): 'audio' | 'video' | 'text' => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (audioExtensions.includes(ext)) return 'audio';
    if (videoExtensions.includes(ext)) return 'video';
    return 'text';
  };

  useBeforeUnload(
    React.useCallback(
      (event) => {
        if (uploadState.uploading) {
          event.preventDefault();
          return (event.returnValue = 'Upload in progress. Are you sure you want to leave?');
        }
      },
      [uploadState.uploading]
    )
  );

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
    if (file.size > maxSize) {
      return 'File size must be less than 25MB (Whisper API limit)';
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['mp3', 'wav', 'm4a', 'aac', 'mp4', 'mpeg', 'mov', 'avi', 'txt'];
    
    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      return 'Invalid file type. Please upload an audio, video, or .txt transcript file.';
    }

    return null;
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setUploadState({
        file: null,
        uploading: false,
        progress: 0,
        error,
        exportUrl: null,
        meetingId: null,
      });
      return;
    }

    setUploadState({
      file,
      uploading: false,
      progress: 0,
      error: null,
      exportUrl: null,
      meetingId: null,
    });

    if (!meetingTitle) {
      const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      setMeetingTitle(fileName);
    }
  };

  const handleUpload = async () => {
    if (!uploadState.file) return;

    try {
      setUploadState(prev => ({ ...prev, uploading: true, error: null, exportUrl: null, meetingId: null }));

      const result = await retryWithBackoff(
        () => meetingService.uploadMeetingFile(
          uploadState.file!,
          meetingTitle || uploadState.file!.name,
          `Meeting uploaded on ${new Date().toLocaleDateString()}`,
          undefined,
          (progress) => {
            setUploadState(prev => ({ ...prev, progress }));
          }
        ),
        {
          maxAttempts: 3,
          onRetry: (error, attempt) => {
            console.log(`Upload retry ${attempt}:`, error);
            setUploadState(prev => ({ 
              ...prev, 
              error: `Connection issue, retrying... (${attempt}/3)` 
            }));
          }
        }
      );

      setUploadState(prev => ({
        ...prev,
        uploading: false,
        progress: 100,
        error: null,
        exportUrl: result.actionItemsExportUrl,
        meetingId: result.data.id,
      }));
    } catch (error) {
      console.error('Upload failed:', error);
      const errorMessage = isRetryableError(error)
        ? 'Upload failed due to network issues. Please check your connection and try again.'
        : (error instanceof Error ? error.message : 'Failed to upload file. Please try again.');
      
      setUploadState(prev => ({
        ...prev,
        uploading: false,
        error: errorMessage,
      }));
    }
  };

  const clearFile = () => {
    if (uploadState.uploading) {
      setShowCancelDialog(true);
      return;
    }
    
    setUploadState({
      file: null,
      uploading: false,
      progress: 0,
      error: null,
      exportUrl: null,
      meetingId: null,
    });
    setMeetingTitle('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancelUpload = () => {
    setShowCancelDialog(false);
    setUploadState({
      file: null,
      uploading: false,
      progress: 0,
      error: null,
      exportUrl: null,
      meetingId: null,
    });
    setMeetingTitle('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <ConfirmDialog
        isOpen={showCancelDialog}
        title="Cancel Upload?"
        message="Upload is in progress. Are you sure you want to cancel? All progress will be lost."
        confirmText="Yes, Cancel"
        cancelText="Continue Upload"
        variant="warning"
        onConfirm={handleCancelUpload}
        onCancel={() => setShowCancelDialog(false)}
      />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Upload Meeting</h1>
        <p className="mt-2 text-muted-foreground">
          Upload an audio recording, video file, or plain-text transcript — Whisper will transcribe
          audio/video, then Grok will summarise the meeting and extract action items.
        </p>
      </div>

      {/* Meeting Title */}
      <Card className="p-6">
        <label className="block mb-2 font-semibold">Meeting Title</label>
        <Input
          type="text"
          placeholder="e.g., Sprint Planning Meeting - Q1 2025"
          value={meetingTitle}
          onChange={(e) => setMeetingTitle(e.target.value)}
          disabled={uploadState.uploading}
        />
      </Card>

      {/* File Upload Area */}
      <Card className="p-6">
        <div
          className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            dragActive ? 'border-primary bg-primary/5' : 'border-gray-300'
          } ${uploadState.uploading ? 'opacity-50 pointer-events-none' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={acceptedExtensions}
            onChange={handleFileInput}
            disabled={uploadState.uploading}
          />

          {!uploadState.file ? (
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold mb-1">
                  Drag and drop your file here
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to browse
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadState.uploading}
                >
                  Select File
                </Button>
              </div>
              {/* Format chips */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex flex-wrap justify-center gap-2">
                  {['MP3', 'WAV', 'M4A', 'AAC', 'MPEG'].map((fmt) => (
                    <span key={fmt} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-medium">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                      {fmt}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {['MP4', 'MOV', 'AVI'].map((fmt) => (
                    <span key={fmt} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-medium">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                      </svg>
                      {fmt}
                    </span>
                  ))}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    TXT
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Max 25 MB &nbsp;·&nbsp; Audio &amp; Video transcribed via Whisper</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
                getFileCategory(uploadState.file) === 'audio'
                  ? 'bg-blue-100'
                  : getFileCategory(uploadState.file) === 'video'
                  ? 'bg-purple-100'
                  : 'bg-gray-100'
              }`}>
                {getFileCategory(uploadState.file) === 'audio' ? (
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                ) : getFileCategory(uploadState.file) === 'video' ? (
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
              </div>
              <div>
                <p className="font-semibold">{uploadState.file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(uploadState.file.size)}
                  {getFileCategory(uploadState.file) !== 'text' && (
                    <span className="ml-2 text-xs text-primary font-medium">
                      Will be transcribed with Whisper
                    </span>
                  )}
                </p>
              </div>
              {!uploadState.uploading && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFile}
                >
                  Change File
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {uploadState.uploading && (
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                {uploadState.file && getFileCategory(uploadState.file) !== 'text'
                  ? 'Uploading & transcribing with Whisper…'
                  : 'Uploading…'}
              </span>
              <span>{Math.round(uploadState.progress)}%</span>
            </div>
            <Progress value={uploadState.progress} />
          </div>
        )}

        {/* Error Message */}
        {uploadState.error && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive rounded-lg">
            <p className="text-sm text-destructive">{uploadState.error}</p>
          </div>
        )}
      </Card>

      {/* Success Banner — shown after upload completes */}
      {uploadState.exportUrl && uploadState.meetingId && (
        <Card className="p-6 bg-green-50 dark:bg-green-900/20 border-green-400">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="font-semibold text-green-800 dark:text-green-200">
                Meeting processed successfully!
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Your meeting has been transcribed, summarised by Grok, and action items have been extracted.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={() => handleExcelDownload(uploadState.exportUrl!, meetingTitle)}
                  disabled={downloading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-medium rounded-md transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {downloading ? 'Downloading…' : 'Download Tasks (Excel)'}
                </button>
                <button
                  onClick={() => navigate(`/dashboard/meetings/${uploadState.meetingId}`)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium rounded-md transition-colors"
                >
                  View Meeting Details
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:underline"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Processing Information */}
      <Card className="p-6 bg-blue-100 dark:bg-blue-500/20 border-blue-400">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          What happens next?
        </h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <li className="flex items-start">
            <span className="mr-2">1.</span>
            <span>Audio &amp; video files are transcribed automatically using OpenAI Whisper (max 25 MB)</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">2.</span>
            <span>Grok AI summarises the transcript and extracts key decisions and discussion points</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">3.</span>
            <span>Action items are identified with assignees, due dates, and priority levels</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">4.</span>
            <span>Download the extracted tasks as an Excel spreadsheet once processing is complete</span>
          </li>
        </ul>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard')}
          disabled={uploadState.uploading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          disabled={!uploadState.file || uploadState.uploading || !meetingTitle.trim()}
        >
          {uploadState.uploading ? 'Uploading...' : 'Upload & Process'}
        </Button>
      </div>
    </div>
  );
};

export default Upload;
