import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { CalendarClock, CheckCircle2, Link2, Loader2, PlusCircle, Rocket, Users } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useAppDispatch } from '@/store/hooks';
import { addToast } from '@/store/slices/uiSlice';
import { integrationService, workspaceService } from '@/services';
import { createEventSchema, zodResolver } from '@/lib/validation';
import {
  CalendarConnectionStatus,
  CalendarEvent,
  CreateCalendarEventRequest,
  WorkspaceOverview,
  WorkspaceDeadline,
  WorkspaceProject,
} from '@/types/workspace.types';

const defaultOverview: WorkspaceOverview = {
  teamSize: 0,
  cumulativeVelocity: 0,
  ongoingProjects: [],
  upcomingDeadlines: [],
  sharedCalendar: [],
};

const Workspace: React.FC = () => {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const startTimeInputRef = useRef<HTMLInputElement | null>(null);

  const [overview, setOverview] = useState<WorkspaceOverview>(defaultOverview);
  const [connection, setConnection] = useState<CalendarConnectionStatus>({
    connected: false,
    expiryDate: null,
    updatedAt: null,
  });
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [eventForm, setEventForm] = useState<CreateCalendarEventRequest>({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  });

  type CalendarFormData = {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
  };

  const {
    register,
    handleSubmit: handleEventSubmit,
    formState: { errors: eventErrors },
    reset: resetEventForm,
  } = useForm<CalendarFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: '',
      description: '',
      startTime: '',
      endTime: '',
    },
  });

  const googleConnectionQueryFlag = searchParams.get('googleConnected');

  const upcomingDeadlines = useMemo(
    () => overview.upcomingDeadlines.slice(0, 6),
    [overview.upcomingDeadlines]
  );

  const toLocalDateTimeValue = (date: Date): string => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  };

  const loadWorkspace = useCallback(async () => {
    try {
      setLoading(true);
      const [overviewData, status] = await Promise.all([
        workspaceService.getOverview(),
        integrationService.getConnectionStatus(),
      ]);

      setOverview(overviewData);
      setConnection(status);

      if (status.connected) {
        const upcoming = await integrationService.getUpcomingEvents();
        setEvents(upcoming);
      } else {
        setEvents([]);
      }
    } catch (error: unknown) {
      const apiError = error as { message?: string };
      dispatch(addToast({ type: 'error', message: apiError?.message || 'Failed loading workspace.' }));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    if (googleConnectionQueryFlag === '1') {
      dispatch(addToast({ type: 'success', message: 'Google Calendar connected successfully.' }));
      loadWorkspace();
    }
    if (googleConnectionQueryFlag === '0') {
      dispatch(addToast({ type: 'error', message: 'Google Calendar connection failed.' }));
    }
  }, [googleConnectionQueryFlag, loadWorkspace, dispatch]);

  const handleConnectGoogle = async (forceReconnect = false) => {
    try {
      setIsConnecting(true);
      const authUrl = await integrationService.getGoogleConnectUrl(forceReconnect);
      window.location.href = authUrl;
    } catch (error: unknown) {
      setIsConnecting(false);
      const apiError = error as { message?: string };
      dispatch(addToast({ type: 'error', message: apiError?.message || 'Unable to start OAuth flow.' }));
    }
  };

  const onCreateEvent = async (data: CalendarFormData) => {
    try {
      setIsCreatingEvent(true);
      await integrationService.createEvent(data);
      dispatch(addToast({ type: 'success', message: 'Event created in Google Calendar.' }));
      resetEventForm();
      setEventForm((prev: CreateCalendarEventRequest) => ({
        ...prev,
        title: '',
        description: '',
        startTime: '',
        endTime: '',
      }));
      const upcoming = await integrationService.getUpcomingEvents();
      setEvents(upcoming);
    } catch (error: unknown) {
      const apiError = error as { message?: string };
      dispatch(addToast({ type: 'error', message: apiError?.message || 'Event creation failed.' }));
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const openStartTimePicker = () => {
    const input = startTimeInputRef.current;
    if (!input) return;

    const pickerInput = input as HTMLInputElement & { showPicker?: () => void };
    if (typeof pickerInput.showPicker === 'function') {
      pickerInput.showPicker();
      return;
    }

    input.focus();
    input.click();
  };

  return (
    <div className="flex-1 overflow-y-auto"
      style={{ background: 'radial-gradient(ellipse 70% 50% at 15% 5%, rgba(91,63,214,0.07) 0%, transparent 55%),radial-gradient(ellipse 50% 40% at 90% 90%, rgba(244,114,182,0.05) 0%, transparent 55%),#FCFBFF' }}>
      <div className="max-w-5xl mx-auto p-7">
        <div className="space-y-6">
          <div className="rounded-2xl bg-white border border-[#E4E0F5] p-6" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(91,63,214,0.07), inset 0 1px 0 rgba(255,255,255,0.95)' }}>
            <h1 className="text-3xl font-bold tracking-tight text-[#1D1B22]">Team Workspace</h1>
            <p className="mt-2 text-[#64607A]">
          Shared execution center for project momentum, deadlines, and calendar coordination.
        </p>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#5B3FD6]" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-5">
              <p className="text-sm text-[#64607A]">Team Members</p>
              <div className="mt-2 flex items-center gap-2 text-3xl font-bold text-[#1D1B22]">
                <Users className="h-7 w-7 text-[#5B3FD6]" />
                {overview.teamSize}
              </div>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-[#64607A]">Cumulative Velocity</p>
              <div className="mt-2 flex items-center gap-2 text-3xl font-bold text-[#1D1B22]">
                <Rocket className="h-7 w-7 text-[#5B3FD6]" />
                {overview.cumulativeVelocity}/week
              </div>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-[#64607A]">Google Calendar</p>
              <div className="mt-2 flex items-center gap-2 text-lg font-semibold text-[#1D1B22]">
                {connection.connected ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" /> Connected
                  </>
                ) : (
                  <>
                    <Link2 className="h-5 w-5 text-amber-600" /> Not Connected
                  </>
                )}
              </div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Calendar Integration</h2>
                {!connection.connected ? (
                  <Button className="rounded-full" onClick={() => handleConnectGoogle(false)} isLoading={isConnecting}>
                    Connect Google Calendar
                  </Button>
                ) : (
                  <Button variant="outline" className="rounded-full" onClick={() => handleConnectGoogle(true)} isLoading={isConnecting}>
                    Reconnect Google Calendar
                  </Button>
                )}
              </div>
              <form onSubmit={handleEventSubmit(onCreateEvent)} className="space-y-3">
                <Input
                  id="event-title"
                  placeholder="Event title"
                  error={eventErrors.title?.message}
                  disabled={!connection.connected || isCreatingEvent}
                  {...register('title')}
                />
                <textarea
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Description"
                  disabled={!connection.connected || isCreatingEvent}
                  {...register('description')}
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium">Appointment Time</label>
                  {eventErrors.startTime && (
                    <p className="text-xs text-red-400">{eventErrors.startTime.message}</p>
                  )}
                  <button
                    type="button"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-left text-sm select-none"
                    onClick={openStartTimePicker}
                    disabled={!connection.connected || isCreatingEvent}
                  >
                    {eventForm.startTime
                      ? new Date(eventForm.startTime).toLocaleString()
                      : 'Select date and time'}
                  </button>
                  <input
                    ref={startTimeInputRef}
                    type="datetime-local"
                    className="sr-only"
                    value={eventForm.startTime}
                    onChange={(e) => {
                      const nextStart = e.target.value;
                      const endDate = new Date(nextStart);
                      endDate.setMinutes(endDate.getMinutes() + 30);
                      setEventForm((prev: CreateCalendarEventRequest) => ({
                        ...prev,
                        startTime: nextStart,
                        endTime: toLocalDateTimeValue(endDate),
                      }));
                    }}
                    disabled={!connection.connected || isCreatingEvent}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-full"
                  isLoading={isCreatingEvent}
                  disabled={!connection.connected || isCreatingEvent}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Event
                </Button>
              </form>
            </Card>

            <Card className="p-5">
              <h2 className="mb-4 text-xl font-semibold">Upcoming Google Events</h2>
              <div className="space-y-3">
                {events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No upcoming events found.</p>
                ) : (
                  events.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-lg border border-[#E4E0F5] bg-white p-3 transition hover:translate-x-1"
                    >
                      <p className="font-medium text-[#1D1B22]">{event.summary || 'Untitled event'}</p>
                      <p className="text-xs text-[#64607A]">
                        {event.start?.dateTime || event.start?.date || '-'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="mb-4 text-xl font-semibold">Ongoing Projects</h2>
              <div className="space-y-3">
                {overview.ongoingProjects.slice(0, 6).map((project: WorkspaceProject) => (
                  <div key={project.meetingId} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{project.name}</p>
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">
                        {project.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {project.tasksCompleted} done, {project.tasksOpen} open
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="mb-4 text-xl font-semibold">Upcoming Deadlines</h2>
              <div className="space-y-3">
                {upcomingDeadlines.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No upcoming deadlines in your shared workspace.</p>
                ) : (
                  upcomingDeadlines.map((item: WorkspaceDeadline) => (
                    <div key={item.id} className="rounded-lg border border-[#E4E0F5] p-3">
                      <div className="flex items-center gap-2 font-medium text-[#1D1B22]">
                        <CalendarClock className="h-4 w-4 text-[#5B3FD6]" />
                        {item.title}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Due {new Date(item.dueDate).toLocaleString()} • {item.assignee || 'Unassigned'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </>
      )}
        </div>
      </div>
    </div>
  );
};

export default Workspace;


