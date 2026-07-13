import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { meetingService } from '@/services';
import { Meeting } from '@/types';

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
    { id: 5, name: 'Action Items', description: 'Detecting tasks and assignments' },
    { id: 6, name: 'Finalizing', description: 'Preparing your meeting summary' },
  ];

  useEffect(() => {
    if (id) {
      checkMeetingStatus();
      const interval = setInterval(checkMeetingStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [id]);

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

  const checkMeetingStatus = async () => {
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
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">Processing Your Meeting</h1>
        <p className="mt-2 text-muted-foreground">
          {meeting?.title || 'Your meeting is being analyzed'}
        </p>
      </div>

      {/* Progress Card */}
      <Card className="p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <LoadingSpinner size="lg" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {currentStep < 6 ? steps[currentStep].name : 'Complete!'}
          </h2>
          <p className="text-muted-foreground">
            {currentStep < 6 ? steps[currentStep].description : 'Redirecting to your meeting...'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center p-4 rounded-lg transition-all ${
                index < currentStep
                  ? 'bg-green-50 border border-green-200'
                  : index === currentStep
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="mr-4">
                {index < currentStep ? (
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : index === currentStep ? (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">{step.id}</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{step.name}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Info Card */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50">
        <h3 className="font-semibold mb-3">What's Happening?</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <svg className="w-5 h-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Our AI is transcribing your meeting with high accuracy using Whisper technology</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Speakers are being identified and their contributions attributed</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Key decisions and discussion points are being extracted</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Action items are being detected with priority levels and sentiment analysis</span>
          </li>
        </ul>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
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
