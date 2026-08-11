import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setMeetingLimitHandler } from '@/services/api.client';

/**
 * Global gate for the free-tier meeting limit.
 *
 * Whenever ANY API call fails with 403 MEETING_LIMIT_REACHED (the backend's
 * monthly meeting cap for FREE accounts), the user is redirected to the
 * upgrade page so they can act on it — instead of each call site having to
 * detect the code itself.
 *
 * The Upload flow is exempt because it talks to the backend through raw
 * `fetch` (not apiClient) and renders its own inline upgrade card.
 *
 * Must be mounted inside the router (it uses useNavigate). Renders nothing.
 */
const MeetingLimitGate: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    setMeetingLimitHandler(() =>
      navigate('/dashboard/upgrade', { state: { reason: 'meeting-limit' } })
    );
    return () => setMeetingLimitHandler(null);
  }, [navigate]);

  return null;
};

export default MeetingLimitGate;
