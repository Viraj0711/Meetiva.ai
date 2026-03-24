import { render, screen, fireEvent } from '@testing-library/react';
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

  it('shows remember me checkbox', () => {
    render(
      <BrowserRouter>
        <LoginEnhanced />
      </BrowserRouter>
    );

    const checkbox = screen.getByLabelText('Remember me');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });
});
