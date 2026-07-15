import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Search, Clock, Users, ChevronDown, CheckSquare, ScrollText, BookOpen } from 'lucide-react';
import { meetingService } from '@/services';
import { Meeting, MeetingSummary } from '@/types';
import { getAccessToken } from '@/services/api.client';
import { API_BASE_URL } from '@/services/api.config';

const GRAD = '#5B3FD6';
const GRAD2 = '#8B5CF6';
const CARD_SHADOW = '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(91,63,214,0.07), inset 0 1px 0 rgba(255,255,255,0.95)';
const CARD_SHADOW_HOVER = '0 2px 4px rgba(0,0,0,0.06), 0 12px 36px rgba(91,63,214,0.13), inset 0 1px 0 rgba(255,255,255,1)';
const MESH_BG: React.CSSProperties = {
  background:
    'radial-gradient(ellipse 70% 50% at 15% 5%, rgba(91,63,214,0.07) 0%, transparent 55%),' +
    'radial-gradient(ellipse 50% 40% at 90% 90%, rgba(244,114,182,0.05) 0%, transparent 55%),' +
    '#FCFBFF',
};

const TAG_COLORS = ['#5B3FD6', '#8B5CF6', '#F472B6', '#059669', '#9A6130', '#0EA5E9', '#D946EF', '#EA580C'];

const downloadPDF = async (meetingId: string, title: string) => {
  const token = getAccessToken();
  try {
    const response = await fetch(`${API_BASE_URL}/meetings/${meetingId}/minutes/export`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      toast.error('Failed to download PDF');
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9-_]+/gi, '_').slice(0, 60) || 'meeting'}_minutes.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('PDF downloaded');
  } catch (err) {
    console.error('PDF download failed:', err);
    toast.error('Failed to download PDF');
  }
};

const DashboardMinutes: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [summaries, setSummaries] = useState<Record<string, MeetingSummary | null>>({});
  const [loadingSummaries, setLoadingSummaries] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const result = await meetingService.getMeetings({ limit: 50 });
        setMeetings(result.data || []);
      } catch (err) {
        console.error('Failed to load meetings:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleExpand = async (meetingId: string) => {
    if (expandedId === meetingId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(meetingId);

    if (!(meetingId in summaries)) {
      setLoadingSummaries(prev => ({ ...prev, [meetingId]: true }));
      try {
        const summary = await meetingService.getMeetingSummary(meetingId).catch(() => null);
        setSummaries(prev => ({ ...prev, [meetingId]: summary }));
      } catch (err) {
        console.error('Failed to load summary:', err);
      } finally {
        setLoadingSummaries(prev => ({ ...prev, [meetingId]: false }));
      }
    }
  };

  const filtered = meetings.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    (m.participants || []).some(p => p.toLowerCase().includes(search.toLowerCase()))
  );

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const mins = Math.round(seconds / 60);
    if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    return `${mins}m`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="flex-1 overflow-y-auto" style={MESH_BG}>
      <div className="max-w-[860px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="text-xl font-bold text-[#1D1B22] tracking-tight">Minutes of Meeting</h1>
            <p className="text-sm font-normal text-[#64607A] mt-1">AI-generated meeting minutes, decisions, and summaries.</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64607A]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search meetings or participants..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-[#1D1B22] outline-none transition-all"
            style={{ background: 'white', border: '1px solid rgba(91,63,214,0.14)', boxShadow: CARD_SHADOW }}
          />
        </div>

        {/* Meetings list */}
        <div className="space-y-3">
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: `linear-gradient(135deg, ${GRAD}18, ${GRAD2}18)` }}>
                <ScrollText size={22} style={{ color: GRAD }} />
              </div>
              <div className="text-base font-bold text-[#1D1B22] mb-1">Loading minutes...</div>
            </div>
          ) : filtered.map((m, idx) => {
            const open = expandedId === m.id;
            const summary = summaries[m.id];
            const loadingSumm = loadingSummaries[m.id];
            const color = TAG_COLORS[idx % TAG_COLORS.length];
            return (
              <div key={m.id}
                className="rounded-2xl overflow-hidden bg-white transition-all"
                style={{ border: `1px solid ${open ? `${color}28` : 'rgba(91,63,214,0.10)'}`, boxShadow: open ? CARD_SHADOW_HOVER : CARD_SHADOW }}>
                <button className="w-full flex items-center gap-4 px-5 py-4 text-left" onClick={() => handleExpand(m.id)}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[15px] font-bold text-[#1D1B22] truncate">{m.title}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white flex-shrink-0" style={{ background: color }}>
                        {m.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[12px] text-[#64607A]">
                      <span>{formatDate(m.createdAt)}</span>
                      {formatDuration(m.duration) && <><span>·</span><Clock size={11} /><span>{formatDuration(m.duration)}</span></>}
                      {m.participants && m.participants.length > 0 && <><span>·</span><Users size={11} /><span>{m.participants.length} participants</span></>}
                    </div>
                  </div>
                  <ChevronDown size={16} className={`text-[#64607A] flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>

                {open && (
                  <div className="px-5 pb-5 space-y-4 border-t border-[#F0EDF9]">
                    {loadingSumm ? (
                      <div className="pt-4 text-center text-sm text-[#64607A]">Loading summary...</div>
                    ) : summary ? (
                      <>
                        <div className="pt-4">
                          <p className="text-[11px] font-bold uppercase tracking-widest text-[#64607A] mb-2">Executive Summary</p>
                          <p className="text-sm text-[#1D1B22] leading-relaxed">{summary.executiveSummary}</p>
                        </div>

                        {summary.keyPoints && summary.keyPoints.length > 0 && (
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-[#64607A] mb-2">Topics Discussed</p>
                            <div className="flex flex-wrap gap-1.5">
                              {summary.keyPoints.map((point, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-[#5B3FD6]" style={{ background: 'rgba(91,63,214,0.08)' }}>{point}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {summary.decisions && summary.decisions.length > 0 && (
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-[#64607A] mb-2">Key Decisions</p>
                            <ul className="space-y-1.5">
                              {summary.decisions.map((d, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-[#1D1B22]">
                                  <CheckSquare size={14} className="flex-shrink-0 mt-0.5" style={{ color }} />{d}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {m.participants && m.participants.length > 0 && (
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-[#64607A] mb-2">Attendees</p>
                            <div className="flex items-center gap-1.5">
                              {m.participants.map((p, i) => (
                                <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white"
                                  style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})`, marginLeft: i > 0 ? -8 : 0 }}>
                                  {p.split(' ').map(x => x[0]).join('')}
                                </div>
                              ))}
                              <span className="text-xs text-[#64607A] ml-2">{m.participants.join(', ')}</span>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="pt-4 text-center text-sm text-[#64607A]">
                        {m.status === 'processing' ? 'Summary is being generated...' : 'No summary available yet.'}
                      </div>
                    )}

                    {/* Bottom actions — Download PDF shows only when expanded */}
                    <div className="flex items-center justify-between pt-1">
                      <button onClick={() => navigate(`/dashboard/meetings/${m.id}`)}
                        className="text-[11px] font-semibold text-[#5B3FD6] hover:underline">
                        View full details →
                      </button>
                      <button onClick={() => downloadPDF(m.id, m.title)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white transition-all"
                        style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})` }}>
                        <BookOpen size={12} className="inline mr-1" /> Download PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {!loading && filtered.length === 0 && (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: `linear-gradient(135deg, ${GRAD}18, ${GRAD2}18)` }}>
                <ScrollText size={22} style={{ color: GRAD }} />
              </div>
              <div className="text-base font-bold text-[#1D1B22] mb-1">{search ? 'No minutes found' : 'No meetings yet'}</div>
              <p className="text-sm text-[#64607A]">
                {search ? 'Try a different search.' : 'Upload a meeting to generate minutes.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardMinutes;
