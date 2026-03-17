import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginEnhanced from '../pages/auth/LoginEnhanced';

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

  it('renders login form', () => {
    render(
      <BrowserRouter>
        <LoginEnhanced />
      </BrowserRouter>
    );

    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('validates email format', async () => {
    render(
      <BrowserRouter>
        <LoginEnhanced />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText('you@example.com');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('validates password length', async () => {
    render(
      <BrowserRouter>
        <LoginEnhanced />
      </BrowserRouter>
    );

    const passwordInput = screen.getByPlaceholderText('••••••••');
    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.blur(passwordInput);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });
  });

  it('toggles password visibility', () => {
    render(
      <BrowserRouter>
        <LoginEnhanced />
      </BrowserRouter>
    );

    const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    const toggleButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg')
    );
    
    if (toggleButton) {
      fireEvent.click(toggleButton);
      expect(passwordInput.type).toBe('text');
    }
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
