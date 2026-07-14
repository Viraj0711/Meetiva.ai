import { render, screen, fireEvent } from '@testing-library/react';
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

    // Just verify the component mounts without error
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
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

  it('shows remember me checkbox', () => {
    render(
      <TestWrapper>
        <LoginEnhanced />
      </TestWrapper>
    );

    const checkbox = screen.getByLabelText('Remember me');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });
});
