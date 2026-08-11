import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { meetingService } from '@/services';
import { Meeting } from '@/types';
import { Activity, ArrowRight, CheckCircle2, Clock3, FileText, Sparkles, Wand2 } from 'lucide-react';

const Processing: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { id: 1, name: 'Uploading', description: 'Uploading meeting file to cloud storage' },
    { id: 2, name: 'Transcribing', description: 'Converting audio to text with AI' },
    { id: 3, name: 'Speaker Detection', description: 'Identifying and attributing speakers' },
    { id: 4, name: 'Summarizing', description: 'Extracting key points and decisions' },
    { id: 5, name: 'Tasks', description: 'Detecting tasks and assignments' },
    { id: 6, name: 'Finalizing', description: 'Preparing your meeting summary' },
  ];

  const activeStep = currentStep < steps.length ? steps[currentStep] : null;
  const completedCount = Math.min(currentStep, steps.length);
  const completionPercent = Math.round(progress);

  const checkMeetingStatus = useCallback(async () => {
    if (!id) return;

    try {
      const meetingData = await meetingService.getMeetingById(id);
      setMeeting(meetingData);

      if (meetingData.status === 'completed') {
        setProgress(100);
        setCurrentStep(6);
        setTimeout(() => {
          navigate(`/dashboard/meetings/${id}`);
        }, 2000);
      } else if (meetingData.status === 'failed') {
        console.error('Processing failed');
      }
    } catch (error) {
      console.error('Failed to check meeting status:', error);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (id) {
      checkMeetingStatus();
      const interval = setInterval(checkMeetingStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [id, checkMeetingStatus]);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 5;
      });
    }, 500);

    return () => clearInterval(progressInterval);
  }, []);

  useEffect(() => {
    const step = Math.min(Math.floor(progress / 16.67), 5);
    setCurrentStep(step);
  }, [progress]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300 shadow-sm backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" />
          Live processing
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Processing Your Meeting
        </h1>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          {meeting?.title || 'Your meeting is being analyzed'}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.95fr)]">
        {/* Progress Card */}
        <Card className="overflow-hidden border-white/10 bg-white/[0.03] shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-r from-purple-950/50 via-violet-900/30 to-indigo-950/30 p-5 sm:p-6">
            <div className="absolute -left-12 top-0 h-28 w-28 rounded-full bg-purple-500/20 blur-3xl" />
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-cyan-500/15 blur-3xl" />

            <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-200">
                  <Activity className="h-3.5 w-3.5" />
                  {activeStep ? activeStep.name : 'Finalizing'}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] shadow-sm">
                    <LoadingSpinner size="lg" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                      {currentStep < steps.length ? steps[currentStep].name : 'Complete!'}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                      {currentStep < steps.length
                        ? steps[currentStep].description
                        : 'Redirecting to your meeting...'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 md:min-w-[280px]">
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 shadow-sm backdrop-blur">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                    Progress
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-white">{completionPercent}%</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 shadow-sm backdrop-blur">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                    Stages
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-white">{completedCount}/6</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 shadow-sm backdrop-blur">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                    State
                  </div>
                  <div className="mt-2 text-sm font-semibold text-cyan-300">
                    {currentStep < steps.length ? 'Working' : 'Ready'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-white">Progress</span>
                <span className="font-semibold text-cyan-300">{completionPercent}%</span>
              </div>
              <Progress value={progress} indicatorClassName="bg-gradient-to-r from-primary via-purple-500 to-cyan-400" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {steps.map((step, index) => {
                const isComplete = index < currentStep;
                const isActive = index === currentStep && currentStep < steps.length;

                return (
                  <div
                    key={step.id}
                    className={`rounded-2xl border p-4 transition-all ${
                      isActive
                        ? 'border-white/20 bg-white/[0.08] shadow-sm'
                        : isComplete
                        ? 'border-white/10 bg-white/[0.05]'
                        : 'border-white/[0.05] bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          isComplete
                            ? 'bg-primary text-white'
                            : isActive
                            ? 'bg-white/[0.08] text-cyan-200'
                            : 'bg-white/[0.03] text-white/40'
                        }`}
                      >
                        {isComplete ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : isActive ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <span className="text-sm font-semibold">{step.id}</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-foreground">{step.name}</h3>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                              isComplete
                                ? 'bg-white/[0.08] text-cyan-200'
                                : isActive
                                ? 'bg-primary text-white'
                                : 'bg-white/[0.03] text-white/40'
                            }`}
                          >
                            {isComplete ? 'Complete' : isActive ? 'Working now' : 'Queued'}
                          </span>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.description}</p>

                        {isActive && (
                          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-primary to-cyan-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Status Card */}
        <Card className="overflow-hidden border-white/10 bg-white/[0.03] shadow-[0_18px_52px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          <div className="border-b border-white/10 bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-900 p-5 text-white">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90">
              <Wand2 className="h-3.5 w-3.5" />
              Processing pipeline
            </div>
            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold tracking-tight">{activeStep ? activeStep.name : 'Finalizing'}</h3>
                <p className="mt-2 max-w-sm text-sm text-white/75">
                  The system is moving through the transcript, turning raw conversation into a structured meeting summary.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-3 text-right backdrop-blur">
                <div className="text-2xl font-semibold">{completionPercent}%</div>
                <div className="text-xs uppercase tracking-[0.18em] text-white/70">
                  {currentStep < steps.length ? `${steps.length - currentStep} steps left` : 'Ready'}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-cyan-300">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
                      Input
                    </div>
                    <div className="mt-1 font-semibold text-white">Transcript locked</div>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-cyan-300">
                    <Clock3 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
                      Status
                    </div>
                    <div className="mt-1 font-semibold text-white">
                      {meeting?.status || 'processing'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-cyan-300">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
                      Next
                    </div>
                    <div className="mt-1 font-semibold text-white">Summary delivery</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 shadow-sm">
              <h4 className="font-semibold text-white">What&apos;s happening?</h4>
              <div className="mt-4 space-y-4 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-cyan-300">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <p className="text-white/60">Whisper is converting the meeting audio into a clean transcript with speaker timing preserved.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-cyan-300">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <p className="text-white/60">Speaker turns, decisions, and follow-ups are being grouped into structured notes.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-cyan-300">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <p className="text-white/60">Tasks are being ranked so the most important ones are surfaced first.</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col justify-center gap-4 sm:flex-row">
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard/meetings')}
        >
          View All Meetings
        </Button>
      </div>
    </div>
  );
};

export default Processing;


