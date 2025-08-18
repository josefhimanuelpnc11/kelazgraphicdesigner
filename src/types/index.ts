import { Timestamp } from 'firebase/firestore';

export type UserRole = 'student' | 'teacher';

export interface UserDoc {
  name: string;
  email: string;
  role: UserRole;
  createdAt: Timestamp;
}

export interface ModuleDoc {
  title: string;
  description?: string;
  createdBy: string; // uid guru
  createdAt: Timestamp;
  order?: number;
}

export interface LessonDoc {
  title: string;
  content?: string; // rich text / markdown
  assets?: string[]; // URLs storage
  order?: number;
  createdAt: Timestamp;
}

export interface QuizDoc {
  moduleId?: string;
  lessonId?: string;
  title: string;
  createdBy: string; // uid guru
  createdAt: Timestamp;
  timeLimitSec?: number;
}

export type QuestionType = 'multiple_choice' | 'checkboxes' | 'dropdown' | 'short_answer' | 'paragraph';

export interface QuestionDoc {
  type: QuestionType;
  text: string;
  options?: string[]; // untuk pilihan ganda / checkbox / dropdown
  correctIndex?: number; // untuk single choice (multiple_choice/dropdown)
  correctIndexes?: number[]; // untuk checkboxes (banyak jawaban benar)
  order?: number;
}

export interface AnswerDoc {
  userId: string;
  quizId: string;
  questionId: string;
  selectedIndex: number;
  isCorrect: boolean;
  answeredAt: Timestamp;
}

export interface ProgressDoc {
  scores: Record<string, number>; // { [quizId]: scorePercent }
  updatedAt: Timestamp;
}
