import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppSelector } from '@/store/hooks';
import { authService } from '@/services';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { loginSuccess } from '@/store/slices/authSlice';
import { updateProfileSchema, zodResolver, type SchemaOutput } from '@/lib/validation';
import { User, Mail, Briefcase, Building, Camera, ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GRAD = '#5B3FD6';
const GRAD2 = '#8B5CF6';

type ProfileFormData = SchemaOutput<typeof updateProfileSchema>;

const Profile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: '', email: '' },
  });

  useEffect(() => {
    reset({ name: user?.name || '', email: user?.email || '' });
  }, [user?.name, user?.email, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setProfileMessage(null);
      const response = await authService.updateProfile({
        name: data.name || user?.name || '',
        email: data.email || user?.email || '',
      });
      dispatch(loginSuccess({ user: response.user, token: response.token }));
      setProfileMessage('Profile updated successfully.');
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setProfileMessage(apiError?.response?.data?.message || 'Failed to save profile changes.');
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#FCFBFF' }}>
      {/* Top bar */}
      <div className="border-b border-[#E4E0F5] bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl hover:bg-[rgba(91,63,214,0.06)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#64607A]" />
          </button>
          <h1 className="text-xl font-bold text-[#1D1B22]">Profile</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Avatar section */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg"
                style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})` }}
              >
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border border-[#E4E0F5] shadow-sm flex items-center justify-center hover:bg-[#F8F7FF] transition-colors">
                <Camera className="w-4 h-4 text-[#64607A]" />
              </button>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1D1B22]">{user?.name || 'User'}</h2>
              <p className="text-sm text-[#64607A]">{user?.email || ''}</p>
              <p className="text-xs text-[#64607A] mt-1 capitalize">{user?.subscriptionTier || 'Free'} Plan</p>
            </div>
          </div>
        </Card>

        {/* Personal information */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <User className="w-5 h-5" style={{ color: GRAD }} />
            <h2 className="text-lg font-bold text-[#1D1B22]">Personal Information</h2>
          </div>

          {profileMessage && (
            <div className={`mb-5 rounded-xl px-4 py-3 text-sm ${
              profileMessage.includes('successfully')
                ? 'border border-green-200 bg-green-50 text-green-700'
                : 'border border-red-200 bg-red-50 text-red-600'
            }`}>
              {profileMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="flex items-center gap-2 text-[11px] font-bold text-[#1D1B22] uppercase tracking-widest mb-2">
                <User className="w-3.5 h-3.5 text-[#64607A]" />
                Full Name
              </label>
              <Input
                type="text"
                id="profile-name"
                error={errors.name?.message}
                placeholder="John Smith"
                {...register('name')}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-[11px] font-bold text-[#1D1B22] uppercase tracking-widest mb-2">
                <Mail className="w-3.5 h-3.5 text-[#64607A]" />
                Email Address
              </label>
              <Input
                type="email"
                id="profile-email"
                error={errors.email?.message}
                placeholder="john@example.com"
                {...register('email')}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-[11px] font-bold text-[#1D1B22] uppercase tracking-widest mb-2">
                <Building className="w-3.5 h-3.5 text-[#64607A]" />
                Company
              </label>
              <Input
                type="text"
                id="profile-company"
                placeholder="Acme Inc."
              />
              <p className="mt-1.5 text-xs text-[#64607A]">Company info persistence coming soon</p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-[11px] font-bold text-[#1D1B22] uppercase tracking-widest mb-2">
                <Briefcase className="w-3.5 h-3.5 text-[#64607A]" />
                Job Title
              </label>
              <Input
                type="text"
                id="profile-job"
                placeholder="Product Manager"
              />
              <p className="mt-1.5 text-xs text-[#64607A]">Job title persistence coming soon</p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#E4E0F5]">
              <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
