import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Workspace from '@/pages/Workspace';
import uiReducer from '@/store/slices/uiSlice';
import { integrationService } from '@/services';

jest.mock('@/services', () => ({
  integrationService: {
    getConnectionStatus: jest
      .fn()
      .mockResolvedValue({ connected: true, expiryDate: null, updatedAt: null }),
    getUpcomingEvents: jest.fn().mockResolvedValue([]),
    createEvent: jest.fn().mockResolvedValue({ id: 'evt_1' }),
    getGoogleConnectUrl: jest.fn(),
    getGoogleCalendarStatus: jest.fn(),
    getGoogleAuthUrl: jest.fn(),
    disconnectGoogleCalendar: jest.fn(),
    syncMeetingToCalendar: jest.fn(),
  },
  workspaceService: {
    getOverview: jest.fn().mockResolvedValue({
      teamSize: 0,
      cumulativeVelocity: 0,
      ongoingProjects: [],
      upcomingDeadlines: [],
      sharedCalendar: [],
    }),
  },
}));

const createTestStore = () => configureStore({ reducer: { ui: uiReducer } });

const renderWorkspace = () =>
  render(
    <Provider store={createTestStore()}>
      <MemoryRouter initialEntries={['/dashboard/workspace']}>
        <Workspace />
      </MemoryRouter>
    </Provider>
  );

describe('Workspace calendar event form', () => {
  beforeEach(() => {
    (integrationService.createEvent as jest.Mock).mockClear();
  });

  it('submits the picked local time as a valid ISO-8601 datetime', async () => {
    renderWorkspace();
    // Wait until the calendar connection status has loaded (button enabled).
    await screen.findByText('Reconnect Google Calendar');

    fireEvent.change(screen.getByPlaceholderText('Event title'), {
      target: { value: 'Team Sync' },
    });
    fireEvent.change(document.querySelector('input[type="datetime-local"]')!, {
      target: { value: '2026-08-13T11:30' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create event/i }));

    await waitFor(() => expect(integrationService.createEvent).toHaveBeenCalled());

    const payload = (integrationService.createEvent as jest.Mock).mock.calls[0][0];
    expect(payload.title).toBe('Team Sync');
    expect(payload.startTime).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{2}:\d{2}$/
    );
    // The exact instant the user picked locally — no timezone shift.
    expect(new Date(payload.startTime).getTime()).toBe(
      new Date('2026-08-13T11:30').getTime()
    );
  });

  it('shows the ISO-8601 validation error when no appointment time is picked', async () => {
    renderWorkspace();
    await screen.findByText('Reconnect Google Calendar');

    fireEvent.change(screen.getByPlaceholderText('Event title'), {
      target: { value: 'No time' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create event/i }));

    await waitFor(() => {
      expect(screen.getAllByText('Must be an ISO-8601 date').length).toBeGreaterThan(0);
    });
    expect(integrationService.createEvent).not.toHaveBeenCalled();
  });

  it('does not crash when the user clears the picked appointment time', async () => {
    renderWorkspace();
    await screen.findByText('Reconnect Google Calendar');

    const picker = document.querySelector('input[type="datetime-local"]')!;
    // Pick a time first, then clear it — the component must not throw on the
    // Invalid Date path and validation must treat the time as missing.
    fireEvent.change(picker, { target: { value: '2026-08-13T11:30' } });
    fireEvent.change(picker, { target: { value: '' } });

    fireEvent.change(screen.getByPlaceholderText('Event title'), {
      target: { value: 'Cleared time' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create event/i }));

    await waitFor(() => {
      expect(screen.getAllByText('Must be an ISO-8601 date').length).toBeGreaterThan(0);
    });
    expect(integrationService.createEvent).not.toHaveBeenCalled();
  });
});
