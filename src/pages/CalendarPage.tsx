import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  GraduationCap,
  Play
} from 'lucide-react';
import { StudySession, Subject, ExamDate, AppSettings } from '../types';
import { formatDateKey, parseDateKey } from '../utils/scheduler';

interface Props {
  currentDateStr: string;
  sessions: StudySession[];
  subjects: Subject[];
  exams: ExamDate[];
  appSettings: AppSettings;
  onSelectDate: (dateStr: string) => void;
  onNavigateToPage: (page: any) => void;
  onAddExamClick: () => void;
}

export const CalendarPage: React.FC<Props> = ({
  currentDateStr,
  sessions,
  subjects,
  exams,
  appSettings,
  onSelectDate,
  onNavigateToPage,
  onAddExamClick,
}) => {
  // Currently displayed year and month (default to November 2026 or October 2026)
  const [viewDate, setViewDate] = useState<Date>(() => {
    return parseDateKey(currentDateStr);
  });

  const [selectedDayModal, setSelectedDayModal] = useState<string | null>(null);

  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>();
    subjects.forEach(s => map.set(s.id, s));
    return map;
  }, [subjects]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-indexed

  // Month navigation
  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const jumpToStartDate = () => {
    setViewDate(parseDateKey(appSettings.startDate));
  };

  // Build calendar matrix
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
    const totalDays = lastDayOfMonth.getDate();

    const cells: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isPrepRange: boolean;
    }[] = [];

    // Prev month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const dateObj = new Date(year, month - 1, d);
      const dateStr = formatDateKey(dateObj);
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === currentDateStr,
        isPrepRange: dateStr >= appSettings.startDate && dateStr <= appSettings.endDate
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(year, month, d);
      const dateStr = formatDateKey(dateObj);
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === currentDateStr,
        isPrepRange: dateStr >= appSettings.startDate && dateStr <= appSettings.endDate
      });
    }

    // Next month padding to complete 35 or 42 cells
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const dateObj = new Date(year, month + 1, d);
      const dateStr = formatDateKey(dateObj);
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === currentDateStr,
        isPrepRange: dateStr >= appSettings.startDate && dateStr <= appSettings.endDate
      });
    }

    return cells;
  }, [year, month, currentDateStr, appSettings.startDate, appSettings.endDate]);

  // Aggregate sessions by date
  const sessionsByDate = useMemo(() => {
    const map: Record<string, StudySession[]> = {};
    for (const s of sessions) {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    }
    return map;
  }, [sessions]);

  // Map exams by date
  const examsByDate = useMemo(() => {
    const map: Record<string, ExamDate[]> = {};
    for (const ex of exams) {
      if (!map[ex.examDate]) map[ex.examDate] = [];
      map[ex.examDate].push(ex);
    }
    return map;
  }, [exams]);

  const monthTitle = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const modalSessions = useMemo(() => {
    if (!selectedDayModal) return [];
    return (sessionsByDate[selectedDayModal] || []).sort((a, b) => a.slotIndex - b.slotIndex);
  }, [selectedDayModal, sessionsByDate]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {monthTitle}
            </h2>
            <button
              onClick={jumpToStartDate}
              className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 hover:bg-purple-200"
            >
              Start Date: 26 Oct 2026
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Preparation Period: 26 Oct 2026 to {appSettings.endDate} • Target: Expected exams late Nov 2026
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={onAddExamClick}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition ml-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Exam Date</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        {/* Day of Week headers */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs uppercase tracking-wider text-slate-400 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
          <div>Sun</div>
        </div>

        {/* Calendar Day Cells */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pt-3">
          {calendarCells.map(cell => {
            const daySessions = sessionsByDate[cell.dateStr] || [];
            const dayExams = examsByDate[cell.dateStr] || [];
            const total = daySessions.length;
            const completed = daySessions.filter(s => s.status === 'completed').length;
            const skipped = daySessions.filter(s => s.status === 'skipped').length;
            const hasIncomplete = total > 0 && completed < total && cell.dateStr <= currentDateStr;

            return (
              <div
                key={cell.dateStr}
                onClick={() => {
                  setSelectedDayModal(cell.dateStr);
                }}
                className={`min-h-[90px] sm:min-h-[110px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  cell.isToday
                    ? 'ring-2 ring-purple-600 bg-purple-50/50 dark:bg-purple-950/30 border-purple-300'
                    : cell.isCurrentMonth
                    ? cell.isPrepRange
                      ? 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-purple-300'
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-60'
                    : 'bg-slate-50/20 dark:bg-slate-950/30 border-transparent opacity-40'
                }`}
              >
                {/* Header row inside day cell */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      cell.isToday
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {dayExams.length > 0 && (
                    <span className="p-1 rounded-md bg-rose-500 text-white text-[9px] font-extrabold flex items-center gap-0.5" title="Exam Scheduled">
                      <GraduationCap className="w-3 h-3" />
                    </span>
                  )}
                </div>

                {/* Body row: study sessions summary */}
                <div className="my-1 space-y-1">
                  {total > 0 ? (
                    <div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                        {completed === total ? (
                          <span className="text-emerald-600 flex items-center gap-0.5 font-extrabold">
                            <CheckCircle2 className="w-3 h-3" /> {completed}/{total}
                          </span>
                        ) : hasIncomplete ? (
                          <span className="text-amber-600 dark:text-amber-400 flex items-center gap-0.5 font-semibold">
                            <AlertCircle className="w-3 h-3" /> {completed}/{total}
                          </span>
                        ) : (
                          <span>{completed}/{total} done</span>
                        )}
                      </div>

                      {/* Micro colored dots for the 6 sessions */}
                      <div className="flex items-center gap-1 mt-1 overflow-hidden">
                        {daySessions.slice(0, 6).map((s, idx) => {
                          const subj = subjectMap.get(s.subjectId);
                          const isDone = s.status === 'completed';
                          return (
                            <div
                              key={idx}
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                isDone ? 'ring-1 ring-emerald-500' : ''
                              }`}
                              style={{ backgroundColor: isDone ? '#10b981' : (subj?.color || '#a855f7') }}
                              title={`${s.displayTime}: ${subj?.code || 'Subj'}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ) : cell.isPrepRange ? (
                    <span className="text-[10px] text-slate-400 italic">No schedule</span>
                  ) : null}
                </div>

                {/* Day footer indicator */}
                <div className="text-[9px] text-slate-400 flex items-center justify-between">
                  {dayExams.length > 0 ? (
                    <span className="text-rose-600 font-extrabold uppercase">Exam Day</span>
                  ) : cell.dateStr === appSettings.startDate ? (
                    <span className="text-purple-600 font-bold">Start Day</span>
                  ) : (
                    <span />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details Modal */}
      {selectedDayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold uppercase text-purple-600">
                  {selectedDayModal}
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Timetable for {selectedDayModal}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDayModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {/* Check if exam on this day */}
            {examsByDate[selectedDayModal]?.length > 0 && (
              <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs uppercase">
                  <GraduationCap className="w-4 h-4" />
                  <span>University Examination Scheduled</span>
                </div>
                {examsByDate[selectedDayModal].map(ex => {
                  const s = subjectMap.get(ex.subjectId);
                  return (
                    <p key={ex.id} className="text-xs font-semibold text-rose-800 dark:text-rose-200 mt-1">
                      {s?.name} ({ex.startTime} – {ex.endTime}) {ex.location ? `• Room: ${ex.location}` : ''}
                    </p>
                  );
                })}
              </div>
            )}

            {/* List of sessions for this day */}
            <div className="mt-4 space-y-2">
              {modalSessions.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  No sessions generated for this date.
                </p>
              ) : (
                modalSessions.map(s => {
                  const subj = subjectMap.get(s.subjectId);
                  const isDone = s.status === 'completed';
                  return (
                    <div
                      key={s.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                    >
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block">
                          {s.displayTime}
                        </span>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {subj?.name}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          isDone
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  onSelectDate(selectedDayModal);
                  setSelectedDayModal(null);
                  onNavigateToPage('today');
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700"
              >
                Open in Today Plan View
              </button>

              <button
                onClick={() => setSelectedDayModal(null)}
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
