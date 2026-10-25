import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Trash2,
  Edit2,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { ExamDate, Subject, AppSettings } from '../types';
import { parseDateKey } from '../utils/scheduler';

interface Props {
  exams: ExamDate[];
  subjects: Subject[];
  appSettings: AppSettings;
  currentDateStr: string;
  onAddExam: (exam: Omit<ExamDate, 'id'>) => void;
  onDeleteExam: (id: string) => void;
  onUpdateExam: (exam: ExamDate) => void;
}

export const ExamsPage: React.FC<Props> = ({
  exams,
  subjects,
  appSettings,
  currentDateStr,
  onAddExam,
  onDeleteExam,
  onUpdateExam,
}) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingExam, setEditingExam] = useState<ExamDate | null>(null);

  // Form State
  const [formSubjectId, setFormSubjectId] = useState<string>(subjects[0]?.id || 'rm');
  const [formDate, setFormDate] = useState<string>('2026-11-25');
  const [formStartTime, setFormStartTime] = useState<string>('09:00');
  const [formEndTime, setFormEndTime] = useState<string>('12:00');
  const [formLocation, setFormLocation] = useState<string>('Main Examination Hall');
  const [formNotes, setFormNotes] = useState<string>('Bring university student ID and admission card');

  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>();
    subjects.forEach(s => map.set(s.id, s));
    return map;
  }, [subjects]);

  const sortedExams = useMemo(() => {
    return [...exams].sort((a, b) => a.examDate.localeCompare(b.examDate) || a.startTime.localeCompare(b.startTime));
  }, [exams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExam) {
      onUpdateExam({
        ...editingExam,
        subjectId: formSubjectId,
        examDate: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
        location: formLocation,
        notes: formNotes
      });
      setEditingExam(null);
    } else {
      onAddExam({
        subjectId: formSubjectId,
        examDate: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
        location: formLocation,
        notes: formNotes
      });
    }
    setShowAddModal(false);
  };

  const handleOpenEdit = (exam: ExamDate) => {
    setEditingExam(exam);
    setFormSubjectId(exam.subjectId);
    setFormDate(exam.examDate);
    setFormStartTime(exam.startTime);
    setFormEndTime(exam.endTime);
    setFormLocation(exam.location || '');
    setFormNotes(exam.notes || '');
    setShowAddModal(true);
  };

  const handleOpenAdd = () => {
    setEditingExam(null);
    setFormSubjectId(subjects[0]?.id || 'rm');
    setFormDate('2026-11-25');
    setFormStartTime('09:00');
    setFormEndTime('12:00');
    setFormLocation('Main Examination Hall');
    setFormNotes('Bring university student ID and admission card');
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Official University Examination Timetable
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-xs font-bold">
              {exams.length} Exams Recorded
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Expected Examination Period begins in the last week of November 2026. Enter confirmed dates as your university releases the official timetable.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition self-start md:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Add Official Exam Date</span>
        </button>
      </div>

      {/* Expected Period Reminder Card */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 dark:text-amber-200">
          <p className="font-extrabold">Notice on Estimated Examination Schedule</p>
          <p className="mt-0.5 text-amber-700 dark:text-amber-300">
            Per project requirements, the examination period is estimated to begin in the last week of November 2026. Specific subject dates will appear below as you input them from your faculty circular.
          </p>
        </div>
      </div>

      {/* Exams List */}
      {sortedExams.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <GraduationCap className="w-12 h-12 text-purple-600 mx-auto" />
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            No Exam Dates Entered Yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Once your department or exam board releases the schedule, add your papers here to track live countdowns and room locations.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-purple-600 text-white hover:bg-purple-700 shadow-sm"
          >
            Add Your First Exam Date
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedExams.map(ex => {
            const subj = subjectMap.get(ex.subjectId);
            const exDate = parseDateKey(ex.examDate);
            const currDate = parseDateKey(currentDateStr);
            const diffDays = Math.ceil((exDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));

            return (
              <div
                key={ex.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs text-slate-900 border"
                        style={{ backgroundColor: subj?.color, borderColor: subj?.borderColor }}
                      >
                        {subj?.code}
                      </div>
                      <div>
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                          {subj?.name}
                        </h4>
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                          {ex.examDate}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                        diffDays > 0
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          : diffDays === 0
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {diffDays > 0 ? `${diffDays} Days Left` : diffDays === 0 ? 'Today!' : 'Completed'}
                    </span>
                  </div>

                  {/* Exam details */}
                  <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ex.startTime} – {ex.endTime} (3 Hours)</span>
                    </div>

                    {ex.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>Venue: {ex.location}</span>
                      </div>
                    )}

                    {ex.notes && (
                      <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-100 dark:border-slate-800 mt-2">
                        {ex.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleOpenEdit(ex)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Edit exam details"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteExam(ex.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Delete exam date"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Exam Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {editingExam ? 'Edit Exam Date' : 'Add Official Exam Date'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Subject</label>
              <select
                value={formSubjectId}
                onChange={(e) => setFormSubjectId(e.target.value)}
                className="mt-1 w-full text-xs font-bold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Date</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="mt-1 w-full text-xs font-bold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Start Time</label>
                <input
                  type="time"
                  required
                  value={formStartTime}
                  onChange={(e) => setFormStartTime(e.target.value)}
                  className="mt-1 w-full text-xs font-bold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">End Time</label>
                <input
                  type="time"
                  required
                  value={formEndTime}
                  onChange={(e) => setFormEndTime(e.target.value)}
                  className="mt-1 w-full text-xs font-bold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Hall / Room</label>
                <input
                  type="text"
                  placeholder="Hall A / Room 204"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="mt-1 w-full text-xs font-bold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Notes / Instructions</label>
              <textarea
                rows={2}
                placeholder="ID card, calculator allowed, etc."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="mt-1 w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700"
              >
                {editingExam ? 'Save Changes' : 'Add Exam'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
