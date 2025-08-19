import { useEffect, useMemo, useState } from 'react';
import { firestoreService } from '../services/firestore';
import type { AnswerDoc, ModuleDoc, QuizDoc } from '../types';

export interface ModuleProgress {
  moduleId: string;
  title: string;
  percent: number;
}

export interface StudentDashboardStats {
  loading: boolean;
  error: string | null;
  totalQuizzes: number;
  completedQuizzes: number;
  averageScore: number; // 0-100
  progressPercent: number; // 0-100
  moduleProgress: ModuleProgress[];
}

export const useStudentDashboard = (userId?: string | null): StudentDashboardStats => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizzes, setQuizzes] = useState<(QuizDoc & { id: string })[]>([]);
  const [answers, setAnswers] = useState<(AnswerDoc & { id: string })[]>([]);
  const [modules, setModules] = useState<(ModuleDoc & { id: string })[]>([]);

  useEffect(() => {
    const run = async () => {
      if (!userId) return;
      setLoading(true);
      setError(null);
      try {
        const [qz, ans, mods] = await Promise.all([
          firestoreService.getQuizzes(),
          firestoreService.getAnswersByUser(userId),
          firestoreService.getModules(),
        ]);
        setQuizzes(qz);
        setAnswers(ans);
        setModules(mods);
      } catch (e: any) {
        setError(e?.message || 'Gagal memuat data siswa');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [userId]);

  const { totalQuizzes, completedQuizzes, averageScore, progressPercent, moduleProgress } = useMemo(() => {
  // Auto-enroll concept: show all visible modules to every student
  const visibleModules = modules.filter(m => (m as any).visible ?? true);
  const visibleModuleIds = new Set(visibleModules.map(m => m.id));
  const visibleQuizzes = quizzes.filter(q => !q.moduleId || visibleModuleIds.has(q.moduleId));
    const totalQuizzes = visibleQuizzes.length;

    // Completed quizzes: any quiz that has at least one answer by this user
    const answeredByQuiz = new Map<string, { correct: number; total: number }>();
    answers.forEach(a => {
      const agg = answeredByQuiz.get(a.quizId) || { correct: 0, total: 0 };
      agg.total += 1;
      if (a.isCorrect) agg.correct += 1;
      answeredByQuiz.set(a.quizId, agg);
    });
    const completedQuizzes = answeredByQuiz.size;

    // Average score = average of per-quiz accuracy for this user
    let averageScore = 0;
    const perQuiz = Array.from(answeredByQuiz.values()).map(v => v.total > 0 ? (v.correct / v.total) * 100 : 0);
    if (perQuiz.length > 0) {
      averageScore = perQuiz.reduce((s, v) => s + v, 0) / perQuiz.length;
    }

    const progressPercent = totalQuizzes > 0 ? Math.round((completedQuizzes / totalQuizzes) * 100) : 0;

    // Module progress by quizzes answered belonging to the module
    const moduleQuizCounts = new Map<string, { total: number; done: number }>();
    visibleQuizzes.forEach(q => {
      if (!q.moduleId) return;
      const m = moduleQuizCounts.get(q.moduleId) || { total: 0, done: 0 };
      m.total += 1;
      if (answeredByQuiz.has(q.id)) m.done += 1;
      moduleQuizCounts.set(q.moduleId, m);
    });

    const moduleProgress: ModuleProgress[] = visibleModules.map(m => {
      const cnt = moduleQuizCounts.get(m.id) || { total: 0, done: 0 };
      const percent = cnt.total > 0 ? Math.round((cnt.done / cnt.total) * 100) : 0;
      return { moduleId: m.id, title: m.title, percent };
    });

    return { totalQuizzes, completedQuizzes, averageScore: Math.round(averageScore), progressPercent, moduleProgress };
  }, [quizzes, answers, modules]);

  return { loading, error, totalQuizzes, completedQuizzes, averageScore, progressPercent, moduleProgress };
};
