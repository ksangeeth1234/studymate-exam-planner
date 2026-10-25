import React from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  Calendar,
  BookOpen,
  Timer,
  BarChart3,
  Bell,
  GraduationCap,
  Settings,
  X,
  Sparkles
} from 'lucide-react';
import { ActivePage } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface Props {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  isOpen: boolean;
  onClose: () => void;
  developerName: string;
}

export const Sidebar: React.FC<Props> = ({
  activePage,
  setActivePage,
  isOpen,
  onClose,
  developerName
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'today', label: "Today's Study Plan", icon: CalendarCheck },
    { id: 'weekly', label: 'Weekly Timetable', icon: CalendarDays },
    { id: 'calendar', label: 'Calendar & Exams', icon: Calendar },
    { id: 'subjects', label: 'Subjects & Prep', icon: BookOpen },
    { id: 'timer', label: 'Study Session Timer', icon: Timer },
    { id: 'progress', label: 'Progress & Analytics', icon: BarChart3 },
    { id: 'reminders', label: 'Reminder Settings', icon: Bell },
    { id: 'exams', label: 'Exam Dates', icon: GraduationCap },
    { id: 'settings', label: 'General Settings', icon: Settings },
  ] as const;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/25">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  StudyMate
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300">
                  PWA
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Exam Planner & Rotator
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 dark:shadow-none'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer & PWA Install & Credit */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
          <PWAInstallButton variant="sidebar" />

          <div className="p-3 rounded-xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Exam Ready Target</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              6 hours daily • 8 university subjects balanced fair rotation.
            </p>
          </div>

          <div className="pt-1 text-center">
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              Developed by
            </p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {developerName}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
