import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginEnhanced from '../pages/auth/LoginEnhanced';
import authReducer from '@/store/slices/authSlice';
// Create a test store matching the real app's store shape
const createTestStore = () => configureStore({
  reducer: {
    auth: authReducer,
  },
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={createTestStore()}>
        <BrowserRouter>{children}</BrowserRouter>
      </Provider>
    </QueryClientProvider>
  );
}

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
    render(
      <TestWrapper>
        <LoginEnhanced />
      </TestWrapper>
    );

    // The heading is "Welcome back" (the sign-in CTA is a button label)
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('accepts user input', () => {
    const { container } = render(
      <TestWrapper>
        <LoginEnhanced />
      </TestWrapper>
    );

    // Verify the component has input fields
    const inputs = container.querySelectorAll('input');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('renders all form elements', () => {
    render(
      <TestWrapper>
        <LoginEnhanced />
      </TestWrapper>
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
