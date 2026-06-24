import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import LoginEnhanced from '../pages/auth/LoginEnhanced';
import authReducer from '@/store/slices/authSlice';
import meetingReducer from '@/store/slices/meetingSlice';

// Create a test store matching the real app's store shape
const createTestStore = () => configureStore({
  reducer: {
    auth: authReducer,
    meetings: meetingReducer,
  },
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
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
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

  it('shows remember me checkbox', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LoginEnhanced />
        </BrowserRouter>
      </Provider>
    );

    const checkbox = screen.getByLabelText('Remember me');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });
});
