import { integrationService } from '@/services/integration.service';
import { apiClient } from '@/services/api.client';

jest.mock('@/services/api.client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockPost = apiClient.post as jest.Mock;

const ISO_LOCAL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{2}:\d{2}$/;

describe('integrationService.createEvent', () => {
  beforeEach(() => {
    mockPost.mockReset();
  });

  it('normalises datetime-local input to ISO-8601 (with local offset) before posting', async () => {
    mockPost.mockResolvedValue({ data: { id: 'evt_1' } });

    await integrationService.createEvent({
      title: 'Standup',
      startTime: '2026-08-13T11:30',
      endTime: '2026-08-13T12:00',
      timeZone: 'Asia/Kolkata',
    });

    expect(mockPost).toHaveBeenCalledWith(
      '/calendar/create-event',
      expect.objectContaining({
        title: 'Standup',
        startTime: expect.stringMatching(ISO_LOCAL),
        endTime: expect.stringMatching(ISO_LOCAL),
        timeZone: 'Asia/Kolkata',
      })
    );

    const body = mockPost.mock.calls[0][1];
    // Same instants as the local wall times the user picked — no timezone shift.
    expect(new Date(body.startTime).getTime()).toBe(new Date('2026-08-13T11:30').getTime());
    expect(new Date(body.endTime).getTime()).toBe(new Date('2026-08-13T12:00').getTime());
  });

  it('defaults timeZone to the browser local zone when omitted', async () => {
    mockPost.mockResolvedValue({ data: { id: 'evt_2' } });

    await integrationService.createEvent({
      title: 'Sync',
      startTime: '2026-08-13T09:00',
      endTime: '2026-08-13T09:30',
    });

    const body = mockPost.mock.calls[0][1];
    expect(body.timeZone).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  });

  it('posts to /calendar/create-event and returns the created event', async () => {
    mockPost.mockResolvedValue({ data: { id: 'evt_3', summary: 'Created' } });

    const result = await integrationService.createEvent({
      title: 'One-off',
      startTime: '2026-08-13T10:00',
      endTime: '2026-08-13T10:30',
    });

    expect(mockPost).toHaveBeenCalledWith('/calendar/create-event', expect.any(Object));
    expect(result).toEqual({ id: 'evt_3', summary: 'Created' });
  });
});
