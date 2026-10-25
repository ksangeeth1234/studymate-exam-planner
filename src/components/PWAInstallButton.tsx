import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  variant?: 'primary' | 'sidebar' | 'compact';
}

export const PWAInstallButton: React.FC<Props> = ({ variant = 'primary' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed and running standalone, suppress prompt
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // Browser doesn't support direct trigger yet or is in another mode
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      {variant === 'sidebar' ? (
        <button
          onClick={handleInstallClick}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 transition-all border border-purple-200 dark:border-purple-800/60"
        >
          <Download className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>Install StudyMate PWA</span>
        </button>
      ) : variant === 'compact' ? (
        <button
          onClick={handleInstallClick}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition shadow-sm"
          title="Install app on device"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install</span>
        </button>
      ) : (
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-purple-600 text-white hover:bg-purple-700 shadow-sm hover:shadow transition"
        >
          <Download className="w-4 h-4" />
          <span>Install StudyMate App</span>
        </button>
      )}

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-purple-600" />
                Install on your Device
              </h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <Share2 className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">1. Tap the Share button</p>
                  <p className="text-xs text-slate-500">In Safari or your mobile browser toolbar.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <PlusSquare className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">2. Select &quot;Add to Home Screen&quot;</p>
                  <p className="text-xs text-slate-500">Scroll down the menu and tap &quot;Add to Home Screen&quot; or &quot;Install App&quot;.</p>
                </div>
              </div>

              <p className="text-xs text-slate-400 italic pt-1">
                StudyMate will launch full-screen with offline caching, instant load times, and quick access.
              </p>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-purple-600 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
