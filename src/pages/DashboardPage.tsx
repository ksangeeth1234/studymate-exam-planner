import React, { useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  ArrowRight,
  Sparkles,
  Trophy,
  Flame,
  Check,
  RotateCcw,
  SkipForward
} from 'lucide-react';
import { StudySession, Subject, ExamDate, AppSettings } from '../types';
import { MOTIVATIONAL_QUOTES } from '../utils/constants';
import { parseDateKey } from '../utils/scheduler';

interface Props {
  currentDateStr: string;
  sessions: StudySession[];
  subjects: Subject[];
  exams: ExamDate[];
  appSettings: AppSettings;
  onStartSession: (session: StudySession) => void;
  onUpdateSessionStatus: (sessionId: string, status: StudySession['status'], actualMinutes?: number) => void;
  onNavigateToPage: (page: any) => void;
  onSelectDate: (dateStr: string) => void;
}

export const DashboardPage: React.FC<Props> = ({
  currentDateStr,
  sessions,
  subjects,
  exams,
  appSettings,
  onStartSession,
  onUpdateSessionStatus,
  onNavigateToPage,
  onSelectDate,
}) => {
  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>();
    subjects.forEach(s => map.set(s.id, s));
    return map;
  }, [subjects]);

  // Today's sessions
  const todaySessions = useMemo(() => {
    return sessions.filter(s => s.date === currentDateStr).sort((a, b) => a.slotIndex - b.slotIndex);
  }, [sessions, currentDateStr]);

  // Statistics for today
  const plannedHoursToday = todaySessions.length; // 6
  const completedTodaySessions = todaySessions.filter(s => s.status === 'completed');
  const completedHoursToday = completedTodaySessions.reduce((acc, s) => acc + (s.actualMinutes || 60), 0) / 60;
  const remainingTodaySessions = todaySessions.filter(s => s.status === 'scheduled' || s.status === 'in_progress');
  const dailyProgressPercent = plannedHoursToday > 0 ? Math.round((completedTodaySessions.length / plannedHoursToday) * 100) : 0;

  // Overall preparation statistics
  const totalSessionsAll = sessions.length;
  const totalCompletedAll = sessions.filter(s => s.status === 'completed').length;
  const overallProgressPercent = totalSessionsAll > 0 ? Math.round((totalCompletedAll / totalSessionsAll) * 100) : 0;

  // Days remaining until exam period (e.g. 23 Nov 2026)
  const examPeriodDate = parseDateKey(appSettings.examPeriodStart);
  const currentDateObj = parseDateKey(currentDateStr);
  const diffTime = examPeriodDate.getTime() - currentDateObj.getTime();
  const daysUntilExams = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Current Streak calculation
  const streak = useMemo(() => {
    const datesWithCompleted = new Set(
      sessions.filter(s => s.status === 'completed').map(s => s.date)
    );
    let count = 0;
    const testDate = new Date(currentDateObj);
    while (true) {
      const key = `${testDate.getFullYear()}-${String(testDate.getMonth() + 1).padStart(2, '0')}-${String(testDate.getDate()).padStart(2, '0')}`;
      if (datesWithCompleted.has(key)) {
        count++;
        testDate.setDate(testDate.getDate() - 1);
      } else {
        break;
      }
    }
    return count;
  }, [sessions, currentDateObj]);

  // Next upcoming session
  const nextSession = useMemo(() => {
    return todaySessions.find(s => s.status === 'scheduled' || s.status === 'in_progress');
  }, [todaySessions]);

  // Motivational message for today
  const dailyQuote = useMemo(() => {
    const dayNum = currentDateObj.getDate() + currentDateObj.getMonth() * 31;
    return MOTIVATIONAL_QUOTES[dayNum % MOTIVATIONAL_QUOTES.length];
  }, [currentDateObj]);

  // Human readable day string
  const formattedToday = useMemo(() => {
    return currentDateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }, [currentDateObj]);

  return (
    <div className="space-y-6">
      {/* Top Banner: Date, Streak, Motivational Quote */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-700 via-purple-600 to-indigo-700 text-white p-6 sm:p-8 shadow-xl shadow-purple-600/15">
        <div className="absolute top-0 right-0 -translate-y-8 translate-x-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Daily Target: 6 Hours
              </span>
              {streak > 0 && (
                <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-900 text-xs font-extrabold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  {streak} Day Streak
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {formattedToday}
            </h2>
            <p className="text-purple-100 text-sm italic leading-relaxed pt-1">
              &quot;{dailyQuote}&quot;
            </p>
          </div>

          {/* Days until exams badge */}
          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center shrink-0 min-w-[160px]">
            <p className="text-xs uppercase font-bold text-purple-200 tracking-wider">
              Exam Period Countdown
            </p>
            <div className="text-3xl sm:text-4xl font-black mt-1 text-white">
              {daysUntilExams > 0 ? `${daysUntilExams} Days` : daysUntilExams === 0 ? 'Today!' : 'Exam Period'}
            </div>
            <p className="text-[11px] text-purple-200/90 mt-0.5">
              Target: Late November 2026
            </p>
          </div>
        </div>
      </div>

      {/* Key Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Planned study hours */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Today Planned</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
            {plannedHoursToday}h
          </p>
          <p className="text-xs text-slate-500 mt-1">6 one-hour sessions</p>
        </div>

        {/* Completed hours today */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            {completedHoursToday.toFixed(1)}h
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {completedTodaySessions.length} of {plannedHoursToday} sessions done
          </p>
        </div>

        {/* Remaining sessions */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Remaining Sessions</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
            {remainingTodaySessions.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {remainingTodaySessions.length === 0 ? 'All completed today! 🎉' : 'Keep up the momentum'}
          </p>
        </div>

        {/* Daily Progress */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Daily Goal</span>
            <Trophy className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">
              {dailyProgressPercent}%
            </p>
            <span className="text-xs text-slate-400 font-medium">overall {overallProgressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${dailyProgressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Up Next Study Session Spotlight Card */}
      {nextSession && (
        <div className="rounded-3xl bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-purple-950/40 border-2 border-purple-200 dark:border-purple-800/80 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-600/30">
                <Play className="w-6 h-6 fill-current ml-0.5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                  Next Scheduled Session • {nextSession.displayTime}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {subjectMap.get(nextSession.subjectId)?.name || 'Study Session'}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {nextSession.period === 'morning' ? 'Morning study block (3:00 AM – 5:00 AM)' : 'Night study block (8:00 PM – 12:00 AM)'}
                  {nextSession.isRevision && ' • 🌟 Revision Session'}
                </p>
              </div>
            </div>

            <button
              onClick={() => onStartSession(nextSession)}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md shadow-purple-600/30 transition self-start sm:self-center"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Study Session</span>
            </button>
          </div>
        </div>
      )}

      {/* Today's Timetable Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Today&apos;s Study Schedule
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              6 hours organized into morning (3–5 AM) and night (8–12 AM) periods
            </p>
          </div>

          <button
            onClick={() => onNavigateToPage('today')}
            className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 flex items-center gap-1 group"
          >
            <span>Full Detail View</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
          </button>
        </div>

        {todaySessions.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              No sessions scheduled for this date.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Select 26 October 2026 or adjust start date in Settings.
            </p>
            <button
              onClick={() => onSelectDate('2026-10-26')}
              className="mt-3 px-4 py-2 text-xs font-semibold rounded-xl bg-purple-600 text-white hover:bg-purple-700"
            >
              Jump to Start Date (26 Oct 2026)
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {todaySessions.map(session => {
              const subj = subjectMap.get(session.subjectId);
              const isDone = session.status === 'completed';
              const isSkipped = session.status === 'skipped';
              const isRescheduled = session.status === 'rescheduled';

              return (
                <div
                  key={session.id}
                  className={`rounded-2xl p-4 border transition-all ${
                    isDone
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50'
                      : isSkipped
                      ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40 opacity-70'
                      : isRescheduled
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40'
                      : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                      {session.displayTime}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        isDone
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                          : isSkipped
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                          : isRescheduled
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300'
                      }`}
                    >
                      {session.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="mt-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                        {subj?.code || 'SUBJ'}
                      </span>
                      {subj?.isDifficult && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                          Difficult
                        </span>
                      )}
                      {session.isRevision && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                          Revision
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                      {subj?.name || 'Assigned Subject'}
                    </h4>
                  </div>

                  {/* Quick Card Controls */}
                  <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-1">
                    {!isDone ? (
                      <>
                        <button
                          onClick={() => onStartSession(session)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Start</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onUpdateSessionStatus(session.id, 'completed', 60)}
                            className="p-1.5 text-xs rounded-lg text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-950/60"
                            title="Mark as Complete"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onUpdateSessionStatus(session.id, 'skipped', 0)}
                            className="p-1.5 text-xs rounded-lg text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/60"
                            title="Mark as Skipped"
                          >
                            <SkipForward className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {session.actualMinutes || 60}m studied
                        </span>
                        <button
                          onClick={() => onUpdateSessionStatus(session.id, 'scheduled', 0)}
                          className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-0.5"
                          title="Undo completion"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming Official Exams Banner (if entered) */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              Official Examination Dates
            </h3>
            <p className="text-xs text-slate-500">
              Enter official university dates when announced to see live countdowns
            </p>
          </div>

          <button
            onClick={() => onNavigateToPage('exams')}
            className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700"
          >
            Manage Dates
          </button>
        </div>

        {exams.length === 0 ? (
          <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-dashed border-purple-200 dark:border-purple-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-purple-800 dark:text-purple-300">
                Examination period begins in the last week of November 2026
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                No specific exam dates have been entered yet. You can add them once your university releases the official timetable.
              </p>
            </div>
            <button
              onClick={() => onNavigateToPage('exams')}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-purple-600 text-white hover:bg-purple-700 shrink-0"
            >
              + Add Exam Date
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {exams.map(ex => {
              const subj = subjectMap.get(ex.subjectId);
              const exDate = parseDateKey(ex.examDate);
              const daysLeft = Math.ceil((exDate.getTime() - currentDateObj.getTime()) / (1000 * 60 * 60 * 24));

              return (
                <div
                  key={ex.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                >
                  <div>
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">
                      {ex.examDate} • {ex.startTime}
                    </span>
                    <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                      {subj?.name || 'Exam'}
                    </h5>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 text-xs font-extrabold shrink-0">
                    {daysLeft > 0 ? `${daysLeft}d left` : daysLeft === 0 ? 'Today!' : 'Passed'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
