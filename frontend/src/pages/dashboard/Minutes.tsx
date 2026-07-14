import React, { useState } from 'react';
import { toast } from 'sonner';
import { Search, Clock, Users, ChevronDown, CheckSquare, ScrollText, BookOpen } from 'lucide-react';

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

interface MinutesData {
  id: number;
  title: string;
  date: string;
  duration: string;
  attendees: string[];
  topics: string[];
  summary: string;
  decisions: string[];
  tag: string;
  color: string;
}

const MINUTES_DATA: MinutesData[] = [
  { id: 1, title: 'Q3 Product Planning', date: 'Jul 10, 2026', duration: '52 min', attendees: ['Sarah K.', 'James L.', 'Priya M.'], topics: ['Roadmap prioritization', 'Resource allocation', 'Beta launch timeline'], summary: 'Team aligned on Q3 priorities with the AI features moving to P0. Beta launch confirmed for Aug 15. Three engineers to be reallocated from infra to product.', decisions: ['Ship AI assistant in beta by Aug 15', 'Deprioritize infra refactor to Q4', 'Weekly sync every Monday 10am'], tag: 'Product', color: '#5B3FD6' },
  { id: 2, title: 'Design System Review', date: 'Jul 9, 2026', duration: '38 min', attendees: ['Ana C.', 'Tom R.'], topics: ['Component audit', 'Typography scale', 'Dark mode tokens'], summary: 'Completed audit of 42 components. Typography scale updated to 8-point grid. Dark mode tokens defined and ready for handoff to engineering.', decisions: ['Adopt 8pt grid system', 'Start dark mode implementation next sprint', 'Archive legacy components'], tag: 'Design', color: '#F472B6' },
  { id: 3, title: 'Weekly Engineering Standup', date: 'Jul 8, 2026', duration: '20 min', attendees: ['James L.', 'Priya M.', 'Dev T.', 'Sam O.'], topics: ['Sprint progress', 'Blockers', 'Deployment schedule'], summary: 'Sprint at 70% completion. Two blockers identified related to auth service and were assigned to Dev T. Next deployment scheduled for Thursday.', decisions: ['Auth blocker assigned to Dev T.', 'Deploy on Thursday EOD', 'Add load tests before release'], tag: 'Engineering', color: '#8B5CF6' },
  { id: 4, title: 'Customer Success Sync', date: 'Jul 7, 2026', duration: '45 min', attendees: ['Rachel B.', 'Mark T.', 'Sarah K.'], topics: ['Churn analysis', 'NPS feedback', 'Upsell opportunities'], summary: 'Churn rate down 1.2% this quarter. Key NPS feedback points to onboarding friction. Three enterprise accounts flagged as upsell-ready.', decisions: ['Redesign onboarding flow by end of July', 'Schedule QBRs with top 5 accounts', 'Create upsell playbook'], tag: 'Customer', color: '#059669' },
];

const DashboardMinutes: React.FC = () => {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<number | null>(1);

  const filtered = MINUTES_DATA.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.tag.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto" style={MESH_BG}>
      <div className="max-w-[860px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="text-xl font-bold text-[#1D1B22] tracking-tight">Minutes of Meeting</h1>
            <p className="text-sm font-normal text-[#64607A] mt-1">AI-generated meeting minutes, decisions, and summaries.</p>
          </div>
          <button onClick={() => toast.success('Export started', { description: 'Your minutes will be ready shortly.' })}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})`, boxShadow: `0 4px 16px rgba(91,63,214,0.30)` }}>
            <BookOpen size={13} /> Export All
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64607A]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search meetings or topics..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-[#1D1B22] outline-none transition-all"
            style={{ background: 'white', border: '1px solid rgba(91,63,214,0.14)', boxShadow: CARD_SHADOW }}
          />
        </div>

        {/* Minutes list */}
        <div className="space-y-3">
          {filtered.map(m => {
            const open = expanded === m.id;
            return (
              <div key={m.id}
                className="rounded-2xl overflow-hidden bg-white transition-all"
                style={{ border: `1px solid ${open ? `${m.color}28` : 'rgba(91,63,214,0.10)'}`, boxShadow: open ? CARD_SHADOW_HOVER : CARD_SHADOW }}>
                <button className="w-full flex items-center gap-4 px-5 py-4 text-left" onClick={() => setExpanded(open ? null : m.id)}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[15px] font-bold text-[#1D1B22] truncate">{m.title}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white flex-shrink-0" style={{ background: m.color }}>{m.tag}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[12px] text-[#64607A]">
                      <span>{m.date}</span><span>·</span><Clock size={11} /><span>{m.duration}</span><span>·</span><Users size={11} /><span>{m.attendees.length} attendees</span>
                    </div>
                  </div>
                  <ChevronDown size={16} className={`text-[#64607A] flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>

                {open && (
                  <div className="px-5 pb-5 space-y-4 border-t border-[#F0EDF9]">
                    <div className="pt-4">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-[#64607A] mb-2">Topics Discussed</p>
                      <div className="flex flex-wrap gap-1.5">
                        {m.topics.map(t => (
                          <span key={t} className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-[#5B3FD6]" style={{ background: 'rgba(91,63,214,0.08)' }}>{t}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-[#64607A] mb-2">AI Summary</p>
                      <p className="text-sm text-[#1D1B22] leading-relaxed">{m.summary}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-[#64607A] mb-2">Key Decisions</p>
                      <ul className="space-y-1.5">
                        {m.decisions.map(d => (
                          <li key={d} className="flex items-start gap-2 text-sm text-[#1D1B22]">
                            <CheckSquare size={14} className="flex-shrink-0 mt-0.5" style={{ color: m.color }} />{d}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5">
                        {m.attendees.map((a, i) => (
                          <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white"
                            style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})`, marginLeft: i > 0 ? -8 : 0 }}>
                            {a.split(' ').map(x => x[0]).join('')}
                          </div>
                        ))}
                        <span className="text-xs text-[#64607A] ml-2">{m.attendees.join(', ')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toast.success('Copied to clipboard')}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-[#5B3FD6] transition-all" style={{ background: 'rgba(91,63,214,0.08)' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(91,63,214,0.14)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(91,63,214,0.08)'; }}>
                          Copy
                        </button>
                        <button onClick={() => toast.success('Exported as PDF')}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white transition-all"
                          style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})` }}>
                          Export
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: `linear-gradient(135deg, ${GRAD}18, ${GRAD2}18)` }}>
                <ScrollText size={22} style={{ color: GRAD }} />
              </div>
              <div className="text-base font-bold text-[#1D1B22] mb-1">No minutes found</div>
              <p className="text-sm text-[#64607A]">Try a different search or upload a meeting to generate minutes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardMinutes;
