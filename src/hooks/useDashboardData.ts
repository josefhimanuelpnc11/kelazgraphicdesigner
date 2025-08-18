import { useState, useEffect } from 'react';
import { firestoreService } from '../services/firestore';
import type { ModuleDoc, UserDoc } from '../types';

interface DashboardData {
  students: (UserDoc & { id: string })[];
  modules: (ModuleDoc & { id: string })[];
  totalLessons: number;
  analytics: {
    totalStudents: number;
    totalQuizzes: number;
    totalSubmissions: number;
    completionRate: number;
    avgScore: number;
  };
  loading: boolean;
  error: string | null;
}

export const useDashboardData = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    students: [],
    modules: [],
    totalLessons: 0,
    analytics: {
      totalStudents: 0,
      totalQuizzes: 0,
      totalSubmissions: 0,
      completionRate: 0,
      avgScore: 0
    },
    loading: true,
    error: null
  });

  const loadDashboardData = async () => {
    setDashboardData(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const [students, modules, totalLessons, analytics] = await Promise.all([
        firestoreService.getStudents(),
        firestoreService.getModules(),
        firestoreService.getAllLessonsCount(),
        firestoreService.getAnalytics()
      ]);

      setDashboardData({
        students,
        modules,
        totalLessons,
        analytics,
        loading: false,
        error: null
      });
    } catch (error) {
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load dashboard data'
      }));
    }
  };

  const createSampleData = async (teacherUid: string) => {
    try {
      await firestoreService.createSampleData(teacherUid);
      // Reload data after creating sample data
      await loadDashboardData();
    } catch (error) {
      console.error('Error creating sample data:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return {
    ...dashboardData,
    refreshData: loadDashboardData,
    createSampleData
  };
};
