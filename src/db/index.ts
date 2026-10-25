import Dexie, { Table } from 'dexie';
import { StudySession, Subject, ExamDate, ReminderLog, ReminderSettings, AppSettings } from '../types';
import { INITIAL_SUBJECTS, DEFAULT_REMINDER_SETTINGS, DEFAULT_APP_SETTINGS } from '../utils/constants';
import { generateTimetable } from '../utils/scheduler';

export class StudyMateDB extends Dexie {
  sessions!: Table<StudySession, string>;
  subjects!: Table<Subject, string>;
  exams!: Table<ExamDate, string>;
  reminders!: Table<ReminderLog, string>;
  settings!: Table<{ key: string; value: unknown }, string>;

  constructor() {
    super('StudyMateExamPlannerDB');
    this.version(1).stores({
      sessions: 'id, date, slotIndex, subjectId, status, period',
      subjects: 'id, code, name, isDifficult, preparationLevel',
      exams: 'id, subjectId, examDate',
      reminders: 'id, timestamp, type',
      settings: 'key'
    });
  }
}

export const db = new StudyMateDB();

/**
 * Initializes database with default subjects, timetable, and settings if empty
 */
export async function initializeDatabase(): Promise<void> {
  const subjectCount = await db.subjects.count();

  if (subjectCount === 0) {
    // 1. Seed the 8 subjects
    await db.subjects.bulkAdd(INITIAL_SUBJECTS);

    // 2. Seed initial app settings
    await db.settings.put({ key: 'appSettings', value: DEFAULT_APP_SETTINGS });
    await db.settings.put({ key: 'reminderSettings', value: DEFAULT_REMINDER_SETTINGS });

    // 3. Generate initial timetable from 26 Oct 2026 to 30 Nov 2026
    const initialTimetable = generateTimetable(
      DEFAULT_APP_SETTINGS.startDate,
      DEFAULT_APP_SETTINGS.endDate,
      INITIAL_SUBJECTS
    );

    await db.sessions.bulkAdd(initialTimetable);
    console.log(`StudyMate initialized with ${initialTimetable.length} study sessions.`);
  }
}

/**
 * Exports all database records as a JSON string for backup
 */
export async function exportDatabaseBackup(): Promise<string> {
  const [sessions, subjects, exams, reminders, settings] = await Promise.all([
    db.sessions.toArray(),
    db.subjects.toArray(),
    db.exams.toArray(),
    db.reminders.toArray(),
    db.settings.toArray()
  ]);

  const backupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    appName: 'StudyMate – Exam Planner',
    data: {
      sessions,
      subjects,
      exams,
      reminders,
      settings
    }
  };

  return JSON.stringify(backupData, null, 2);
}

/**
 * Imports database records from a parsed JSON backup
 */
export async function importDatabaseBackup(jsonString: string): Promise<boolean> {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !parsed.data) {
      throw new Error('Invalid backup file format');
    }

    const { sessions, subjects, exams, reminders, settings } = parsed.data;

    await db.transaction('rw', [db.sessions, db.subjects, db.exams, db.reminders, db.settings], async () => {
      await db.sessions.clear();
      await db.subjects.clear();
      await db.exams.clear();
      await db.reminders.clear();
      await db.settings.clear();

      if (Array.isArray(sessions) && sessions.length > 0) await db.sessions.bulkAdd(sessions);
      if (Array.isArray(subjects) && subjects.length > 0) await db.subjects.bulkAdd(subjects);
      if (Array.isArray(exams) && exams.length > 0) await db.exams.bulkAdd(exams);
      if (Array.isArray(reminders) && reminders.length > 0) await db.reminders.bulkAdd(reminders);
      if (Array.isArray(settings) && settings.length > 0) await db.settings.bulkAdd(settings);
    });

    return true;
  } catch (err) {
    console.error('Failed to import backup:', err);
    return false;
  }
}

/**
 * Resets database back to default initial state
 */
export async function resetDatabaseToDefaults(): Promise<void> {
  await db.transaction('rw', [db.sessions, db.subjects, db.exams, db.reminders, db.settings], async () => {
    await db.sessions.clear();
    await db.subjects.clear();
    await db.exams.clear();
    await db.reminders.clear();
    await db.settings.clear();

    await db.subjects.bulkAdd(INITIAL_SUBJECTS);
    await db.settings.put({ key: 'appSettings', value: DEFAULT_APP_SETTINGS });
    await db.settings.put({ key: 'reminderSettings', value: DEFAULT_REMINDER_SETTINGS });

    const initialTimetable = generateTimetable(
      DEFAULT_APP_SETTINGS.startDate,
      DEFAULT_APP_SETTINGS.endDate,
      INITIAL_SUBJECTS
    );

    await db.sessions.bulkAdd(initialTimetable);
  });
}
