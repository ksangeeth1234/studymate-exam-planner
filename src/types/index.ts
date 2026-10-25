export type PreparationLevel = 'not_started' | 'beginner' | 'improving' | 'good' | 'exam_ready';

export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'skipped' | 'rescheduled';

export interface Subject {
  id: string;
  code: string;
  name: string;
  color: string; // Pastel background hex
  borderColor: string;
  badgeBg: string;
  textColor: string;
  isDifficult: boolean;
  preparationLevel: PreparationLevel;
  notes?: string;
  targetHours: number;
}

export interface TimeSlotConfig {
  slotIndex: number;
  period: 'morning' | 'night';
  startTime: string; // "03:00"
  endTime: string;   // "04:00"
  displayTime: string; // "3:00 AM – 4:00 AM"
  reminderTime: string; // "02:55" or "03:00"
}

export interface StudySession {
  id: string; // format: YYYY-MM-DD-slotIndex
  date: string; // YYYY-MM-DD
  slotIndex: number; // 0 to 5
  startTime: string;
  endTime: string;
  displayTime: string;
  period: 'morning' | 'night';
  subjectId: string;
  status: SessionStatus;
  scheduledMinutes: number; // 60
  actualMinutes: number; // recorded study time
  completedAt?: string; // ISO date string
  notes?: string;
  isRevision?: boolean;
}

export interface ExamDate {
  id: string;
  subjectId: string;
  examDate: string; // YYYY-MM-DD
  startTime: string; // "09:00"
  endTime: string;   // "12:00"
  location?: string;
  notes?: string;
}

export interface ReminderLog {
  id: string;
  timestamp: string; // ISO
  title: string;
  body: string;
  subjectId?: string;
  type: 'alarm' | 'session_start' | 'break' | 'snooze';
}

export interface ReminderSettings {
  enabled: boolean;
  morningRemindersEnabled: boolean;
  nightRemindersEnabled: boolean;
  soundEnabled: boolean;
  snoozeMinutes: number;
  customTimes: {
    morningAlert: string; // "02:55"
    morningS1: string;    // "03:00"
    morningS2: string;    // "04:00"
    nightAlert: string;   // "19:55"
    nightS1: string;      // "20:00"
    nightS2: string;      // "21:00"
    nightS3: string;      // "22:00"
    nightS4: string;      // "23:00"
  };
}

export interface AppSettings {
  startDate: string; // "2026-10-26"
  endDate: string;   // "2026-11-30"
  examPeriodStart: string; // "2026-11-23" (Last week of November)
  darkMode: boolean;
  breakDurationMinutes: number; // 5 or 10
  developerName: string; // "Kavindu Sangeeth Silpage"
}

export type ActivePage =
  | 'dashboard'
  | 'today'
  | 'weekly'
  | 'calendar'
  | 'subjects'
  | 'timer'
  | 'progress'
  | 'reminders'
  | 'exams'
  | 'settings';
