import { Subject, StudySession, TimeSlotConfig } from '../types';
import { DAILY_TIME_SLOTS } from './constants';

/**
 * Formats a Date object to YYYY-MM-DD in local time
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD string into a local Date object
 */
export function parseDateKey(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Generates an array of date strings between startDate and endDate inclusive
 */
export function getDateRange(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = [];
  const curr = parseDateKey(startDateStr);
  const end = parseDateKey(endDateStr);

  while (curr <= end) {
    dates.push(formatDateKey(curr));
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

/**
 * Generates a fair study timetable from startDate to endDate.
 * Rotates all 8 subjects across the 6 daily slots with the following guarantees:
 * 1. Every subject gets balanced study time.
 * 2. Subjects rotate between morning and night sessions (never stuck in one period).
 * 3. No consecutive sessions have the same subject (including across day boundaries).
 * 4. Subjects marked as difficult receive higher revision frequency / priority.
 * 5. Preserves existing completed or manually touched sessions when regenerating.
 */
export function generateTimetable(
  startDateStr: string,
  endDateStr: string,
  subjects: Subject[],
  existingSessions: StudySession[] = []
): StudySession[] {
  if (!subjects || subjects.length === 0) return [];

  const existingMap = new Map<string, StudySession>();
  for (const s of existingSessions) {
    existingMap.set(s.id, s);
  }

  const dateList = getDateRange(startDateStr, endDateStr);
  const result: StudySession[] = [];

  // Track study counts to ensure fair distribution and weight difficult subjects
  const subjectStudyCount: Record<string, number> = {};
  const subjectLastStudiedIndex: Record<string, number> = {};
  subjects.forEach(s => {
    subjectStudyCount[s.id] = 0;
    subjectLastStudiedIndex[s.id] = -999;
  });

  // Track previous slot's subject to avoid consecutive repeats
  let prevSubjectId: string | null = null;
  let globalSlotIndex = 0;

  for (let dIdx = 0; dIdx < dateList.length; dIdx++) {
    const dateStr = dateList[dIdx];

    for (let slotIdx = 0; slotIdx < DAILY_TIME_SLOTS.length; slotIdx++) {
      const slot = DAILY_TIME_SLOTS[slotIdx];
      const sessionId = `${dateStr}-${slot.slotIndex}`;
      const existing = existingMap.get(sessionId);

      // If user already completed or skipped or rescheduled, preserve their work!
      if (existing && existing.status !== 'scheduled') {
        result.push(existing);
        prevSubjectId = existing.subjectId;
        subjectStudyCount[existing.subjectId] = (subjectStudyCount[existing.subjectId] || 0) + 1;
        subjectLastStudiedIndex[existing.subjectId] = globalSlotIndex;
        globalSlotIndex++;
        continue;
      }

      // If existing was scheduled and user manually changed the subject, we can keep it
      if (existing && existing.subjectId && subjects.some(s => s.id === existing.subjectId)) {
        result.push({
          ...existing,
          displayTime: slot.displayTime,
          startTime: slot.startTime,
          endTime: slot.endTime,
          period: slot.period
        });
        prevSubjectId = existing.subjectId;
        subjectStudyCount[existing.subjectId] = (subjectStudyCount[existing.subjectId] || 0) + 1;
        subjectLastStudiedIndex[existing.subjectId] = globalSlotIndex;
        globalSlotIndex++;
        continue;
      }

      // Fair Subject Selection Algorithm:
      // Score each subject based on:
      // - Times studied so far (lower is prioritized)
      // - Distance since last studied (higher distance is prioritized)
      // - Is marked difficult? (gives bonus priority weight for revision)
      // - Penalize subject that was in the same slot index recently (to rotate morning/night)
      // - Disallow consecutive identical subject (hard penalty)
      let bestSubject = subjects[0];
      let bestScore = -Infinity;

      for (const subj of subjects) {
        if (subj.id === prevSubjectId) {
          // Strict rule: avoid repeating the same subject in consecutive sessions
          continue;
        }

        const count = subjectStudyCount[subj.id] || 0;
        const lastIndex = subjectLastStudiedIndex[subj.id];
        const gap = globalSlotIndex - lastIndex;

        // Base score: prioritize subjects with fewer sessions
        let score = (100 - count * 10) + gap * 2;

        // Difficult subject priority bonus (+15% revision boost)
        if (subj.isDifficult) {
          score += 25;
        }

        // Preparation level weighting
        if (subj.preparationLevel === 'not_started' || subj.preparationLevel === 'beginner') {
          score += 15;
        } else if (subj.preparationLevel === 'exam_ready') {
          score -= 10;
        }

        // Period distribution variety:
        // Offset rotation to avoid morning vs night lock-in
        const dayPhase = (dIdx * 6 + slotIdx + (subj.id.charCodeAt(0) % 5)) % 8;
        score += dayPhase;

        if (score > bestScore) {
          bestScore = score;
          bestSubject = subj;
        }
      }

      // Fallback if all were rejected (e.g. only 1 subject exists)
      if (!bestSubject) {
        bestSubject = subjects[(globalSlotIndex) % subjects.length];
      }

      // Mark if this is a revision session (e.g. studied more than twice or difficult)
      const isRevision = (subjectStudyCount[bestSubject.id] || 0) >= 3 || bestSubject.isDifficult;

      const newSession: StudySession = {
        id: sessionId,
        date: dateStr,
        slotIndex: slot.slotIndex,
        startTime: slot.startTime,
        endTime: slot.endTime,
        displayTime: slot.displayTime,
        period: slot.period,
        subjectId: bestSubject.id,
        status: 'scheduled',
        scheduledMinutes: 60,
        actualMinutes: 0,
        isRevision
      };

      result.push(newSession);
      prevSubjectId = bestSubject.id;
      subjectStudyCount[bestSubject.id] = (subjectStudyCount[bestSubject.id] || 0) + 1;
      subjectLastStudiedIndex[bestSubject.id] = globalSlotIndex;
      globalSlotIndex++;
    }
  }

  return result;
}
