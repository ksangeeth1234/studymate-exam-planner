import React, { useState } from 'react';
import {
  Bell,
  Clock,
  Volume2,
  VolumeX,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  History,
  CheckCircle2,
  Info,
  Play
} from 'lucide-react';
import { ReminderSettings, ReminderLog } from '../types';
import { notificationService } from '../utils/notifications';
import { soundService } from '../utils/audio';

interface Props {
  reminderSettings: ReminderSettings;
  onUpdateSettings: (settings: ReminderSettings) => void;
  reminderLogs: ReminderLog[];
  onClearLogs: () => void;
}

export const RemindersPage: React.FC<Props> = ({
  reminderSettings,
  onUpdateSettings,
  reminderLogs,
  onClearLogs,
}) => {
  const [permissionState, setPermissionState] = useState<NotificationPermission>(
    notificationService.getPermission()
  );

  const handleRequestPermission = async () => {
    const res = await notificationService.requestPermission();
    setPermissionState(res);
  };

  const handleTestChime = () => {
    soundService.playStudyChime();
    notificationService.triggerAlert({
      title: '🔔 Test Study Reminder',
      message: 'StudyMate reminder test successful! Chime played and alert verified.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'alarm',
      playSound: true
    });
  };

  const handleToggleMorning = () => {
    onUpdateSettings({
      ...reminderSettings,
      morningRemindersEnabled: !reminderSettings.morningRemindersEnabled
    });
  };

  const handleToggleNight = () => {
    onUpdateSettings({
      ...reminderSettings,
      nightRemindersEnabled: !reminderSettings.nightRemindersEnabled
    });
  };

  const handleToggleSound = () => {
    const next = !reminderSettings.soundEnabled;
    soundService.setMuted(!next);
    onUpdateSettings({
      ...reminderSettings,
      soundEnabled: next
    });
  };

  const handleCustomTimeChange = (key: keyof ReminderSettings['customTimes'], val: string) => {
    onUpdateSettings({
      ...reminderSettings,
      customTimes: {
        ...reminderSettings.customTimes,
        [key]: val
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Study Reminders & Notification Setup
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-xs font-bold">
              8 Daily Trigger Points
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Configure alarms for your 3:00 AM – 5:00 AM morning and 8:00 PM – 12:00 AM night sessions. Includes in-app alert banner fallback and synthesized Web Audio bell chimes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTestChime}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition"
          >
            <Bell className="w-4 h-4" />
            <span>Test Alert & Chime</span>
          </button>
        </div>
      </div>

      {/* Permission & Sound Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Native Browser Notification Permission */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Browser Notifications
              </h4>
            </div>

            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                permissionState === 'granted'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : permissionState === 'denied'
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}
            >
              {permissionState}
            </span>
          </div>

          <p className="text-xs text-slate-500">
            {permissionState === 'granted'
              ? 'Native device notification banners are active.'
              : permissionState === 'denied'
              ? 'Notification permission is blocked in your browser settings. In-app alerts will still trigger while using the app.'
              : 'Allow notification permissions to receive popup alerts on your device.'}
          </p>

          {permissionState !== 'granted' && (
            <button
              onClick={handleRequestPermission}
              className="w-full py-2 px-3 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition"
            >
              Request Notification Permission
            </button>
          )}
        </div>

        {/* Audio / Chime Settings */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-purple-600" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Audio Chimes & Bells
              </h4>
            </div>

            <button
              onClick={handleToggleSound}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                reminderSettings.soundEnabled
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {reminderSettings.soundEnabled ? 'Enabled' : 'Muted'}
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Synthesized melodic study chime built with Web Audio API. Operates 100% offline without needing mp3 downloads.
          </p>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Default Snooze:
            </span>
            {[5, 10].map(mins => (
              <button
                key={mins}
                onClick={() => onUpdateSettings({ ...reminderSettings, snoozeMinutes: mins })}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                  reminderSettings.snoozeMinutes === mins
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {mins} Minutes
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reminder Times Configuration Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Morning Reminders */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🌅 Morning Reminders (3:00 AM – 5:00 AM)</span>
              </h3>
              <p className="text-[11px] text-slate-400">Wake-up alarm & session starts</p>
            </div>
            <button
              onClick={handleToggleMorning}
              className={`px-3 py-1 rounded-xl text-xs font-bold ${
                reminderSettings.morningRemindersEnabled
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
              }`}
            >
              {reminderSettings.morningRemindersEnabled ? 'Active' : 'Disabled'}
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Morning Wake-up & Prep Reminder
                </p>
                <p className="text-[10px] text-slate-400">5 minutes before Session 1</p>
              </div>
              <input
                type="time"
                value={reminderSettings.customTimes.morningAlert}
                onChange={(e) => handleCustomTimeChange('morningAlert', e.target.value)}
                className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Morning Session 1 Start
                </p>
                <p className="text-[10px] text-slate-400">Scheduled 3:00 AM start</p>
              </div>
              <input
                type="time"
                value={reminderSettings.customTimes.morningS1}
                onChange={(e) => handleCustomTimeChange('morningS1', e.target.value)}
                className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Morning Session 2 Start
                </p>
                <p className="text-[10px] text-slate-400">Scheduled 4:00 AM start</p>
              </div>
              <input
                type="time"
                value={reminderSettings.customTimes.morningS2}
                onChange={(e) => handleCustomTimeChange('morningS2', e.target.value)}
                className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Night Reminders */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🌙 Night Reminders (8:00 PM – 12:00 AM)</span>
              </h3>
              <p className="text-[11px] text-slate-400">Evening preparation & 4 consecutive hours</p>
            </div>
            <button
              onClick={handleToggleNight}
              className={`px-3 py-1 rounded-xl text-xs font-bold ${
                reminderSettings.nightRemindersEnabled
                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
              }`}
            >
              {reminderSettings.nightRemindersEnabled ? 'Active' : 'Disabled'}
            </button>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Night Study Prep Alert
                </p>
                <p className="text-[10px] text-slate-400">5 minutes before 8:00 PM</p>
              </div>
              <input
                type="time"
                value={reminderSettings.customTimes.nightAlert}
                onChange={(e) => handleCustomTimeChange('nightAlert', e.target.value)}
                className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Night Session 1 (8:00 PM)</p>
              </div>
              <input
                type="time"
                value={reminderSettings.customTimes.nightS1}
                onChange={(e) => handleCustomTimeChange('nightS1', e.target.value)}
                className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Night Session 2 (9:00 PM)</p>
              </div>
              <input
                type="time"
                value={reminderSettings.customTimes.nightS2}
                onChange={(e) => handleCustomTimeChange('nightS2', e.target.value)}
                className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Night Session 3 (10:00 PM)</p>
              </div>
              <input
                type="time"
                value={reminderSettings.customTimes.nightS3}
                onChange={(e) => handleCustomTimeChange('nightS3', e.target.value)}
                className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Night Session 4 (11:00 PM)</p>
              </div>
              <input
                type="time"
                value={reminderSettings.customTimes.nightS4}
                onChange={(e) => handleCustomTimeChange('nightS4', e.target.value)}
                className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Technical Transparency Box on PWA Notifications */}
      <div className="p-5 rounded-3xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider">
          <Info className="w-4 h-4 text-purple-600" />
          <span>Technical Notice: PWA & Browser Background Notifications</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          In standard modern web browsers, notification triggers require either an open browser tab, active PWA session, or a server-side push notification gateway (Web Push protocol with VAPID keys).
          To guarantee you never miss a 3:00 AM or 8:00 PM session, StudyMate implements dual layers:
        </p>
        <ul className="text-xs text-slate-600 dark:text-slate-300 list-disc list-inside space-y-1 pt-1">
          <li><strong>Foreground In-App Banner & Synthesized Chimes:</strong> Immediate audio and banner modal when the app is running.</li>
          <li><strong>PWA Service Worker Cache:</strong> Keeps the app fast, offline-ready, and responsive on home screen install.</li>
          <li><strong>Snooze Controls:</strong> Quickly postpone any alarm for 5 or 10 minutes if you need a quick water refill.</li>
        </ul>
      </div>

      {/* Reminder History Log */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Reminder History Log
            </h3>
          </div>
          {reminderLogs.length > 0 && (
            <button
              onClick={onClearLogs}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700"
            >
              Clear Log
            </button>
          )}
        </div>

        {reminderLogs.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4 text-center">
            No past reminders recorded yet.
          </p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {reminderLogs.slice(0, 15).map(log => (
              <div
                key={log.id}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    {log.title}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">{log.body}</p>
                </div>
                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
