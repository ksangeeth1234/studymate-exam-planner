import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Play,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Edit3,
  Save,
  AlertCircle,
  FileText
} from 'lucide-react';
import { StudySession, Subject } from '../types';
import { formatDateKey, parseDateKey } from '../utils/scheduler';

interface Props {
  selectedDateStr: string;
  onSelectDate: (dateStr: string) => void;
  sessions: StudySession[];
  subjects: Subject[];
  onStartSession: (session: StudySession) => void;
  onUpdateSessionStatus: (sessionId: string, status: StudySession['status'], actualMinutes?: number) => void;
  onUpdateSessionSubject: (sessionId: string, newSubjectId: string) => void;
  onUpdateSessionNotes: (sessionId: string, notes: string) => void;
}

export const TodayPage: React.FC<Props> = ({
  selectedDateStr,
  onSelectDate,
  sessions,
  subjects,
  onStartSession,
  onUpdateSessionStatus,
  onUpdateSessionSubject,
  onUpdateSessionNotes,
}) => {
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState<string>('');

  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>();
    subjects.forEach(s => map.set(s.id, s));
    return map;
  }, [subjects]);

  const currentDateObj = useMemo(() => parseDateKey(selectedDateStr), [selectedDateStr]);

  const daySessions = useMemo(() => {
    return sessions
      .filter(s => s.date === selectedDateStr)
      .sort((a, b) => a.slotIndex - b.slotIndex);
  }, [sessions, selectedDateStr]);

  const morningSessions = useMemo(() => daySessions.filter(s => s.period === 'morning'), [daySessions]);
  const nightSessions = useMemo(() => daySessions.filter(s => s.period === 'night'), [daySessions]);

  const completedCount = daySessions.filter(s => s.status === 'completed').length;
  const skippedCount = daySessions.filter(s => s.status === 'skipped').length;
  const rescheduledCount = daySessions.filter(s => s.status === 'rescheduled').length;
  const remainingCount = daySessions.filter(s => s.status === 'scheduled' || s.status === 'in_progress').length;

  const navigateDay = (offset: number) => {
    const next = new Date(currentDateObj);
    next.setDate(next.getDate() + offset);
    onSelectDate(formatDateKey(next));
  };

  const formattedHeaderDate = currentDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const handleStartEditNotes = (session: StudySession) => {
    setEditingNotesId(session.id);
    setTempNotes(session.notes || '');
  };

  const handleSaveNotes = (sessionId: string) => {
    onUpdateSessionNotes(sessionId, tempNotes);
    setEditingNotesId(null);
  };

  const renderSessionCard = (session: StudySession) => {
    const subj = subjectMap.get(session.subjectId);
    const isDone = session.status === 'completed';
    const isSkipped = session.status === 'skipped';
    const isRescheduled = session.status === 'rescheduled';
    const isEditingThisNotes = editingNotesId === session.id;

    return (
      <div
        key={session.id}
        className={`rounded-2xl p-5 border transition-all ${
          isDone
            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
            : isSkipped
            ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/50 opacity-75'
            : isRescheduled
            ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50'
            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:shadow-md'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Slot time & badge */}
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-mono text-xs font-bold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{session.displayTime}</span>
            </div>

            <span
              className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                isDone
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : isSkipped
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  : isRescheduled
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {session.status.replace('_', ' ')}
            </span>
          </div>

          {/* Subject Switcher Dropdown (Allows manually changing subject) */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 font-medium">Subject:</label>
            <select
              value={session.subjectId}
              onChange={(e) => onUpdateSessionSubject(session.id, e.target.value)}
              className="text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code}) {s.isDifficult ? '★' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Subject Information */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-purple-600 dark:text-purple-400">
                {subj?.code || 'SUBJ'}
              </span>
              <span className="text-base font-extrabold text-slate-900 dark:text-white">
                {subj?.name}
              </span>
              {subj?.isDifficult && (
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                  Marked Difficult
                </span>
              )}
              {session.isRevision && (
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  Revision
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Prep level: <strong className="capitalize">{subj?.preparationLevel.replace('_', ' ')}</strong> • Target: 60 mins focus
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onStartSession(session)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Study Session</span>
            </button>

            <button
              onClick={() => onUpdateSessionStatus(session.id, isDone ? 'scheduled' : 'completed', isDone ? 0 : 60)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                isDone
                  ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                  : 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isDone ? 'Completed' : 'Mark Done'}</span>
            </button>

            <button
              onClick={() => onUpdateSessionStatus(session.id, isSkipped ? 'scheduled' : 'skipped', 0)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition border ${
                isSkipped
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50'
              }`}
              title="Skip this session"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>{isSkipped ? 'Skipped' : 'Skip'}</span>
            </button>

            <button
              onClick={() => onUpdateSessionStatus(session.id, isRescheduled ? 'scheduled' : 'rescheduled', 0)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition border ${
                isRescheduled
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/60 hover:bg-amber-50'
              }`}
              title="Reschedule this session"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reschedule</span>
            </button>
          </div>
        </div>

        {/* Study Notes Section */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          {isEditingThisNotes ? (
            <div className="space-y-2">
              <textarea
                value={tempNotes}
                onChange={(e) => setTempNotes(e.target.value)}
                placeholder="What did you study during this hour? (e.g. Completed Chapter 4 exercises, reviewed lecture slides)..."
                rows={2}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-purple-300 dark:border-purple-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setEditingNotesId(null)}
                  className="px-2.5 py-1 text-xs rounded-lg text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveNotes(session.id)}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                >
                  <Save className="w-3 h-3" />
                  <span>Save Notes</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2">
              <div className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  {session.notes ? (
                    <span className="italic text-slate-700 dark:text-slate-300">{session.notes}</span>
                  ) : (
                    <span className="text-slate-400">No session notes recorded yet.</span>
                  )}
                </span>
              </div>
              <button
                onClick={() => handleStartEditNotes(session)}
                className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 flex items-center gap-1 shrink-0"
              >
                <Edit3 className="w-3 h-3" />
                <span>{session.notes ? 'Edit Notes' : 'Add Notes'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Date Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              {formattedHeaderDate}
            </h2>
            <p className="text-xs text-slate-500">
              6 daily study sessions • Fixed timetable schedule
            </p>
          </div>
        </div>

        {/* Date Stepper Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateDay(-1)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="date"
            value={selectedDateStr}
            onChange={(e) => e.target.value && onSelectDate(e.target.value)}
            className="text-xs font-bold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          <button
            onClick={() => navigateDay(1)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 text-center">
          <span className="text-[11px] uppercase font-bold text-emerald-700 dark:text-emerald-400">Completed</span>
          <p className="text-2xl font-black text-emerald-800 dark:text-emerald-300 mt-0.5">{completedCount} / 6</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/60 text-center">
          <span className="text-[11px] uppercase font-bold text-purple-700 dark:text-purple-400">Remaining</span>
          <p className="text-2xl font-black text-purple-800 dark:text-purple-300 mt-0.5">{remainingCount} / 6</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/60 text-center">
          <span className="text-[11px] uppercase font-bold text-rose-700 dark:text-rose-400">Skipped</span>
          <p className="text-2xl font-black text-rose-800 dark:text-rose-300 mt-0.5">{skippedCount}</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 text-center">
          <span className="text-[11px] uppercase font-bold text-amber-700 dark:text-amber-400">Rescheduled</span>
          <p className="text-2xl font-black text-amber-800 dark:text-amber-300 mt-0.5">{rescheduledCount}</p>
        </div>
      </div>

      {daySessions.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Study Sessions On This Date
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            The study plan is configured starting 26 October 2026. Use the controls above to navigate to an active study date.
          </p>
          <button
            onClick={() => onSelectDate('2026-10-26')}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-purple-600 text-white hover:bg-purple-700"
          >
            Jump to 26 October 2026
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Morning Block */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs font-extrabold uppercase tracking-wider">
                🌅 Morning Session (3:00 AM – 5:00 AM)
              </span>
              <span className="text-xs text-slate-400 font-medium">2 one-hour sessions</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {morningSessions.map(renderSessionCard)}
            </div>
          </div>

          {/* Night Block */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 text-xs font-extrabold uppercase tracking-wider">
                🌙 Night Session (8:00 PM – 12:00 AM)
              </span>
              <span className="text-xs text-slate-400 font-medium">4 one-hour sessions</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {nightSessions.map(renderSessionCard)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
