import React, { useMemo } from 'react';
import {
  BarChart3,
  Flame,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { StudySession, Subject } from '../types';

interface Props {
  sessions: StudySession[];
  subjects: Subject[];
  currentDateStr: string;
}

export const ProgressPage: React.FC<Props> = ({
  sessions,
  subjects,
  currentDateStr,
}) => {
  // Aggregate real statistics
  const stats = useMemo(() => {
    let totalScheduled = sessions.length;
    let completed = 0;
    let skipped = 0;
    let rescheduled = 0;
    let totalMinutesStudied = 0;
    let revisionSessionsDone = 0;

    // Per subject aggregation
    const perSubject: Record<string, {
      completedCount: number;
      scheduledCount: number;
      actualMinutes: number;
    }> = {};

    subjects.forEach(s => {
      perSubject[s.id] = { completedCount: 0, scheduledCount: 0, actualMinutes: 0 };
    });

    // Date aggregation for streak and performance
    const dateCompletedMap: Record<string, number> = {};

    for (const session of sessions) {
      if (perSubject[session.subjectId]) {
        perSubject[session.subjectId].scheduledCount++;
      }

      if (session.status === 'completed') {
        completed++;
        const mins = session.actualMinutes || 60;
        totalMinutesStudied += mins;
        if (perSubject[session.subjectId]) {
          perSubject[session.subjectId].completedCount++;
          perSubject[session.subjectId].actualMinutes += mins;
        }
        if (session.isRevision) {
          revisionSessionsDone++;
        }
        dateCompletedMap[session.date] = (dateCompletedMap[session.date] || 0) + 1;
      } else if (session.status === 'skipped') {
        skipped++;
      } else if (session.status === 'rescheduled') {
        rescheduled++;
      }
    }

    // Identify Most and Least Studied Subjects
    const sortedSubjects = [...subjects].sort((a, b) => {
      const aMins = perSubject[a.id]?.actualMinutes || 0;
      const bMins = perSubject[b.id]?.actualMinutes || 0;
      return bMins - aMins;
    });

    const mostStudied = sortedSubjects[0];
    const leastStudied = sortedSubjects[sortedSubjects.length - 1];

    // Compute Streaks
    const sortedDates = Object.keys(dateCompletedMap).sort();
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    // Calculate longest streak across dates
    for (let i = 0; i < sortedDates.length; i++) {
      if (i > 0) {
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      if (tempStreak > maxStreak) maxStreak = tempStreak;
    }

    return {
      totalScheduled,
      completed,
      skipped,
      rescheduled,
      totalHoursStudied: (totalMinutesStudied / 60).toFixed(1),
      completionRate: totalScheduled > 0 ? Math.round((completed / totalScheduled) * 100) : 0,
      revisionSessionsDone,
      perSubject,
      mostStudied,
      leastStudied,
      longestStreak: maxStreak,
    };
  }, [sessions, subjects]);

  return (
    <div className="space-y-6">
      {/* Top Banner Overview */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Performance Analytics & Preparation Tracking
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Calculated strictly from real recorded study sessions across all 8 university subjects.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{stats.completed} Sessions Completed</span>
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Studied</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {stats.totalHoursStudied}h
          </p>
          <p className="text-xs text-slate-500 mt-1">Logged study hours</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Completion Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            {stats.completionRate}%
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {stats.completed} of {stats.totalScheduled} sessions
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Longest Streak</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
            {stats.longestStreak} Days
          </p>
          <p className="text-xs text-slate-500 mt-1">Consecutive study days</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Revision Sessions</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 mt-2">
            {stats.revisionSessionsDone}
          </p>
          <p className="text-xs text-slate-500 mt-1">Deep review cycles done</p>
        </div>
      </div>

      {/* Most Studied vs Least Studied */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
            Most Studied Subject
          </span>
          <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
            {stats.mostStudied?.name} ({stats.mostStudied?.code})
          </h4>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
            {((stats.perSubject[stats.mostStudied?.id]?.actualMinutes || 0) / 60).toFixed(1)} hours completed (
            {stats.perSubject[stats.mostStudied?.id]?.completedCount || 0} sessions)
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/60">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
            Needs More Revision / Least Studied
          </span>
          <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
            {stats.leastStudied?.name} ({stats.leastStudied?.code})
          </h4>
          <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">
            {((stats.perSubject[stats.leastStudied?.id]?.actualMinutes || 0) / 60).toFixed(1)} hours completed (
            {stats.perSubject[stats.leastStudied?.id]?.completedCount || 0} sessions)
          </p>
        </div>
      </div>

      {/* Subject-Wise Performance Breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Subject-Wise Study Hours & Completion
            </h3>
            <p className="text-xs text-slate-500">
              Hours completed vs target hours for each subject
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          {subjects.map(subj => {
            const data = stats.perSubject[subj.id] || { completedCount: 0, scheduledCount: 0, actualMinutes: 0 };
            const hoursDone = data.actualMinutes / 60;
            const target = subj.targetHours || 35;
            const pct = Math.min(100, Math.round((hoursDone / target) * 100));

            return (
              <div key={subj.id} className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: subj.borderColor }}
                    />
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {subj.code} • {subj.name}
                    </span>
                    {subj.isDifficult && (
                      <span className="text-[10px] font-bold px-1.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                        Difficult
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                    <span>{hoursDone.toFixed(1)}h / {target}h</span>
                    <span className="text-purple-600 dark:text-purple-400">({pct}%)</span>
                  </div>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-2.5 rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: pct >= 80 ? '#10b981' : pct >= 40 ? '#8b5cf6' : '#6366f1'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Missed / Skipped / Rescheduled Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center">
          <span className="text-xs font-bold text-slate-500 uppercase">Completed</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats.completed}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center">
          <span className="text-xs font-bold text-slate-500 uppercase">Skipped</span>
          <p className="text-2xl font-black text-rose-600 mt-1">{stats.skipped}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center">
          <span className="text-xs font-bold text-slate-500 uppercase">Rescheduled</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{stats.rescheduled}</p>
        </div>
      </div>
    </div>
  );
};
