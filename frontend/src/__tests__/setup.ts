// Frontend test setup
import '@testing-library/jest-dom';

// Polyfill TextEncoder/TextDecoder for jsdom (needed by react-router-dom v7)
if (typeof globalThis.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder as any;
}

// Mock api.config to avoid import.meta.env issues in Jest
jest.mock('@/services/api.config', () => ({
  API_BASE_URL: 'http://localhost:8000/api/v1',
}));

// Mock the auth service
jest.mock('@/services/auth.service', () => ({
  authService: {
    login: jest.fn().mockResolvedValue({ user: { id: '1', email: 'test@test.com' }, token: 'test-token' }),
    register: jest.fn().mockResolvedValue({ user: { id: '1', email: 'test@test.com' }, token: 'test-token' }),
    logout: jest.fn(),
    getProfile: jest.fn().mockResolvedValue({ id: '1', email: 'test@test.com' }),
    updateProfile: jest.fn(),
  },
}));

// Mock the meeting service
jest.mock('@/services/meeting.service', () => ({
  meetingService: {
    getMeetings: jest.fn().mockResolvedValue([]),
    getMeetingById: jest.fn().mockResolvedValue(null),
    createMeeting: jest.fn(),
    updateMeeting: jest.fn(),
    deleteMeeting: jest.fn(),
  },
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() { }
  disconnect() { }
  observe() { }
  takeRecords() {
    return [];
  }
  unobserve() { }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() { }
  disconnect() { }
  observe() { }
  unobserve() { }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;
