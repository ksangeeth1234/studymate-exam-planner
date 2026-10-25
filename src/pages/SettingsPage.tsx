import React, { useState } from 'react';
import {
  Settings,
  Download,
  Upload,
  RotateCcw,
  RefreshCw,
  Moon,
  Sun,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  Calendar,
  Check,
  AlertTriangle
} from 'lucide-react';
import { AppSettings, Subject, StudySession } from '../types';
import { exportDatabaseBackup, importDatabaseBackup, resetDatabaseToDefaults } from '../db';
import { generateTimetable } from '../utils/scheduler';
import { PWAInstallButton } from '../components/PWAInstallButton';

interface Props {
  appSettings: AppSettings;
  onUpdateAppSettings: (settings: AppSettings) => void;
  subjects: Subject[];
  sessions: StudySession[];
  onReloadAllData: () => Promise<void>;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const SettingsPage: React.FC<Props> = ({
  appSettings,
  onUpdateAppSettings,
  subjects,
  sessions,
  onReloadAllData,
  darkMode,
  onToggleDarkMode,
}) => {
  const [startDate, setStartDate] = useState<string>(appSettings.startDate);
  const [endDate, setEndDate] = useState<string>(appSettings.endDate);
  const [examPeriodStart, setExamPeriodStart] = useState<string>(appSettings.examPeriodStart);
  const [breakMins, setBreakMins] = useState<number>(appSettings.breakDurationMinutes || 5);

  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleSaveDates = () => {
    if (startDate >= endDate) {
      showToast('Start date must be before end date.', 'error');
      return;
    }
    onUpdateAppSettings({
      ...appSettings,
      startDate,
      endDate,
      examPeriodStart,
      breakDurationMinutes: breakMins
    });
    showToast('Settings saved successfully.');
  };

  // Export JSON backup file
  const handleExportBackup = async () => {
    try {
      const json = await exportDatabaseBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `studymate-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Database backup downloaded successfully.');
    } catch {
      showToast('Failed to export backup.', 'error');
    }
  };

  // Import JSON backup file
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    try {
      const text = await file.text();
      const success = await importDatabaseBackup(text);
      if (success) {
        await onReloadAllData();
        showToast('Backup restored successfully!');
      } else {
        showToast('Invalid backup file format.', 'error');
      }
    } catch {
      showToast('Error parsing file.', 'error');
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  // Regenerate timetable preserving completed slots
  const handleRegenerateFuture = async () => {
    setIsProcessing(true);
    try {
      const newSchedule = generateTimetable(appSettings.startDate, appSettings.endDate, subjects, sessions);
      const { db } = await import('../db');
      await db.sessions.bulkPut(newSchedule);
      await onReloadAllData();
      showToast('Timetable rotated and refreshed!');
    } catch {
      showToast('Error re-generating timetable.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Hard Reset to defaults
  const handleHardReset = async () => {
    setIsProcessing(true);
    try {
      await resetDatabaseToDefaults();
      await onReloadAllData();
      setShowResetConfirm(false);
      showToast('Database reset to clean 26 Oct 2026 default state.');
    } catch {
      showToast('Error resetting database.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Toast Alert */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-md transition ${
            statusMessage.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)}>✕</button>
        </div>
      )}

      {/* Preparation Timeline Configuration */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            Study Period & Timeline Bounds
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          The automatic timetable starts on 26 October 2026 and continues until your examinations.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Study Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full text-xs font-bold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Timetable End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full text-xs font-bold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Estimated Exam Period Start
            </label>
            <input
              type="date"
              value={examPeriodStart}
              onChange={(e) => setExamPeriodStart(e.target.value)}
              className="mt-1 w-full text-xs font-bold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Post-Session Break Duration:
            </span>
            {[5, 10].map(mins => (
              <button
                key={mins}
                type="button"
                onClick={() => setBreakMins(mins)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition border ${
                  breakMins === mins
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {mins} Minutes
              </button>
            ))}
          </div>

          <button
            onClick={handleSaveDates}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition"
          >
            Save Dates
          </button>
        </div>
      </div>

      {/* Timetable Regeneration Actions */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-purple-600" />
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            Schedule Regeneration & Subject Re-balancing
          </h3>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          If you updated difficult subject flags or adjusted timeline dates, you can re-run the rotation algorithm.
          This preserves already completed or skipped sessions so you never lose your logged progress.
        </p>

        <div className="pt-2">
          <button
            onClick={handleRegenerateFuture}
            disabled={isProcessing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition"
          >
            <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>Re-balance & Refresh Uncompleted Slots</span>
          </button>
        </div>
      </div>

      {/* Backup & Restore (IndexedDB) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-purple-600" />
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            Local Data Backup & Restore
          </h3>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          StudyMate uses local-first IndexedDB storage on your device. You can download a complete JSON backup of your timetable, notes, exam dates, and statistics, or restore it on any computer or phone.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <Download className="w-4 h-4 text-purple-600" />
            <span>Export Backup (JSON)</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer">
            <Upload className="w-4 h-4 text-purple-600" />
            <span>Restore Backup (JSON)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* PWA & Display Preferences */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Display & Appearance
            </h3>
            <p className="text-xs text-slate-500">
              Toggle theme color mode between Soft Light and Dark
            </p>
          </div>

          <button
            onClick={onToggleDarkMode}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
          </button>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Install Progressive Web App (PWA)
            </p>
            <p className="text-[11px] text-slate-400">
              Runs as a standalone desktop or mobile application with offline support
            </p>
          </div>
          <PWAInstallButton variant="primary" />
        </div>
      </div>

      {/* Danger Zone: Reset Data */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-rose-200 dark:border-rose-950/60 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-rose-600">
          <ShieldAlert className="w-5 h-5" />
          <h3 className="text-base font-extrabold">Reset Data</h3>
        </div>
        <p className="text-xs text-slate-500">
          Clear all sessions, recorded study minutes, notes, and exam dates back to fresh 26 October 2026 default state.
        </p>

        <button
          onClick={() => setShowResetConfirm(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-300 dark:border-rose-900/60"
        >
          Reset All StudyMate Data
        </button>
      </div>

      {/* Developer Credit & University Project Specifications */}
      <div className="rounded-3xl bg-gradient-to-tr from-purple-50 via-indigo-50 to-purple-50 dark:from-purple-950/30 dark:via-indigo-950/20 dark:to-purple-950/30 border border-purple-200 dark:border-purple-800/60 p-6 text-center space-y-2">
        <GraduationCap className="w-8 h-8 text-purple-600 mx-auto" />
        <h4 className="text-base font-black text-slate-900 dark:text-white">
          StudyMate – Exam Planner PWA
        </h4>
        <p className="text-xs font-bold text-purple-700 dark:text-purple-300">
          Developed by {appSettings.developerName}
        </p>
        <p className="text-[11px] text-slate-500 max-w-lg mx-auto">
          Crafted for university examination excellence • Automated 8-subject balanced rotation, 6 daily study sessions (3–5 AM morning & 8–12 AM night), and offline-first Progressive Web App architecture.
        </p>
      </div>

      {/* Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95">
            <div className="text-center space-y-2">
              <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto" />
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Are you sure you want to reset all data?
              </h3>
              <p className="text-xs text-slate-500">
                This will delete your recorded study hours, notes, and exams, and generate a fresh schedule from 26 October 2026. This action cannot be undone unless you have a JSON backup.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleHardReset}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700"
              >
                Yes, Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
