import { ReminderSettings, ReminderLog } from '../types';
import { db } from '../db';
import { soundService } from './audio';

export interface ActiveInAppAlert {
  id: string;
  title: string;
  message: string;
  subjectName?: string;
  time: string;
  type: 'alarm' | 'session_start' | 'break';
  timestamp: number;
}

class NotificationService {
  private inAppAlertListeners: ((alert: ActiveInAppAlert | null) => void)[] = [];
  private currentAlert: ActiveInAppAlert | null = null;
  private snoozedTimers: number[] = [];

  /**
   * Check if native browser notifications are supported
   */
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Get current permission state
   */
  public getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  /**
   * Request native notification permission
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return 'denied';
    }
  }

  public subscribeAlerts(listener: (alert: ActiveInAppAlert | null) => void) {
    this.inAppAlertListeners.push(listener);
    listener(this.currentAlert);
    return () => {
      this.inAppAlertListeners = this.inAppAlertListeners.filter(l => l !== listener);
    };
  }

  public dismissCurrentAlert() {
    this.currentAlert = null;
    this.inAppAlertListeners.forEach(l => l(null));
  }

  public snoozeCurrentAlert(minutes: number = 5) {
    if (!this.currentAlert) return;
    const alertToSnooze = { ...this.currentAlert };
    this.dismissCurrentAlert();

    // Log snooze event
    const log: ReminderLog = {
      id: `snooze-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: `Snoozed (${minutes}m)`,
      body: `Reminder for ${alertToSnooze.subjectName || alertToSnooze.title} snoozed for ${minutes} minutes.`,
      type: 'snooze'
    };
    db.reminders.add(log).catch(console.error);

    const timerId = window.setTimeout(() => {
      this.triggerAlert({
        title: `Snooze Over: ${alertToSnooze.title}`,
        message: alertToSnooze.message,
        subjectName: alertToSnooze.subjectName,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: alertToSnooze.type,
        playSound: true
      });
    }, minutes * 60 * 1000);

    this.snoozedTimers.push(timerId);
  }

  /**
   * Triggers a reminder alert across Native Notification, In-App Modal/Banner, and Sound chime
   */
  public async triggerAlert(params: {
    title: string;
    message: string;
    subjectName?: string;
    time: string;
    type: 'alarm' | 'session_start' | 'break';
    playSound?: boolean;
    settings?: ReminderSettings;
  }) {
    const { title, message, subjectName, time, type, playSound = true, settings } = params;

    // Check settings if passed
    if (settings && !settings.enabled) return;
    if (settings && !settings.soundEnabled) {
      soundService.setMuted(true);
    }

    // 1. Play sound chime
    if (playSound && (!settings || settings.soundEnabled)) {
      if (type === 'break') {
        soundService.playBreakReminder();
      } else {
        soundService.playStudyChime();
      }
    }

    // 2. Browser native notification if permission granted
    if (this.isSupported() && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: `${message} (${time})`,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: 'studymate-reminder'
        });
      } catch (err) {
        console.warn('Native notification failed, showing in-app banner instead:', err);
      }
    }

    // 3. Set In-App active banner/modal
    const alertObj: ActiveInAppAlert = {
      id: `alert-${Date.now()}`,
      title,
      message,
      subjectName,
      time,
      type,
      timestamp: Date.now()
    };

    this.currentAlert = alertObj;
    this.inAppAlertListeners.forEach(l => l(alertObj));

    // 4. Log in reminder history
    const log: ReminderLog = {
      id: alertObj.id,
      timestamp: new Date().toISOString(),
      title,
      body: `${message} ${subjectName ? `[${subjectName}]` : ''}`,
      type
    };
    await db.reminders.add(log).catch(console.error);
  }

  /**
   * Helper that checks if current local time matches any scheduled study reminder
   */
  public checkScheduledReminders(
    currentSlotSubjectName: string | undefined,
    nextSlotSubjectName: string | undefined,
    settings: ReminderSettings
  ) {
    if (!settings.enabled) return;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const timeKey = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;

    // Morning reminders
    if (settings.morningRemindersEnabled) {
      if (timeKey === settings.customTimes.morningAlert) {
        this.triggerAlert({
          title: '🌅 Morning Study Reminder (5 Minutes to Start)',
          message: `Wake up and get ready! First study session starts at 3:00 AM${nextSlotSubjectName ? `: ${nextSlotSubjectName}` : ''}. Drink some water and set up your workspace.`,
          subjectName: nextSlotSubjectName,
          time: '2:55 AM',
          type: 'alarm',
          settings
        });
      } else if (timeKey === settings.customTimes.morningS1) {
        this.triggerAlert({
          title: '📖 Morning Session 1 Begins',
          message: `Time to start: ${currentSlotSubjectName || 'Session 1'}. 60 minutes of deep, uninterrupted focus.`,
          subjectName: currentSlotSubjectName,
          time: '3:00 AM',
          type: 'session_start',
          settings
        });
      } else if (timeKey === settings.customTimes.morningS2) {
        this.triggerAlert({
          title: '📖 Morning Session 2 Begins',
          message: `Second morning session started: ${currentSlotSubjectName || 'Session 2'}. Maintain your momentum!`,
          subjectName: currentSlotSubjectName,
          time: '4:00 AM',
          type: 'session_start',
          settings
        });
      }
    }

    // Night reminders
    if (settings.nightRemindersEnabled) {
      if (timeKey === settings.customTimes.nightAlert) {
        this.triggerAlert({
          title: '🌙 Night Study Reminder (5 Minutes to Start)',
          message: `Evening session starts soon! Next subject${nextSlotSubjectName ? `: ${nextSlotSubjectName}` : ''}. Prepare your notes and eliminate distractions.`,
          subjectName: nextSlotSubjectName,
          time: '7:55 PM',
          type: 'alarm',
          settings
        });
      } else if (timeKey === settings.customTimes.nightS1) {
        this.triggerAlert({
          title: '📚 Night Session 1 Begins',
          message: `First night session started: ${currentSlotSubjectName || 'Session 1'}. Let's make this hour count!`,
          subjectName: currentSlotSubjectName,
          time: '8:00 PM',
          type: 'session_start',
          settings
        });
      } else if (timeKey === settings.customTimes.nightS2) {
        this.triggerAlert({
          title: '📚 Night Session 2 Begins',
          message: `Starting: ${currentSlotSubjectName || 'Session 2'}. Solid focus creates exam mastery.`,
          subjectName: currentSlotSubjectName,
          time: '9:00 PM',
          type: 'session_start',
          settings
        });
      } else if (timeKey === settings.customTimes.nightS3) {
        this.triggerAlert({
          title: '📚 Night Session 3 Begins',
          message: `Starting: ${currentSlotSubjectName || 'Session 3'}. Keep your energy up, take brief sips of water.`,
          subjectName: currentSlotSubjectName,
          time: '10:00 PM',
          type: 'session_start',
          settings
        });
      } else if (timeKey === settings.customTimes.nightS4) {
        this.triggerAlert({
          title: '📚 Final Night Session Begins',
          message: `Final hour of the day: ${currentSlotSubjectName || 'Session 4'}. Finish strong before restful sleep!`,
          subjectName: currentSlotSubjectName,
          time: '11:00 PM',
          type: 'session_start',
          settings
        });
      }
    }
  }
}

export const notificationService = new NotificationService();
