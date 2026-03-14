import { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { registerAsync } from '@/store/slices/authSlice';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Shield,
  Chrome,
  Github
} from 'lucide-react';
import AnimatedBackground from '@/components/AnimatedBackground';
import GradientOrbs from '@/components/GradientOrbs';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  acceptTerms?: string;
  general?: string;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

const RegisterEnhanced = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateName = (name: string): string | undefined => {
    if (!name.trim()) return 'Name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    if (name.trim().length > 50) return 'Name must be less than 50 characters';
    if (!/^[a-zA-Z\s'-]+$/.test(name)) return 'Name contains invalid characters';
    return undefined;
  };

  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return undefined;
  };

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    if (score === 0 || score === 1) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score === 2 || score === 3) return { score, label: 'Fair', color: 'bg-amber-500' };
    if (score === 4) return { score, label: 'Good', color: 'bg-blue-500' };
    return { score, label: 'Strong', color: 'bg-green-500' };
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/(?=.*[a-z])/.test(password)) return 'Password must contain a lowercase letter';
    if (!/(?=.*[A-Z])/.test(password)) return 'Password must contain an uppercase letter';
    if (!/(?=.*\d)/.test(password)) return 'Password must contain a number';
    if (!/(?=.*[!@#$%^&*])/.test(password)) return 'Password must contain a special character (!@#$%^&*)';
    return undefined;
  };

  const validateConfirmPassword = (confirmPassword: string, password: string): string | undefined => {
    if (!confirmPassword) return 'Please confirm your password';
    if (confirmPassword !== password) return 'Passwords do not match';
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    newErrors.name = validateName(formData.name);
    newErrors.email = validateEmail(formData.email);
    newErrors.password = validatePassword(formData.password);
    newErrors.confirmPassword = validateConfirmPassword(formData.confirmPassword, formData.password);

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the Terms and Privacy Policy';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== undefined);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({ ...prev, [name]: newValue }));

    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));

    let error: string | undefined;
    if (field === 'name') error = validateName(formData.name);
    else if (field === 'email') error = validateEmail(formData.email);
    else if (field === 'password') error = validatePassword(formData.password);
    else if (field === 'confirmPassword') error = validateConfirmPassword(formData.confirmPassword, formData.password);

    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      await dispatch(registerAsync({
        name: formData.name,
        email: formData.email,
        password: formData.password
      })).unwrap();

      navigate('/dashboard');
    } catch (error: unknown) {
      const err = error as { message?: string };
      setErrors({
        general: err?.message || 'Registration failed. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialRegister = (provider: string) => {
    console.log(`Register with ${provider}`);
  };

  const passwordStrength = formData.password ? calculatePasswordStrength(formData.password) : null;
  const showPasswordError = touched.password && errors.password;
  const showConfirmPasswordError = touched.confirmPassword && errors.confirmPassword;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 relative overflow-hidden py-8">
      <AnimatedBackground />
      <GradientOrbs />

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Card */}
        <div className="bg-white/90 backdrop-blur-xl border border-blue-100 rounded-2xl shadow-2xl p-6">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Create Account
            </h1>
            <p className="text-sm text-gray-600">
              Join thousands of teams using Meetiva
            </p>
          </div>

          {/* Error Message */}
          {errors.general && (
            <div className="mb-3 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-400">{errors.general}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className={`w-4 h-4 ${errors.name && touched.name ? 'text-red-500' : 'text-gray-400'}`} />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={() => handleBlur('name')}
                  className={`w-full pl-9 pr-9 py-2 text-sm bg-white border ${errors.name && touched.name ? 'border-red-500' : 'border-gray-300'}
                    rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                  placeholder="John Doe"
                  disabled={isLoading}
                />
                {touched.name && !errors.name && formData.name && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </div>
                )}
              </div>
              {touched.name && errors.name && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className={`w-4 h-4 ${errors.email && touched.email ? 'text-red-500' : 'text-gray-400'}`} />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur('email')}
                  className={`w-full pl-9 pr-9 py-2 text-sm bg-white border ${errors.email && touched.email ? 'border-red-500' : 'border-gray-300'}
                    rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                  placeholder="you@example.com"
                  disabled={isLoading}
                />
                {touched.email && !errors.email && formData.email && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </div>
                )}
              </div>
              {touched.email && errors.email && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`w-4 h-4 ${showPasswordError ? 'text-red-500' : 'text-gray-400'}`} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur('password')}
                  className={`w-full pl-9 pr-9 py-2 text-sm bg-white border ${showPasswordError ? 'border-red-500' : 'border-gray-300'}
                    rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {formData.password && passwordStrength && (
                <div className="mt-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs text-gray-500">Strength</span>
                    <span className={`text-xs font-medium ${passwordStrength.label === 'Weak' ? 'text-red-400' :
                        passwordStrength.label === 'Fair' ? 'text-amber-400' :
                          passwordStrength.label === 'Good' ? 'text-blue-400' :
                            'text-green-400'
                      }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {showPasswordError && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`w-4 h-4 ${showConfirmPasswordError ? 'text-red-500' : 'text-gray-400'}`} />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={() => handleBlur('confirmPassword')}
                  className={`w-full pl-9 pr-9 py-2 text-sm bg-white border ${showConfirmPasswordError ? 'border-red-500' : 'border-gray-300'}
                    rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {showConfirmPasswordError && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                  disabled={isLoading}
                />
                <span className="text-xs text-gray-600">
                  I agree to the{' '}
                  <Link to="/terms" className="text-blue-400 hover:text-blue-300 underline">
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-blue-400 hover:text-blue-300 underline">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.acceptTerms}
                </p>
              )}
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>

            {/* Divider */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-gray-500">Or register with</span>
              </div>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSocialRegister('google')}
                className="flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium transition-all duration-200"
              >
                <Chrome className="w-4 h-4" />
                Google
              </button>
              <button
                type="button"
                onClick={() => handleSocialRegister('github')}
                className="flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium transition-all duration-200"
              >
                <Github className="w-4 h-4" />
                GitHub
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-4 text-center">
            <p className="text-gray-600 text-xs">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          {/* Security Badge */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <Shield className="w-3 h-3" />
              <span>Protected by 256-bit SSL encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterEnhanced;
