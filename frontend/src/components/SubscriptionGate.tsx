import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Crown, Star } from 'lucide-react';
import { useSubscription } from '@/hooks/useAuth';

const GRAD = '#5B3FD6';
const GRAD2 = '#8B5CF6';

const TIERS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    icon: Star,
    features: ['5 meetings/month', 'AI summaries', 'Task extraction', 'Excel export'],
    highlight: false,
  },
  {
    name: 'PRO',
    price: '—',
    period: 'admin setup',
    icon: Crown,
    features: ['Unlimited meetings', 'Team collaboration', 'Calendar sync', 'Analytics dashboard'],
    highlight: true,
  },
];

const SubscriptionGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { data: subscription, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-[#5B3FD6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (subscription?.isSubscribed) {
    return <>{children}</>;
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{
      background: 'radial-gradient(ellipse 70% 50% at 15% 5%, rgba(91,63,214,0.07) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 90% 90%, rgba(244,114,182,0.05) 0%, transparent 55%), #FCFBFF'
    }}>
      <div className="max-w-4xl mx-auto p-7">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#E4E0F5] bg-white mb-5"
            style={{ boxShadow: '0 2px 8px rgba(91,63,214,0.08)' }}>
            <Lock size={14} style={{ color: GRAD }} />
            <span className="text-xs font-semibold text-[#64607A]">Pro feature</span>
          </div>
          <h1 className="text-3xl font-bold text-[#1D1B22] mb-3">Upgrade to unlock this feature</h1>
          <p className="text-[#64607A] max-w-lg mx-auto">
            This feature is available on the PRO plan. Upgrade your workspace to access advanced analytics and team collaboration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {TIERS.map((tier) => {
            const Icon = tier.icon;
            return (
              <div key={tier.name}
                className="relative rounded-[20px] p-6 border transition-all"
                style={{
                  background: tier.highlight
                    ? `linear-gradient(135deg, ${GRAD}12 0%, white 60%)`
                    : 'white',
                  borderColor: tier.highlight ? `${GRAD}30` : '#E4E0F5',
                  boxShadow: tier.highlight
                    ? `0 8px 32px ${GRAD}18`
                    : '0 1px 2px rgba(0,0,0,0.04)',
                }}>
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider"
                    style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})` }}>
                    Recommended
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: tier.highlight ? `${GRAD}14` : '#F3EFFE' }}>
                    <Icon size={18} style={{ color: tier.highlight ? GRAD : '#64607A' }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1D1B22]">{tier.name}</h3>
                    <p className="text-xs text-[#64607A]">{tier.price} <span className="text-[#9B97B0]">/{tier.period}</span></p>
                  </div>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-[#64607A]">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: tier.highlight ? `${GRAD}18` : '#EDE9FF' }}>
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1 4L3 6L7 2" stroke={tier.highlight ? GRAD : '#64607A'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                {tier.highlight ? (
                  <button onClick={() => navigate('/dashboard/upgrade')}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                    style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})`, boxShadow: `0 6px 24px ${GRAD}40` }}>
                    Upgrade to PRO <ArrowRight size={14} />
                  </button>
                ) : (
                  <button disabled
                    className="w-full py-3 rounded-xl text-sm font-semibold text-[#64607A] border border-[#E4E0F5] bg-[#F8F7FC]">
                    Current plan
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <button onClick={() => navigate('/dashboard')}
            className="text-sm font-semibold hover:underline transition-colors" style={{ color: GRAD }}>
            Back to dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionGate;
