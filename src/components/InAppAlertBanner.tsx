import React, { useEffect, useState } from 'react';
import { Bell, Play, Clock, X } from 'lucide-react';
import { ActiveInAppAlert, notificationService } from '../utils/notifications';

interface Props {
  onStartSession?: (subjectName?: string) => void;
}

export const InAppAlertBanner: React.FC<Props> = ({ onStartSession }) => {
  const [alert, setAlert] = useState<ActiveInAppAlert | null>(null);

  useEffect(() => {
    const unsub = notificationService.subscribeAlerts(setAlert);
    return unsub;
  }, []);

  if (!alert) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-xl animate-in slide-in-from-top-4 duration-300">
      <div className="rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 shadow-2xl border-2 border-purple-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 shrink-0 animate-bounce">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                {alert.time} • Study Alert
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {alert.title}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              {alert.message}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
          {onStartSession && alert.type === 'session_start' && (
            <button
              onClick={() => {
                notificationService.dismissCurrentAlert();
                onStartSession(alert.subjectName);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 shadow-sm transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start</span>
            </button>
          )}

          <button
            onClick={() => notificationService.snoozeCurrentAlert(5)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            title="Snooze for 5 minutes"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>5m</span>
          </button>

          <button
            onClick={() => notificationService.snoozeCurrentAlert(10)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            title="Snooze for 10 minutes"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>10m</span>
          </button>

          <button
            onClick={() => notificationService.dismissCurrentAlert()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
