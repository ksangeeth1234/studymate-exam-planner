import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Coffee,
  Sparkles,
  Volume2,
  VolumeX,
  FileText,
  Save,
  Clock,
  Maximize2,
  Minimize2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudySession, Subject } from '../types';
import { soundService } from '../utils/audio';

interface Props {
  activeSession: StudySession | null;
  subjects: Subject[];
  onFinishSession: (sessionId: string, actualMinutes: number, notes: string) => void;
  onSelectSession: (session: StudySession) => void;
  upcomingSessions: StudySession[];
}

export const TimerPage: React.FC<Props> = ({
  activeSession,
  subjects,
  onFinishSession,
  onSelectSession,
  upcomingSessions,
}) => {
  const TOTAL_SECONDS = 60 * 60; // 60 minutes
  const [secondsRemaining, setSecondsRemaining] = useState<number>(TOTAL_SECONDS);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>(activeSession?.notes || '');
  const [showCompletionConfirm, setShowCompletionConfirm] = useState<boolean>(false);
  const [isBreakActive, setIsBreakActive] = useState<boolean>(false);
  const [breakSecondsRemaining, setBreakSecondsRemaining] = useState<number>(5 * 60); // 5 min break
  const [isBreakRunning, setIsBreakRunning] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Sync notes when active session changes
  useEffect(() => {
    if (activeSession) {
      setNotes(activeSession.notes || '');
      setSecondsRemaining(TOTAL_SECONDS);
      setIsRunning(false);
      setIsBreakActive(false);
    }
  }, [activeSession?.id]);

  // Main study countdown timer
  useEffect(() => {
    let timer: number | null = null;
    if (isRunning && secondsRemaining > 0) {
      timer = window.setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            // Reached completion!
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, secondsRemaining]);

  // Break timer
  useEffect(() => {
    let timer: number | null = null;
    if (isBreakRunning && breakSecondsRemaining > 0) {
      timer = window.setInterval(() => {
        setBreakSecondsRemaining(prev => {
          if (prev <= 1) {
            soundService.playBreakReminder();
            setIsBreakRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isBreakRunning, breakSecondsRemaining]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    soundService.playCompletionFanfare();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    setShowCompletionConfirm(true);
  };

  const handleStartBreak = (minutes: number) => {
    setBreakSecondsRemaining(minutes * 60);
    setIsBreakActive(true);
    setIsBreakRunning(true);
  };

  const handleConfirmFinish = () => {
    if (!activeSession) return;
    const elapsedSeconds = TOTAL_SECONDS - secondsRemaining;
    const actualMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

    onFinishSession(activeSession.id, actualMinutes, notes);
    setShowCompletionConfirm(false);
    setIsBreakActive(true);
    setBreakSecondsRemaining(5 * 60);
    setIsBreakRunning(true);
  };

  const subject = subjects.find(s => s.id === activeSession?.subjectId);

  // Format mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = Math.round(((TOTAL_SECONDS - secondsRemaining) / TOTAL_SECONDS) * 100);

  // Toggle fullscreen container
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  if (!activeSession) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm max-w-lg mx-auto space-y-4">
        <Clock className="w-12 h-12 text-purple-600 mx-auto" />
        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
          No Active Study Session Selected
        </h3>
        <p className="text-xs text-slate-500">
          Pick an upcoming session from your schedule to start 60 minutes of uninterrupted study.
        </p>
        <div className="pt-2 space-y-2">
          {upcomingSessions.slice(0, 3).map(s => {
            const subj = subjects.find(sub => sub.id === s.subjectId);
            return (
              <button
                key={s.id}
                onClick={() => onSelectSession(s)}
                className="w-full p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-left hover:bg-purple-100 flex items-center justify-between transition"
              >
                <div>
                  <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold">
                    {s.displayTime}
                  </span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {subj?.name}
                  </p>
                </div>
                <Play className="w-4 h-4 text-purple-600" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Session Focus Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-xl relative overflow-hidden text-center">
        {/* Background ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top toolbar */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800 relative z-10">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full animate-ping"
              style={{ backgroundColor: subject?.borderColor || '#7c3aed' }}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Focus Study Mode • {activeSession.displayTime}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Fullscreen mode"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Subject Header */}
        <div className="my-6 space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-xs font-extrabold text-purple-700 dark:text-purple-300">
            <span>{subject?.code}</span>
            {subject?.isDifficult && <span>• ★ Difficult Subject</span>}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {subject?.name}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            60-minute scheduled block • Eliminate distractions and focus deeply
          </p>
        </div>

        {/* Circular / Visual Countdown Timer Display */}
        <div className="my-8 relative z-10 flex flex-col items-center justify-center">
          <div className="relative w-64 h-64 flex items-center justify-center">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="128"
                cy="128"
                r="110"
                stroke="currentColor"
                strokeWidth="12"
                className="text-slate-100 dark:text-slate-800"
                fill="transparent"
              />
              <circle
                cx="128"
                cy="128"
                r="110"
                stroke="currentColor"
                strokeWidth="12"
                className="text-purple-600 dark:text-purple-500 transition-all duration-1000 ease-linear"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 110}
                strokeDashoffset={2 * Math.PI * 110 * (1 - progressPercent / 100)}
                strokeLinecap="round"
              />
            </svg>

            {/* Central Clock Display */}
            <div className="absolute flex flex-col items-center">
              <span className="text-5xl sm:text-6xl font-black font-mono text-slate-900 dark:text-white tracking-tighter">
                {formatTime(secondsRemaining)}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                {isRunning ? 'Studying...' : secondsRemaining === 0 ? 'Completed' : 'Paused'}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-2">
            {progressPercent}% of 60 minutes completed
          </p>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 relative z-10">
          {!isRunning ? (
            <button
              onClick={() => {
                setIsRunning(true);
                soundService.playStudyChime();
              }}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm shadow-lg shadow-purple-600/30 transition transform hover:scale-[1.02]"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{secondsRemaining === TOTAL_SECONDS ? 'Start 60m Focus' : 'Resume Focus'}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsRunning(false)}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm shadow-md transition"
            >
              <Pause className="w-5 h-5 fill-current" />
              <span>Pause Timer</span>
            </button>
          )}

          <button
            onClick={() => {
              setIsRunning(false);
              setSecondsRemaining(TOTAL_SECONDS);
            }}
            className="flex items-center gap-1.5 px-4 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition"
            title="Reset timer back to 60 minutes"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>

          <button
            onClick={() => setShowCompletionConfirm(true)}
            className="flex items-center gap-1.5 px-5 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Finish Session</span>
          </button>
        </div>

        {/* Study Notes Recording Field */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-left relative z-10">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2">
            <FileText className="w-4 h-4 text-purple-600" />
            <span>Record What You Studied In This Session:</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Reviewed chapter 3 slide deck, worked through 4 sample past questions, noted down definitions of race condition..."
            rows={3}
            className="w-full text-xs p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Post-Session Break Card */}
      {isBreakActive && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-800 rounded-3xl p-6 shadow-md text-center space-y-4 animate-in fade-in">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
            <Coffee className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-emerald-900 dark:text-emerald-100">
              Session Finished! Take a Restorative Break
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 max-w-md mx-auto">
              Stand up, hydrate with a glass of water, stretch your back, and let your brain consolidate what you learned.
            </p>
          </div>

          <div className="text-4xl font-black font-mono text-emerald-800 dark:text-emerald-200">
            {formatTime(breakSecondsRemaining)}
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setIsBreakRunning(!isBreakRunning)}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700"
            >
              {isBreakRunning ? 'Pause Break' : 'Resume Break'}
            </button>
            <button
              onClick={() => handleStartBreak(5)}
              className="px-3 py-2 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs hover:bg-emerald-200"
            >
              5 Min
            </button>
            <button
              onClick={() => handleStartBreak(10)}
              className="px-3 py-2 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs hover:bg-emerald-200"
            >
              10 Min
            </button>
            <button
              onClick={() => setIsBreakActive(false)}
              className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal before marking complete */}
      {showCompletionConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Complete Study Session?
              </h3>
              <p className="text-xs text-slate-500">
                You studied for approximately{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {Math.max(1, Math.round((TOTAL_SECONDS - secondsRemaining) / 60))} minutes
                </strong>{' '}
                out of the 60 scheduled minutes. This will be recorded separately.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs space-y-1">
              <span className="font-bold text-slate-500">Subject:</span>
              <p className="font-extrabold text-slate-800 dark:text-slate-200">{subject?.name}</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCompletionConfirm(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                Keep Studying
              </button>
              <button
                onClick={handleConfirmFinish}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 shadow-md"
              >
                Confirm & Mark Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
