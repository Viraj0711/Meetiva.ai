import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, Link2, Loader2, PlusCircle, Rocket, Users } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppDispatch } from '@/store/hooks';
import { addToast } from '@/store/slices/uiSlice';
import { calendarService, workspaceService } from '@/services';
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

  const googleConnectionQueryFlag = searchParams.get('googleConnected');

  const upcomingDeadlines = useMemo(
    () => overview.upcomingDeadlines.slice(0, 6),
    [overview.upcomingDeadlines]
  );

  const loadWorkspace = async () => {
    try {
      setLoading(true);
      const [overviewData, status] = await Promise.all([
        workspaceService.getOverview(),
        calendarService.getConnectionStatus(),
      ]);

      setOverview(overviewData);
      setConnection(status);

      if (status.connected) {
        const upcoming = await calendarService.getUpcomingEvents();
        setEvents(upcoming);
      } else {
        setEvents([]);
      }
    } catch (error: any) {
      dispatch(addToast({ type: 'error', message: error.message || 'Failed loading workspace.' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  useEffect(() => {
    if (googleConnectionQueryFlag === '1') {
      dispatch(addToast({ type: 'success', message: 'Google Calendar connected successfully.' }));
      loadWorkspace();
    }
    if (googleConnectionQueryFlag === '0') {
      dispatch(addToast({ type: 'error', message: 'Google Calendar connection failed.' }));
    }
  }, [googleConnectionQueryFlag]);

  const handleConnectGoogle = () => {
    try {
      setIsConnecting(true);
      window.location.href = calendarService.getGoogleConnectUrl();
    } catch (error: any) {
      setIsConnecting(false);
      dispatch(addToast({ type: 'error', message: error.message || 'Unable to start OAuth flow.' }));
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreatingEvent(true);
      await calendarService.createEvent(eventForm);
      dispatch(addToast({ type: 'success', message: 'Event created in Google Calendar.' }));
      setEventForm((prev: CreateCalendarEventRequest) => ({
        ...prev,
        title: '',
        description: '',
        startTime: '',
        endTime: '',
      }));
      const upcoming = await calendarService.getUpcomingEvents();
      setEvents(upcoming);
    } catch (error: any) {
      dispatch(addToast({ type: 'error', message: error.message || 'Event creation failed.' }));
    } finally {
      setIsCreatingEvent(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl bg-gradient-to-r text-emerald-800 to-lime-700 p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold tracking-tight">Team Workspace</h1>
        <p className="mt-2 text-emerald-800">
          Shared execution center for project momentum, deadlines, and calendar coordination.
        </p>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-800" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-5 text-emerald-800">
              <p className="text-sm text-muted-foreground">Team Members</p>
              <div className="mt-2 flex items-center gap-2 text-3xl font-bold text-emerald-800">
                <Users className="h-7 w-7" />
                {overview.teamSize}
              </div>
            </Card>
            <Card className="p-5 border-emerald-200/60">
              <p className="text-sm text-muted-foreground">Cumulative Velocity</p>
              <div className="mt-2 flex items-center gap-2 text-3xl font-bold text-emerald-700">
                <Rocket className="h-7 w-7" />
                {overview.cumulativeVelocity}/week
              </div>
            </Card>
            <Card className="p-5 text-emerald-800">
              <p className="text-sm text-muted-foreground">Google Calendar</p>
              <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
                {connection.connected ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Connected
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
                <Button onClick={handleConnectGoogle} isLoading={isConnecting}>
                  Connect Google Calendar
                </Button>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-3">
                <input
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Event title"
                  value={eventForm.title}
                  onChange={(e) =>
                    setEventForm((prev: CreateCalendarEventRequest) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  disabled={!connection.connected || isCreatingEvent}
                  required
                />
                <textarea
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Description"
                  value={eventForm.description}
                  onChange={(e) =>
                    setEventForm((prev: CreateCalendarEventRequest) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  disabled={!connection.connected || isCreatingEvent}
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    type="datetime-local"
                    className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={eventForm.startTime}
                    onChange={(e) =>
                      setEventForm((prev: CreateCalendarEventRequest) => ({
                        ...prev,
                        startTime: e.target.value,
                      }))
                    }
                    disabled={!connection.connected || isCreatingEvent}
                    required
                  />
                  <input
                    type="datetime-local"
                    className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={eventForm.endTime}
                    onChange={(e) =>
                      setEventForm((prev: CreateCalendarEventRequest) => ({
                        ...prev,
                        endTime: e.target.value,
                      }))
                    }
                    disabled={!connection.connected || isCreatingEvent}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  variant="accent"
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
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3 transition hover:translate-x-1"
                    >
                      <p className="font-medium text-slate-900">{event.summary || 'Untitled event'}</p>
                      <p className="text-xs text-slate-600">
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
                    <div key={item.id} className="rounded-lg border p-3">
                      <div className="flex items-center gap-2 font-medium">
                        <CalendarClock className="h-4 w-4 text-emerald-800" />
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
  );
};

export default Workspace;


