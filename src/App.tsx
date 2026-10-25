/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ActivePage,
  StudySession,
  Subject,
  ExamDate,
  ReminderLog,
  ReminderSettings,
  AppSettings
} from './types';
import { db, initializeDatabase } from './db';
import { DEFAULT_APP_SETTINGS, DEFAULT_REMINDER_SETTINGS, INITIAL_SUBJECTS } from './utils/constants';
import { notificationService } from './utils/notifications';
import { soundService } from './utils/audio';
import { formatDateKey } from './utils/scheduler';

import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { InAppAlertBanner } from './components/InAppAlertBanner';
import { OfflineIndicator } from './components/OfflineIndicator';

import { DashboardPage } from './pages/DashboardPage';
import { TodayPage } from './pages/TodayPage';
import { WeeklyPage } from './pages/WeeklyPage';
import { CalendarPage } from './pages/CalendarPage';
import { SubjectsPage } from './pages/SubjectsPage';
import { TimerPage } from './pages/TimerPage';
import { ProgressPage } from './pages/ProgressPage';
import { RemindersPage } from './pages/RemindersPage';
import { ExamsPage } from './pages/ExamsPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // App Data States
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>(INITIAL_SUBJECTS);
  const [exams, setExams] = useState<ExamDate[]>([]);
  const [reminderLogs, setReminderLogs] = useState<ReminderLog[]>([]);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(DEFAULT_REMINDER_SETTINGS);
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);

  // Current viewed date (defaults to project start date: 26 October 2026)
  const [currentDateStr, setCurrentDateStr] = useState<string>('2026-10-26');

  // Currently active session loaded in the timer
  const [activeTimerSession, setActiveTimerSession] = useState<StudySession | null>(null);

  // Sound and Dark mode states
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Load all data from IndexedDB
  const reloadAllData = useCallback(async () => {
    try {
      await initializeDatabase();
      const [allSessions, allSubjects, allExams, allLogs, allSettings] = await Promise.all([
        db.sessions.toArray(),
        db.subjects.toArray(),
        db.exams.toArray(),
        db.reminders.orderBy('timestamp').reverse().toArray(),
        db.settings.toArray()
      ]);

      if (allSessions.length > 0) setSessions(allSessions);
      if (allSubjects.length > 0) setSubjects(allSubjects);
      setExams(allExams);
      setReminderLogs(allLogs);

      const appSet = allSettings.find(s => s.key === 'appSettings')?.value as AppSettings | undefined;
      if (appSet) {
        setAppSettings(appSet);
        setDarkMode(appSet.darkMode ?? false);
      }

      const remSet = allSettings.find(s => s.key === 'reminderSettings')?.value as ReminderSettings | undefined;
      if (remSet) {
        setReminderSettings(remSet);
        setIsMuted(!remSet.soundEnabled);
      }
    } catch (err) {
      console.error('Error loading database data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadAllData();
  }, [reloadAllData]);

  // Apply dark mode class to html document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Set default active timer session when sessions load
  useEffect(() => {
    if (!activeTimerSession && sessions.length > 0) {
      const todayMatches = sessions.filter(s => s.date === currentDateStr && (s.status === 'scheduled' || s.status === 'in_progress'));
      if (todayMatches.length > 0) {
        setActiveTimerSession(todayMatches[0]);
      } else {
        const anyScheduled = sessions.find(s => s.status === 'scheduled');
        if (anyScheduled) setActiveTimerSession(anyScheduled);
      }
    }
  }, [sessions, currentDateStr, activeTimerSession]);

  // Periodic reminder checking against local device time (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const todayKey = formatDateKey(now);
      const todaySlots = sessions.filter(s => s.date === todayKey);

      // Find current and next session subjects
      const currentSlot = todaySlots.find(s => s.status === 'scheduled' || s.status === 'in_progress');
      const curSubject = subjects.find(s => s.id === currentSlot?.subjectId)?.name;
      const nextSlot = todaySlots.find(s => s.slotIndex === (currentSlot ? currentSlot.slotIndex + 1 : 0));
      const nextSubject = subjects.find(s => s.id === nextSlot?.subjectId)?.name;

      notificationService.checkScheduledReminders(curSubject, nextSubject, reminderSettings);
    }, 30000);

    return () => clearInterval(interval);
  }, [sessions, subjects, reminderSettings]);

  // Handlers for Session Actions
  const handleStartSession = (session: StudySession) => {
    setActiveTimerSession(session);
    setActivePage('timer');
  };

  const handleUpdateSessionStatus = async (
    sessionId: string,
    status: StudySession['status'],
    actualMinutes?: number
  ) => {
    setSessions(prev =>
      prev.map(s => {
        if (s.id === sessionId) {
          const updated = {
            ...s,
            status,
            actualMinutes: actualMinutes !== undefined ? actualMinutes : s.actualMinutes,
            completedAt: status === 'completed' ? new Date().toISOString() : undefined
          };
          db.sessions.put(updated).catch(console.error);
          return updated;
        }
        return s;
      })
    );
  };

  const handleUpdateSessionSubject = async (sessionId: string, newSubjectId: string) => {
    setSessions(prev =>
      prev.map(s => {
        if (s.id === sessionId) {
          const updated = { ...s, subjectId: newSubjectId };
          db.sessions.put(updated).catch(console.error);
          return updated;
        }
        return s;
      })
    );
  };

  const handleUpdateSessionNotes = async (sessionId: string, notes: string) => {
    setSessions(prev =>
      prev.map(s => {
        if (s.id === sessionId) {
          const updated = { ...s, notes };
          db.sessions.put(updated).catch(console.error);
          return updated;
        }
        return s;
      })
    );
  };

  const handleFinishTimerSession = async (sessionId: string, actualMinutes: number, notes: string) => {
    await handleUpdateSessionStatus(sessionId, 'completed', actualMinutes);
    await handleUpdateSessionNotes(sessionId, notes);
    // Find next session to study
    const nextSession = sessions.find(s => s.date === currentDateStr && s.id !== sessionId && s.status === 'scheduled');
    if (nextSession) {
      setActiveTimerSession(nextSession);
    }
  };

  // Handlers for Subject Updates
  const handleUpdateSubject = async (updatedSubject: Subject) => {
    setSubjects(prev =>
      prev.map(s => (s.id === updatedSubject.id ? updatedSubject : s))
    );
    await db.subjects.put(updatedSubject);
  };

  // Handlers for Exam Updates
  const handleAddExam = async (examData: Omit<ExamDate, 'id'>) => {
    const newExam: ExamDate = {
      ...examData,
      id: `exam-${Date.now()}`
    };
    setExams(prev => [...prev, newExam]);
    await db.exams.put(newExam);
  };

  const handleDeleteExam = async (id: string) => {
    setExams(prev => prev.filter(e => e.id !== id));
    await db.exams.delete(id);
  };

  const handleUpdateExam = async (updatedExam: ExamDate) => {
    setExams(prev =>
      prev.map(e => (e.id === updatedExam.id ? updatedExam : e))
    );
    await db.exams.put(updatedExam);
  };

  // Handlers for Reminder Settings
  const handleUpdateReminderSettings = async (newSettings: ReminderSettings) => {
    setReminderSettings(newSettings);
    await db.settings.put({ key: 'reminderSettings', value: newSettings });
  };

  const handleClearLogs = async () => {
    await db.reminders.clear();
    setReminderLogs([]);
  };

  // Handlers for App Settings
  const handleUpdateAppSettings = async (newSettings: AppSettings) => {
    setAppSettings(newSettings);
    await db.settings.put({ key: 'appSettings', value: newSettings });
  };

  const handleToggleDarkMode = async () => {
    const next = !darkMode;
    setDarkMode(next);
    const updated = { ...appSettings, darkMode: next };
    setAppSettings(updated);
    await db.settings.put({ key: 'appSettings', value: updated });
  };

  const handleToggleMute = async () => {
    const next = !isMuted;
    setIsMuted(next);
    soundService.setMuted(next);
    const updatedRem = { ...reminderSettings, soundEnabled: !next };
    setReminderSettings(updatedRem);
    await db.settings.put({ key: 'reminderSettings', value: updatedRem });
  };

  const handleQuickStartTimer = () => {
    if (activeTimerSession) {
      setActivePage('timer');
    } else {
      const firstUpcoming = sessions.find(s => s.status === 'scheduled');
      if (firstUpcoming) {
        setActiveTimerSession(firstUpcoming);
        setActivePage('timer');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="w-16 h-16 rounded-3xl bg-purple-600 animate-pulse flex items-center justify-center text-white shadow-xl shadow-purple-600/30">
          <span className="text-xl font-black">SM</span>
        </div>
        <p className="mt-4 font-extrabold text-sm text-slate-800 dark:text-slate-200">
          Loading StudyMate – Exam Planner...
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Initializing offline IndexedDB & study timetable
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Offline Toast Indicator */}
      <OfflineIndicator />

      {/* In-App Study Reminder Banner */}
      <InAppAlertBanner
        onStartSession={(subjectName) => {
          const match = sessions.find(s => {
            const subj = subjects.find(sub => sub.id === s.subjectId);
            return subj?.name === subjectName && (s.status === 'scheduled' || s.status === 'in_progress');
          });
          if (match) {
            handleStartSession(match);
          } else if (activeTimerSession) {
            setActivePage('timer');
          }
        }}
      />

      {/* Desktop & Mobile Navigation Sidebar */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        developerName={appSettings.developerName}
      />

      {/* Main Content Area */}
      <div className="lg:pl-72 flex flex-col flex-1 min-h-screen">
        <Navbar
          activePage={activePage}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          darkMode={darkMode}
          onToggleDarkMode={handleToggleDarkMode}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onQuickStartTimer={handleQuickStartTimer}
          currentDisplayDate={currentDateStr}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20">
          {activePage === 'dashboard' && (
            <DashboardPage
              currentDateStr={currentDateStr}
              sessions={sessions}
              subjects={subjects}
              exams={exams}
              appSettings={appSettings}
              onStartSession={handleStartSession}
              onUpdateSessionStatus={handleUpdateSessionStatus}
              onNavigateToPage={setActivePage}
              onSelectDate={setCurrentDateStr}
            />
          )}

          {activePage === 'today' && (
            <TodayPage
              selectedDateStr={currentDateStr}
              onSelectDate={setCurrentDateStr}
              sessions={sessions}
              subjects={subjects}
              onStartSession={handleStartSession}
              onUpdateSessionStatus={handleUpdateSessionStatus}
              onUpdateSessionSubject={handleUpdateSessionSubject}
              onUpdateSessionNotes={handleUpdateSessionNotes}
            />
          )}

          {activePage === 'weekly' && (
            <WeeklyPage
              currentDateStr={currentDateStr}
              sessions={sessions}
              subjects={subjects}
              onStartSession={handleStartSession}
              onUpdateSessionStatus={handleUpdateSessionStatus}
              onUpdateSessionSubject={handleUpdateSessionSubject}
            />
          )}

          {activePage === 'calendar' && (
            <CalendarPage
              currentDateStr={currentDateStr}
              sessions={sessions}
              subjects={subjects}
              exams={exams}
              appSettings={appSettings}
              onSelectDate={setCurrentDateStr}
              onNavigateToPage={setActivePage}
              onAddExamClick={() => setActivePage('exams')}
            />
          )}

          {activePage === 'subjects' && (
            <SubjectsPage
              subjects={subjects}
              sessions={sessions}
              onUpdateSubject={handleUpdateSubject}
              onNavigateToPage={setActivePage}
            />
          )}

          {activePage === 'timer' && (
            <TimerPage
              activeSession={activeTimerSession}
              subjects={subjects}
              onFinishSession={handleFinishTimerSession}
              onSelectSession={handleStartSession}
              upcomingSessions={sessions.filter(s => s.status === 'scheduled')}
            />
          )}

          {activePage === 'progress' && (
            <ProgressPage
              sessions={sessions}
              subjects={subjects}
              currentDateStr={currentDateStr}
            />
          )}

          {activePage === 'reminders' && (
            <RemindersPage
              reminderSettings={reminderSettings}
              onUpdateSettings={handleUpdateReminderSettings}
              reminderLogs={reminderLogs}
              onClearLogs={handleClearLogs}
            />
          )}

          {activePage === 'exams' && (
            <ExamsPage
              exams={exams}
              subjects={subjects}
              appSettings={appSettings}
              currentDateStr={currentDateStr}
              onAddExam={handleAddExam}
              onDeleteExam={handleDeleteExam}
              onUpdateExam={handleUpdateExam}
            />
          )}

          {activePage === 'settings' && (
            <SettingsPage
              appSettings={appSettings}
              onUpdateAppSettings={handleUpdateAppSettings}
              subjects={subjects}
              sessions={sessions}
              onReloadAllData={reloadAllData}
              darkMode={darkMode}
              onToggleDarkMode={handleToggleDarkMode}
            />
          )}
        </main>

        {/* Global Footer with Developer Credit */}
        <footer className="mt-auto py-4 px-6 border-t border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-400 bg-white/50 dark:bg-slate-900/50">
          <p>
            StudyMate – Exam Planner • <span className="font-semibold text-slate-600 dark:text-slate-300">Developed by Kavindu Sangeeth Silpage</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
