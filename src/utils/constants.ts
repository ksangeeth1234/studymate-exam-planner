import { Subject, TimeSlotConfig, ReminderSettings, AppSettings } from '../types';

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'rm',
    code: 'RM',
    name: 'Research Methodology',
    color: '#f5f3ff', // Soft violet
    borderColor: '#c4b5fd',
    badgeBg: 'bg-purple-100 dark:bg-purple-950/60',
    textColor: 'text-purple-700 dark:text-purple-300',
    isDifficult: false,
    preparationLevel: 'not_started',
    targetHours: 35,
    notes: 'Literature reviews, quantitative & qualitative methodologies, research ethics, and referencing.'
  },
  {
    id: 'esta',
    code: 'ESTA',
    name: 'ESTA',
    color: '#ecfdf5', // Soft emerald
    borderColor: '#a7f3d0',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    isDifficult: false,
    preparationLevel: 'not_started',
    targetHours: 35,
    notes: 'Enterprise Systems, software architectures, enterprise standards, and integrations.'
  },
  {
    id: 'hci',
    code: 'HCI',
    name: 'HCI (Human-Computer Interaction)',
    color: '#f0f9ff', // Soft sky blue
    borderColor: '#bae6fd',
    badgeBg: 'bg-sky-100 dark:bg-sky-950/60',
    textColor: 'text-sky-700 dark:text-sky-300',
    isDifficult: false,
    preparationLevel: 'not_started',
    targetHours: 35,
    notes: 'User cognitive models, heuristic evaluations, usability testing, and interaction paradigms.'
  },
  {
    id: 'uiux',
    code: 'UI/UX',
    name: 'UI/UX Design',
    color: '#fdf2f8', // Soft pink/magenta
    borderColor: '#fbcfe8',
    badgeBg: 'bg-pink-100 dark:bg-pink-950/60',
    textColor: 'text-pink-700 dark:text-pink-300',
    isDifficult: false,
    preparationLevel: 'not_started',
    targetHours: 35,
    notes: 'Design systems, wireframing, typography, color theory, accessibility (WCAG), and prototyping.'
  },
  {
    id: 'cloud',
    code: 'Cloud',
    name: 'Cloud Computing',
    color: '#eef2ff', // Soft indigo
    borderColor: '#c7d2fe',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-950/60',
    textColor: 'text-indigo-700 dark:text-indigo-300',
    isDifficult: false,
    preparationLevel: 'not_started',
    targetHours: 35,
    notes: 'Virtualization, microservices, Docker, Kubernetes, AWS/GCP architectures, serverless computing.'
  },
  {
    id: 'testing',
    code: 'Testing',
    name: 'Software Testing',
    color: '#fffbeb', // Soft amber
    borderColor: '#fde68a',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/60',
    textColor: 'text-amber-700 dark:text-amber-300',
    isDifficult: false,
    preparationLevel: 'not_started',
    targetHours: 35,
    notes: 'Unit testing, TDD/BDD, boundary value analysis, regression testing, automated test suites.'
  },
  {
    id: 'android',
    code: 'Android',
    name: 'Android Development',
    color: '#f0fdf4', // Soft green / teal
    borderColor: '#bbf7d0',
    badgeBg: 'bg-teal-100 dark:bg-teal-950/60',
    textColor: 'text-teal-700 dark:text-teal-300',
    isDifficult: false,
    preparationLevel: 'not_started',
    targetHours: 35,
    notes: 'Kotlin, Jetpack Compose, Android lifecycle, Coroutines, MVVM architecture, Room database.'
  },
  {
    id: 'realtime',
    code: 'RTP',
    name: 'Real-Time Programming',
    color: '#fff1f2', // Soft rose
    borderColor: '#fecdd3',
    badgeBg: 'bg-rose-100 dark:bg-rose-950/60',
    textColor: 'text-rose-700 dark:text-rose-300',
    isDifficult: false,
    preparationLevel: 'not_started',
    targetHours: 35,
    notes: 'POSIX threads, concurrency, race conditions, semaphores/mutexes, real-time operating systems (RTOS).'
  }
];

export const DAILY_TIME_SLOTS: TimeSlotConfig[] = [
  {
    slotIndex: 0,
    period: 'morning',
    startTime: '03:00',
    endTime: '04:00',
    displayTime: '3:00 AM – 4:00 AM',
    reminderTime: '03:00'
  },
  {
    slotIndex: 1,
    period: 'morning',
    startTime: '04:00',
    endTime: '05:00',
    displayTime: '4:00 AM – 5:00 AM',
    reminderTime: '04:00'
  },
  {
    slotIndex: 2,
    period: 'night',
    startTime: '20:00',
    endTime: '21:00',
    displayTime: '8:00 PM – 9:00 PM',
    reminderTime: '20:00'
  },
  {
    slotIndex: 3,
    period: 'night',
    startTime: '21:00',
    endTime: '22:00',
    displayTime: '9:00 PM – 10:00 PM',
    reminderTime: '21:00'
  },
  {
    slotIndex: 4,
    period: 'night',
    startTime: '22:00',
    endTime: '23:00',
    displayTime: '10:00 PM – 11:00 PM',
    reminderTime: '22:00'
  },
  {
    slotIndex: 5,
    period: 'night',
    startTime: '23:00',
    endTime: '00:00',
    displayTime: '11:00 PM – 12:00 AM',
    reminderTime: '23:00'
  }
];

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: true,
  morningRemindersEnabled: true,
  nightRemindersEnabled: true,
  soundEnabled: true,
  snoozeMinutes: 5,
  customTimes: {
    morningAlert: '02:55',
    morningS1: '03:00',
    morningS2: '04:00',
    nightAlert: '19:55',
    nightS1: '20:00',
    nightS2: '21:00',
    nightS3: '22:00',
    nightS4: '23:00'
  }
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  startDate: '2026-10-26',
  endDate: '2026-11-30',
  examPeriodStart: '2026-11-23', // Expected last week of November 2026
  darkMode: false,
  breakDurationMinutes: 5,
  developerName: 'Kavindu Sangeeth Silpage'
};

export const MOTIVATIONAL_QUOTES = [
  "Early mornings and late nights build extraordinary mastery. Keep going!",
  "Small daily efforts compound into effortless exam day confidence.",
  "Focus on one concept at a time. Consistency beats intensity.",
  "Your dedication today creates tomorrow's academic triumph.",
  "Clear mind, focused effort, unstoppable progress.",
  "Success in examinations is the sum of small sessions repeated day after day.",
  "Study with intention, take mindful breaks, and believe in your preparation.",
  "Every problem you solve today is a question you conquer on exam day.",
  "Great achievements are nurtured by discipline, patience, and steady focus.",
  "Trust the process. Your routine is your greatest superpower."
];
