import React from 'react';
import {
  Menu,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Timer,
  Calendar,
  Sparkles
} from 'lucide-react';
import { ActivePage } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { soundService } from '../utils/audio';

interface Props {
  activePage: ActivePage;
  onOpenSidebar: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onQuickStartTimer: () => void;
  currentDisplayDate: string;
}

const PAGE_TITLES: Record<ActivePage, { title: string; subtitle: string }> = {
  dashboard: { title: 'Exam Dashboard', subtitle: 'Overview, countdown, and daily goals' },
  today: { title: "Today's Study Plan", subtitle: '6 scheduled sessions with manual adjustment' },
  weekly: { title: 'Weekly Timetable', subtitle: '7-day overview with subject color coding' },
  calendar: { title: 'Calendar & Countdown', subtitle: 'Preparation journey & university exam schedule' },
  subjects: { title: 'Subjects & Prep Levels', subtitle: '8 subjects, difficulty tags & syllabus notes' },
  timer: { title: 'Study Session Mode', subtitle: '60-minute focused countdown & study notes' },
  progress: { title: 'Progress & Analytics', subtitle: 'Real hours studied, streaks & subject breakdown' },
  reminders: { title: 'Reminder Settings', subtitle: 'Morning (3:00 AM) & Night (8:00 PM) alerts' },
  exams: { title: 'Examination Dates', subtitle: 'Official exam timetable & countdown timers' },
  settings: { title: 'General Settings', subtitle: 'Backup, timetable regenerate, and PWA options' },
};

export const Navbar: React.FC<Props> = ({
  activePage,
  onOpenSidebar,
  darkMode,
  onToggleDarkMode,
  isMuted,
  onToggleMute,
  onQuickStartTimer,
  currentDisplayDate
}) => {
  const pageMeta = PAGE_TITLES[activePage] || { title: 'StudyMate', subtitle: '' };

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu + Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {pageMeta.title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              {pageMeta.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Quick Actions & Toggles */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Date Indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200/60 dark:border-purple-800/60 text-xs font-semibold text-purple-700 dark:text-purple-300">
            <Calendar className="w-3.5 h-3.5" />
            <span>{currentDisplayDate}</span>
          </div>

          {/* Quick Timer Launcher */}
          {activePage !== 'timer' && (
            <button
              onClick={onQuickStartTimer}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-sm transition"
            >
              <Timer className="w-3.5 h-3.5" />
              <span>Start Session</span>
            </button>
          )}

          {/* Sound Alert Toggle */}
          <button
            onClick={onToggleMute}
            className={`p-2 rounded-xl border transition ${
              isMuted
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
            title={isMuted ? 'Unmute Study Chimes' : 'Mute Study Chimes'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* PWA Compact Install Button */}
          <PWAInstallButton variant="compact" />
        </div>
      </div>
    </header>
  );
};
