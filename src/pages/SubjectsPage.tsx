import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  Sparkles,
  Edit2,
  Save,
  Check
} from 'lucide-react';
import { Subject, PreparationLevel, StudySession } from '../types';

interface Props {
  subjects: Subject[];
  sessions: StudySession[];
  onUpdateSubject: (subject: Subject) => void;
  onNavigateToPage: (page: any) => void;
}

const PREPARATION_LEVELS: { id: PreparationLevel; label: string; desc: string; badge: string }[] = [
  { id: 'not_started', label: 'Not Started', desc: 'No syllabus reviewed yet', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  { id: 'beginner', label: 'Beginner', desc: 'Initial reading & notes', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
  { id: 'improving', label: 'Improving', desc: 'Practicing questions & labs', badge: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' },
  { id: 'good', label: 'Good', desc: 'Solid grasp of core theories', badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' },
  { id: 'exam_ready', label: 'Exam Ready', desc: 'Past papers & full recall', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
];

export const SubjectsPage: React.FC<Props> = ({
  subjects,
  sessions,
  onUpdateSubject,
  onNavigateToPage,
}) => {
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<string>('');
  const [editTargetHours, setEditTargetHours] = useState<number>(35);

  // Calculate real metrics per subject
  const subjectMetrics = useMemo(() => {
    const map: Record<string, { totalSessions: number; completedSessions: number; hoursStudied: number }> = {};
    subjects.forEach(s => {
      map[s.id] = { totalSessions: 0, completedSessions: 0, hoursStudied: 0 };
    });

    for (const session of sessions) {
      if (map[session.subjectId]) {
        map[session.subjectId].totalSessions += 1;
        if (session.status === 'completed') {
          map[session.subjectId].completedSessions += 1;
          map[session.subjectId].hoursStudied += (session.actualMinutes || 60) / 60;
        }
      }
    }
    return map;
  }, [subjects, sessions]);

  const handleStartEdit = (subject: Subject) => {
    setEditingSubjectId(subject.id);
    setEditNotes(subject.notes || '');
    setEditTargetHours(subject.targetHours || 35);
  };

  const handleSaveEdit = (subject: Subject) => {
    onUpdateSubject({
      ...subject,
      notes: editNotes,
      targetHours: editTargetHours
    });
    setEditingSubjectId(null);
  };

  const handleToggleDifficult = (subject: Subject) => {
    onUpdateSubject({
      ...subject,
      isDifficult: !subject.isDifficult
    });
  };

  const handleSetPrepLevel = (subject: Subject, level: PreparationLevel) => {
    onUpdateSubject({
      ...subject,
      preparationLevel: level
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              University Examination Subjects
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-xs font-bold">
              8 Subjects Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Configure preparation readiness and mark difficult topics. The automatic scheduler gives higher revision priority to subjects flagged as difficult.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/60 text-xs text-purple-800 dark:text-purple-300">
            <span className="font-extrabold block">Revision Weighting</span>
            <span className="text-[11px] text-purple-600 dark:text-purple-400">Difficult subjects receive extra slots</span>
          </div>
        </div>
      </div>

      {/* 8 Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {subjects.map(subject => {
          const stats = subjectMetrics[subject.id] || { totalSessions: 0, completedSessions: 0, hoursStudied: 0 };
          const progressPercent = Math.min(100, Math.round((stats.hoursStudied / (subject.targetHours || 35)) * 100));
          const isEditing = editingSubjectId === subject.id;

          return (
            <div
              key={subject.id}
              className={`rounded-3xl p-5 sm:p-6 border transition-all ${
                subject.isDifficult
                  ? 'border-rose-300 dark:border-rose-900/60 bg-gradient-to-br from-white via-white to-rose-50/30 dark:from-slate-900 dark:to-rose-950/10'
                  : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              {/* Top row: Code, Name, Difficult Toggle */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm text-slate-900 shadow-xs border"
                    style={{ backgroundColor: subject.color, borderColor: subject.borderColor }}
                  >
                    {subject.code}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                      {subject.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Target: {subject.targetHours}h • Completed: {stats.hoursStudied.toFixed(1)}h
                    </p>
                  </div>
                </div>

                {/* Difficult Subject Flag Button */}
                <button
                  onClick={() => handleToggleDifficult(subject)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition border ${
                    subject.isDifficult
                      ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-rose-600'
                  }`}
                  title="Toggle difficult subject status to increase revision frequency"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{subject.isDifficult ? 'Difficult ★' : 'Mark Difficult'}</span>
                </button>
              </div>

              {/* Preparation Level Selector */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Preparation Level
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {PREPARATION_LEVELS.map(lvl => {
                    const isSelected = subject.preparationLevel === lvl.id;
                    return (
                      <button
                        key={lvl.id}
                        onClick={() => handleSetPrepLevel(subject, lvl.id)}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition text-center truncate ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                        title={lvl.desc}
                      >
                        {lvl.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Progress Bar towards target hours */}
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span>Target Hours Progress</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Syllabus / Study Notes */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                {isEditing ? (
                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500">Target Study Hours:</label>
                      <input
                        type="number"
                        min="5"
                        max="100"
                        value={editTargetHours}
                        onChange={(e) => setEditTargetHours(Number(e.target.value))}
                        className="w-24 ml-2 text-xs font-bold p-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500">Key Focus Topics & Notes:</label>
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        rows={3}
                        className="w-full text-xs p-2.5 rounded-xl border border-purple-300 dark:border-purple-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingSubjectId(null)}
                        className="px-2.5 py-1 text-xs rounded-lg text-slate-500"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(subject)}
                        className="flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                      >
                        <Save className="w-3 h-3" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
                      {subject.notes || 'No key topics entered yet.'}
                    </p>
                    <button
                      onClick={() => handleStartEdit(subject)}
                      className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 flex items-center gap-1 shrink-0"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
