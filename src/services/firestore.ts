import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc,
  deleteDoc,
  writeBatch,
  query, 
  where, 
  orderBy, 
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import type { ModuleDoc, LessonDoc, QuizDoc, QuestionDoc, AnswerDoc, ProgressDoc, UserDoc, EnrollmentDoc } from '../types';

export const firestoreService = {
  // ===== MODULES =====
  async getModules(): Promise<(ModuleDoc & { id: string })[]> {
    try {
      const modulesRef = collection(db, 'modules');
      // Simplified query to avoid index requirement
      const q = query(modulesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      let modules = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as ModuleDoc
      }));
      
      // Sort by order in memory if order field exists
      modules.sort((a, b) => (a.order || 999) - (b.order || 999));
      
      return modules;
    } catch (error) {
      console.error('Error getting modules:', error);
      throw error;
    }
  },

  async createModule(moduleData: Omit<ModuleDoc, 'createdAt'>): Promise<string> {
    try {
      const moduleRef = await addDoc(collection(db, 'modules'), {
        ...moduleData,
        createdAt: serverTimestamp()
      });
      return moduleRef.id;
    } catch (error) {
      console.error('Error creating module:', error);
      throw error;
    }
  },

  async updateModule(moduleId: string, data: Partial<ModuleDoc>): Promise<void> {
    try {
      await updateDoc(doc(db, 'modules', moduleId), data);
    } catch (error) {
      console.error('Error updating module:', error);
      throw error;
    }
  },

  async deleteModule(moduleId: string): Promise<void> {
    try {
      // Delete lessons in subcollection first (client-side recursive delete)
      const lessonsSnap = await getDocs(collection(db, 'modules', moduleId, 'lessons'));
      if (!lessonsSnap.empty) {
        const batch = writeBatch(db);
        lessonsSnap.forEach((lessonDoc) => {
          batch.delete(doc(db, 'modules', moduleId, 'lessons', lessonDoc.id));
        });
        await batch.commit();
      }

      // Delete the module document
      await deleteDoc(doc(db, 'modules', moduleId));
    } catch (error) {
      console.error('Error deleting module:', error);
      throw error;
    }
  },

  async getModuleWithLessons(moduleId: string): Promise<(ModuleDoc & { id: string; lessons: (LessonDoc & { id: string })[] }) | null> {
    try {
      const moduleDoc = await getDoc(doc(db, 'modules', moduleId));
      if (!moduleDoc.exists()) return null;
      
      const module = { id: moduleDoc.id, ...moduleDoc.data() as ModuleDoc };
      const lessons = await this.getLessons(moduleId);
      
      return { ...module, lessons };
    } catch (error) {
      console.error('Error getting module with lessons:', error);
      throw error;
    }
  },

  // ===== LESSONS =====
  async getLessons(moduleId: string): Promise<(LessonDoc & { id: string })[]> {
    try {
      const lessonsRef = collection(db, 'modules', moduleId, 'lessons');
      // Simplified query to avoid index requirement
      const q = query(lessonsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      let lessons = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as LessonDoc
      }));
      
      // Sort by order in memory if order field exists
      lessons.sort((a, b) => (a.order || 999) - (b.order || 999));
      
      return lessons;
    } catch (error) {
      console.error('Error getting lessons:', error);
      throw error;
    }
  },

  async getAllLessons(): Promise<(LessonDoc & { id: string })[]> {
    try {
      const modules = await this.getModules();
      const allLessons: (LessonDoc & { id: string })[] = [];
      
      for (const module of modules) {
        const lessons = await this.getLessons(module.id);
        allLessons.push(...lessons);
      }
      
      return allLessons;
    } catch (error) {
      console.error('Error getting all lessons:', error);
      return [];
    }
  },

  async getAllLessonsCount(): Promise<number> {
    try {
      const modules = await this.getModules();
      let totalLessons = 0;
      
      for (const module of modules) {
        const lessons = await this.getLessons(module.id);
        totalLessons += lessons.length;
      }
      
      return totalLessons;
    } catch (error) {
      console.error('Error getting lessons count:', error);
      return 0;
    }
  },

  async createLesson(moduleId: string, lessonData: Omit<LessonDoc, 'createdAt'>): Promise<string> {
    try {
      const lessonsRef = collection(db, 'modules', moduleId, 'lessons');
      const lessonRef = await addDoc(lessonsRef, {
        ...lessonData,
        createdAt: serverTimestamp()
      });
      return lessonRef.id;
    } catch (error) {
      console.error('Error creating lesson:', error);
      throw error;
    }
  },

  async updateLesson(moduleId: string, lessonId: string, data: Partial<LessonDoc>): Promise<void> {
    try {
      await updateDoc(doc(db, 'modules', moduleId, 'lessons', lessonId), data);
    } catch (error) {
      console.error('Error updating lesson:', error);
      throw error;
    }
  },

  async deleteLesson(moduleId: string, lessonId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'modules', moduleId, 'lessons', lessonId));
    } catch (error) {
      console.error('Error deleting lesson:', error);
      throw error;
    }
  },

  // ===== QUIZZES =====
  async getQuizzes(moduleId?: string): Promise<(QuizDoc & { id: string })[]> {
    try {
      const quizzesRef = collection(db, 'quizzes');
      let q;
      
      if (moduleId) {
        q = query(quizzesRef, where('moduleId', '==', moduleId), orderBy('createdAt', 'desc'));
      } else {
        q = query(quizzesRef, orderBy('createdAt', 'desc'));
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as QuizDoc
      }));
    } catch (error) {
      console.error('Error getting quizzes:', error);
      return [];
    }
  },

  async createQuiz(quizData: Omit<QuizDoc, 'createdAt'>): Promise<string> {
    try {
      const quizRef = await addDoc(collection(db, 'quizzes'), {
        ...quizData,
        createdAt: serverTimestamp()
      });
      return quizRef.id;
    } catch (error) {
      console.error('Error creating quiz:', error);
      throw error;
    }
  },

  async addQuestionToQuiz(quizId: string, questionData: Omit<QuestionDoc, 'order'>): Promise<string> {
    try {
      const questionsRef = collection(db, 'quizzes', quizId, 'questions');
      const questionRef = await addDoc(questionsRef, {
        ...questionData,
        order: 1 // We can calculate proper order later
      });
      return questionRef.id;
    } catch (error) {
      console.error('Error adding question to quiz:', error);
      throw error;
    }
  },

  async updateQuiz(quizId: string, data: Partial<QuizDoc>): Promise<void> {
    try {
      await updateDoc(doc(db, 'quizzes', quizId), data);
    } catch (error) {
      console.error('Error updating quiz:', error);
      throw error;
    }
  },

  async deleteQuiz(quizId: string): Promise<void> {
    try {
      // Delete subcollection questions
      const questionsSnap = await getDocs(collection(db, 'quizzes', quizId, 'questions'));
      if (!questionsSnap.empty) {
        const batch = writeBatch(db);
        questionsSnap.forEach((qDoc) => {
          batch.delete(doc(db, 'quizzes', quizId, 'questions', qDoc.id));
        });
        await batch.commit();
      }

      // Best-effort: delete answers referencing this quiz
      const answersRef = collection(db, 'answers');
      const answersSnap = await getDocs(query(answersRef, where('quizId', '==', quizId)));
      if (!answersSnap.empty) {
        const batch = writeBatch(db);
        answersSnap.forEach((aDoc) => batch.delete(doc(db, 'answers', aDoc.id)));
        await batch.commit();
      }

      // Delete the quiz document
      await deleteDoc(doc(db, 'quizzes', quizId));
    } catch (error) {
      console.error('Error deleting quiz:', error);
      throw error;
    }
  },

  async getQuestions(quizId: string): Promise<(QuestionDoc & { id: string })[]> {
    try {
      const qsRef = collection(db, 'quizzes', quizId, 'questions');
      // If order field exists, Firestore may require index; we'll just fetch and sort client-side
      const snap = await getDocs(qsRef);
      const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as QuestionDoc) }));
      // Client-side sort by order if present
      items.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      return items;
    } catch (error) {
      console.error('Error getting questions:', error);
      return [];
    }
  },

  // ===== ANSWERS =====
  async getAnswersByUser(userId: string, quizId?: string): Promise<(AnswerDoc & { id: string })[]> {
    try {
      const answersRef = collection(db, 'answers');
      let q;
      
      if (quizId) {
        q = query(
          answersRef,
          where('userId', '==', userId),
          where('quizId', '==', quizId),
          orderBy('answeredAt', 'desc')
        );
      } else {
        q = query(answersRef, where('userId', '==', userId), orderBy('answeredAt', 'desc'));
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as AnswerDoc
      }));
    } catch (error) {
      console.error('Error getting answers:', error);
      return [];
    }
  },

  // ===== PROGRESS =====
  async getUserProgress(userId: string, moduleId?: string): Promise<(ProgressDoc & { id: string })[]> {
    try {
      const progressRef = collection(db, 'progress');
      let q;
      
      if (moduleId) {
        q = query(
          progressRef,
          where('userId', '==', userId),
          where('moduleId', '==', moduleId)
        );
      } else {
        q = query(progressRef, where('userId', '==', userId));
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as ProgressDoc
      }));
    } catch (error) {
      console.error('Error getting user progress:', error);
      return [];
    }
  },

  // ===== ENROLLMENTS =====
  async getEnrollmentsByUser(userId: string): Promise<(EnrollmentDoc & { id: string })[]> {
    try {
      const ref = collection(db, 'enrollments');
      const snap = await getDocs(query(ref, where('userId', '==', userId)));
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as EnrollmentDoc) }));
    } catch (error) {
      console.error('Error getting enrollments:', error);
      return [];
    }
  },

  async enrollUserToModule(userId: string, moduleId: string): Promise<string> {
    try {
      const ref = await addDoc(collection(db, 'enrollments'), {
        userId,
        moduleId,
        enrolledAt: serverTimestamp()
      } as any);
      return ref.id;
    } catch (error) {
      console.error('Error creating enrollment:', error);
      throw error;
    }
  },

  async unenrollUser(enrollmentId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'enrollments', enrollmentId));
    } catch (error) {
      console.error('Error deleting enrollment:', error);
      throw error;
    }
  },

  // ===== ANALYTICS =====
  async getStudentCount(): Promise<number> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'student'));
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting student count:', error);
      return 0;
    }
  },

  // ===== USERS (Admin/Guru management) =====
  async updateUser(uid: string, data: Partial<UserDoc>): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), data as any);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  async deleteUser(uid: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  async getStudents(): Promise<(UserDoc & { id: string })[]> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'student'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as UserDoc
      }));
    } catch (error) {
      console.error('Error getting students:', error);
      return [];
    }
  },

  async getAnalytics(): Promise<{
    totalStudents: number;
    totalQuizzes: number;
    totalSubmissions: number;
    completedQuizzes: number;
    avgScore: number;
    completionRate: number;
  }> {
    try {
      const [totalStudents, totalQuizzes, completedQuizzes, avgScore] = await Promise.all([
        this.getStudentCount(),
        this.getTotalQuizzes(),
        this.getCompletedQuizzes(),
        this.getAverageQuizScore()
      ]);

      // Calculate total submissions (all quiz answers)
      const totalSubmissions = await this.getTotalSubmissions();

      // Calculate completion rate (simplified)
      const completionRate = totalStudents > 0 ? (completedQuizzes / totalStudents) * 100 : 0;

      return {
        totalStudents,
        totalQuizzes,
        totalSubmissions,
        completedQuizzes,
        avgScore,
        completionRate
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      return {
        totalStudents: 0,
        totalQuizzes: 0,
        totalSubmissions: 0,
        completedQuizzes: 0,
        avgScore: 0,
        completionRate: 0
      };
    }
  },

  async getTotalQuizzes(): Promise<number> {
    try {
      const quizzesRef = collection(db, 'quizzes');
      const snapshot = await getDocs(quizzesRef);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting total quizzes:', error);
      return 0;
    }
  },

  async getTotalSubmissions(): Promise<number> {
    try {
      const answersRef = collection(db, 'answers');
      const snapshot = await getDocs(answersRef);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting total submissions:', error);
      return 0;
    }
  },

  async getCompletedQuizzes(): Promise<number> {
    try {
      const answersRef = collection(db, 'answers');
      const snapshot = await getDocs(answersRef);
      
      // Group by userId and quizId to count unique completions
      const completions = new Set();
      snapshot.forEach(doc => {
        const answer = doc.data() as AnswerDoc;
        completions.add(`${answer.userId}-${answer.quizId}`);
      });
      
      return completions.size;
    } catch (error) {
      console.error('Error getting completed quizzes count:', error);
      return 0;
    }
  },

  async getAverageQuizScore(): Promise<number> {
    try {
      const answersRef = collection(db, 'answers');
      const snapshot = await getDocs(answersRef);
      
      if (snapshot.empty) return 0;
      
      const scores: { [quizUserId: string]: { correct: number; total: number } } = {};
      
      snapshot.forEach(doc => {
        const answer = doc.data() as AnswerDoc;
        const key = `${answer.userId}-${answer.quizId}`;
        
        if (!scores[key]) {
          scores[key] = { correct: 0, total: 0 };
        }
        
        scores[key].total++;
        if (answer.isCorrect) {
          scores[key].correct++;
        }
      });
      
      const quizScores = Object.values(scores).map(score => 
        score.total > 0 ? (score.correct / score.total) * 100 : 0
      );
      
      return quizScores.length > 0 
        ? quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length 
        : 0;
    } catch (error) {
      console.error('Error getting average quiz score:', error);
      return 0;
    }
  },

  // ===== SAMPLE DATA =====
  async createSampleData(teacherUid: string): Promise<void> {
    try {
      console.log('Creating sample data...');

      // Create sample modules
      const module1Id = await this.createModule({
        title: 'Dasar-dasar Desain',
        description: 'Pelajari prinsip-prinsip dasar desain grafis termasuk teori warna, tipografi, dan komposisi.',
        createdBy: teacherUid,
        order: 1
      });

      const module2Id = await this.createModule({
        title: 'Tipografi & Tata Letak',
        description: 'Kuasai seni tipografi dan buat tata letak menakjub untuk berbagai media.',
        createdBy: teacherUid,
        order: 2
      });

      const module3Id = await this.createModule({
        title: 'Tools Desain Digital',
        description: 'Kuasai software desain populer dan teknik desain digital.',
        createdBy: teacherUid,
        order: 3
      });

      // Create sample lessons for Module 1
      await this.createLesson(module1Id, {
        title: 'Pengenalan Prinsip Desain',
        content: 'Selamat datang di dunia desain grafis! Dalam materi ini, kita akan menjelajahi prinsip-prinsip dasar yang memandu semua desain yang baik.',
        order: 1
      });

      await this.createLesson(module1Id, {
        title: 'Dasar-dasar Teori Warna',
        content: 'Memahami hubungan warna, roda warna, dan cara membuat palet warna yang efektif untuk desain Anda.',
        order: 2
      });

      // Create sample lessons for Module 2
      await this.createLesson(module2Id, {
        title: 'Dasar Tipografi',
        content: 'Pelajari tentang berbagai jenis font, spasi, hierarki, dan bagaimana tipografi mempengaruhi keterbacaan dan suasana.',
        order: 1
      });

      await this.createLesson(module2Id, {
        title: 'Tata Letak dan Komposisi',
        content: 'Kuasai sistem grid, ruang kosong, dan keseimbangan visual untuk menciptakan tata letak yang menarik.',
        order: 2
      });

      // Create lesson for Module 3
      await this.createLesson(module3Id, {
        title: 'Tinjauan Tools Desain Digital',
        content: 'Pelajari tentang software desain paling populer dan cara memilih tools yang tepat untuk proyek Anda.',
        order: 1
      });

      // Create sample quizzes
      const quiz1Id = await this.createQuiz({
        moduleId: module1Id,
        title: 'Kuis Prinsip Desain',
        createdBy: teacherUid,
        timeLimitSec: 600
      });

      const quiz2Id = await this.createQuiz({
        moduleId: module1Id,
        title: 'Kuis Teori Warna',
        createdBy: teacherUid,
        timeLimitSec: 480
      });

      console.log('Sample data created successfully!');
      console.log('Created modules:', module1Id, module2Id, module3Id);
      console.log('Created quizzes:', quiz1Id, quiz2Id);
    } catch (error) {
      console.error('Error creating sample data:', error);
      throw error;
    }
  }
};
