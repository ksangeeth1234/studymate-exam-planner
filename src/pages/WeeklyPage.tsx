import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
  Play
} from 'lucide-react';
import { StudySession, Subject } from '../types';
import { DAILY_TIME_SLOTS } from '../utils/constants';
import { formatDateKey, parseDateKey } from '../utils/scheduler';

interface Props {
  currentDateStr: string;
  sessions: StudySession[];
  subjects: Subject[];
  onStartSession: (session: StudySession) => void;
  onUpdateSessionStatus: (sessionId: string, status: StudySession['status'], actualMinutes?: number) => void;
  onUpdateSessionSubject: (sessionId: string, newSubjectId: string) => void;
}

export const WeeklyPage: React.FC<Props> = ({
  currentDateStr,
  sessions,
  subjects,
  onStartSession,
  onUpdateSessionStatus,
  onUpdateSessionSubject,
}) => {
  // Currently viewed week starting date
  const [weekStartDate, setWeekStartDate] = useState<Date>(() => {
    const d = parseDateKey(currentDateStr);
    // Find Monday of the week
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  });

  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');
  const [selectedSlotModal, setSelectedSlotModal] = useState<StudySession | null>(null);

  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>();
    subjects.forEach(s => map.set(s.id, s));
    return map;
  }, [subjects]);

  // Compute 7 days of this week
  const weekDays = useMemo(() => {
    const days: { dateStr: string; label: string; fullDate: Date; isToday: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStartDate);
      d.setDate(d.getDate() + i);
      const dateStr = formatDateKey(d);
      days.push({
        dateStr,
        label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        fullDate: d,
        isToday: dateStr === currentDateStr
      });
    }
    return days;
  }, [weekStartDate, currentDateStr]);

  const navigateWeek = (weeks: number) => {
    const next = new Date(weekStartDate);
    next.setDate(next.getDate() + weeks * 7);
    setWeekStartDate(next);
  };

  const jumpToCurrentWeek = () => {
    const d = parseDateKey(currentDateStr);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    setWeekStartDate(new Date(d.setDate(diff)));
  };

  // Build grid map: [dateStr][slotIndex] -> StudySession
  const sessionMatrix = useMemo(() => {
    const matrix: Record<string, Record<number, StudySession>> = {};
    for (const day of weekDays) {
      matrix[day.dateStr] = {};
    }
    for (const s of sessions) {
      if (matrix[s.date]) {
        matrix[s.date][s.slotIndex] = s;
      }
    }
    return matrix;
  }, [sessions, weekDays]);

  const weekRangeTitle = useMemo(() => {
    const start = weekDays[0].label;
    const end = weekDays[6].label;
    return `${start} – ${end}, ${weekDays[0].fullDate.getFullYear()}`;
  }, [weekDays]);

  return (
    <div className="space-y-6">
      {/* Top Controls: Week Navigator + Subject Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              {weekRangeTitle}
            </h2>
            <button
              onClick={jumpToCurrentWeek}
              className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 hover:bg-purple-200"
            >
              Current Week
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Fair rotation of all 8 university subjects across 6 daily sessions (42 sessions/week)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Subject Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Filter className="w-3.5 h-3.5 text-purple-600" />
            <select
              value={filterSubjectId}
              onChange={(e) => setFilterSubjectId(e.target.value)}
              className="bg-transparent border-none text-xs font-bold focus:outline-none"
            >
              <option value="all">All 8 Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigateWeek(-1)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
              title="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigateWeek(1)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
              title="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Subject Color Legend */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 mb-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5 text-purple-600" />
          <span>Subject Color Legend (8 Subjects)</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {subjects.map(s => (
            <div
              key={s.id}
              onClick={() => setFilterSubjectId(filterSubjectId === s.id ? 'all' : s.id)}
              className={`p-2 rounded-xl border cursor-pointer transition text-center ${
                filterSubjectId === s.id
                  ? 'ring-2 ring-purple-500 shadow-sm'
                  : 'hover:opacity-90'
              }`}
              style={{
                backgroundColor: s.color,
                borderColor: s.borderColor
              }}
            >
              <span className="text-[11px] font-black text-slate-800 block truncate">
                {s.code}
              </span>
              <span className="text-[10px] text-slate-600 truncate block">
                {s.name.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Timetable Table Grid (Horizontally scrollable for all screen sizes) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[780px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                <th className="p-3.5 text-xs font-extrabold uppercase tracking-wider text-slate-500 w-36 shrink-0 border-r border-slate-200 dark:border-slate-800">
                  Daily Slot
                </th>
                {weekDays.map(day => (
                  <th
                    key={day.dateStr}
                    className={`p-3.5 text-center border-r last:border-r-0 border-slate-200 dark:border-slate-800 ${
                      day.isToday ? 'bg-purple-50/80 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold">{day.label}</div>
                    {day.isToday && (
                      <span className="inline-block mt-0.5 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-purple-600 text-white">
                        Today
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {DAILY_TIME_SLOTS.map(slot => {
                const isMorningHeader = slot.slotIndex === 0;
                const isNightHeader = slot.slotIndex === 2;

                return (
                  <React.Fragment key={slot.slotIndex}>
                    {isMorningHeader && (
                      <tr className="bg-amber-50/40 dark:bg-amber-950/20">
                        <td
                          colSpan={8}
                          className="px-4 py-1.5 text-[11px] font-extrabold tracking-wider uppercase text-amber-800 dark:text-amber-300"
                        >
                          🌅 Morning Sessions (3:00 AM – 5:00 AM)
                        </td>
                      </tr>
                    )}
                    {isNightHeader && (
                      <tr className="bg-indigo-50/40 dark:bg-indigo-950/20">
                        <td
                          colSpan={8}
                          className="px-4 py-1.5 text-[11px] font-extrabold tracking-wider uppercase text-indigo-800 dark:text-indigo-300"
                        >
                          🌙 Night Sessions (8:00 PM – 12:00 AM)
                        </td>
                      </tr>
                    )}
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3 text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900">
                        <div className="font-bold text-slate-700 dark:text-slate-300">{slot.displayTime}</div>
                        <div className="text-[10px] text-slate-400">Session {slot.slotIndex + 1}</div>
                      </td>

                      {weekDays.map(day => {
                        const session = sessionMatrix[day.dateStr]?.[slot.slotIndex];
                        if (!session) {
                          return (
                            <td
                              key={day.dateStr}
                              className="p-2 border-r last:border-r-0 border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 bg-slate-50/20"
                            >
                              -
                            </td>
                          );
                        }

                        const subj = subjectMap.get(session.subjectId);
                        const isFiltered = filterSubjectId !== 'all' && session.subjectId !== filterSubjectId;
                        const isDone = session.status === 'completed';
                        const isSkipped = session.status === 'skipped';

                        return (
                          <td
                            key={day.dateStr}
                            onClick={() => setSelectedSlotModal(session)}
                            className={`p-2 border-r last:border-r-0 border-slate-200 dark:border-slate-800 cursor-pointer transition ${
                              isFiltered ? 'opacity-25' : 'hover:scale-[1.02]'
                            }`}
                          >
                            <div
                              className="p-2.5 rounded-xl border relative shadow-xs flex flex-col justify-between min-h-[72px]"
                              style={{
                                backgroundColor: isDone ? '#ecfdf5' : isSkipped ? '#fff1f2' : (subj?.color || '#f8fafc'),
                                borderColor: isDone ? '#10b981' : isSkipped ? '#f43f5e' : (subj?.borderColor || '#cbd5e1')
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black text-slate-900 truncate">
                                  {subj?.code || 'SUBJ'}
                                </span>
                                {isDone ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                ) : isSkipped ? (
                                  <span className="text-[9px] font-bold text-rose-600">Skip</span>
                                ) : session.isRevision ? (
                                  <span className="text-[9px] font-extrabold px-1 rounded bg-purple-600 text-white">
                                    Rev
                                  </span>
                                ) : null}
                              </div>

                              <p className="text-[10px] font-semibold text-slate-700 line-clamp-1 mt-1">
                                {subj?.name}
                              </p>

                              <div className="mt-1 flex items-center justify-between text-[9px] text-slate-500">
                                <span className="capitalize">{session.status}</span>
                                {isDone && <span>{session.actualMinutes || 60}m</span>}
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Slot Quick Edit Modal */}
      {selectedSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold uppercase text-purple-600">
                  {selectedSlotModal.date} • {selectedSlotModal.displayTime}
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Edit Study Slot
                </h3>
              </div>
              <button
                onClick={() => setSelectedSlotModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Assigned Subject
                </label>
                <select
                  value={selectedSlotModal.subjectId}
                  onChange={(e) => {
                    onUpdateSessionSubject(selectedSlotModal.id, e.target.value);
                    setSelectedSlotModal({ ...selectedSlotModal, subjectId: e.target.value });
                  }}
                  className="mt-1 w-full text-xs font-bold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}) {s.isDifficult ? '★ Difficult' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Session Status
                </label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {(['scheduled', 'completed', 'skipped'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => {
                        onUpdateSessionStatus(selectedSlotModal.id, st, st === 'completed' ? 60 : 0);
                        setSelectedSlotModal({ ...selectedSlotModal, status: st });
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider capitalize transition border ${
                        selectedSlotModal.status === st
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  const s = selectedSlotModal;
                  setSelectedSlotModal(null);
                  onStartSession(s);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Session Now</span>
              </button>

              <button
                onClick={() => setSelectedSlotModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
