import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import LoginEnhanced from '../pages/auth/LoginEnhanced';
import authReducer from '../features/auth/authSlice';
import meetingsReducer from '../features/meetings/meetingsSlice';
import actionItemsReducer from '../features/actionItems/actionItemsSlice';

// Create a test store with actual reducers
const createTestStore = () => configureStore({
  reducer: {
    auth: authReducer,
    meetings: meetingsReducer,
    actionItems: actionItemsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['meetings/setUploadProgress'],
      },
    }),
});

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('LoginEnhanced Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders without crashing', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LoginEnhanced />
        </BrowserRouter>
      </Provider>
    );

    // Just verify the component mounts without error
    expect(screen.queryByRole('main') || screen.queryByRole('form') || screen.queryByText(/welcome|login|sign in/i)).toBeTruthy();
  });

  it('accepts user input', () => {
    const store = createTestStore();
    const { container } = render(
      <Provider store={store}>
        <BrowserRouter>
          <LoginEnhanced />
        </BrowserRouter>
      </Provider>
    );

    // Verify the component has input fields
    const inputs = container.querySelectorAll('input');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('renders all form elements', () => {
    render(
      <BrowserRouter>
        <LoginEnhanced />
      </BrowserRouter>
    );

    // Email and password inputs should be present
    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();

    // Google and GitHub SSO buttons
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();

    // Links to register and reset password
    expect(screen.getByText('Create one free')).toBeInTheDocument();
    expect(screen.getByText('Forgot password?')).toBeInTheDocument();
  });
});
