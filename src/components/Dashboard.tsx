import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useDashboardData } from '../hooks/useDashboardData';
import { useStudentDashboard } from '../hooks/useStudentDashboard';
import { authService } from '../services/auth';
import { ManageContent } from './ManageContent';
import { CreateQuiz } from './CreateQuiz';
import { ManageQuizzes } from './ManageQuizzes';
import { ManageStudents } from './ManageStudents';
import './Dashboard.css';

export const Dashboard = () => {
  const { userDoc, logout, isTeacher, isStudent, user } = useAuth();
  const { 
    students, 
    modules, 
    totalLessons, 
    analytics, 
    loading: dashboardLoading, 
    error: dashboardError,
    refreshData,
    createSampleData
  } = useDashboardData();

  // Student stats
  const studentStats = useStudentDashboard(user?.uid);

  // Modal states
  const [showManageContent, setShowManageContent] = useState(false);
  const [showCreateQuiz, setShowCreateQuiz] = useState(false);
  const [showManageQuizzes, setShowManageQuizzes] = useState(false);
  const [showManageStudents, setShowManageStudents] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Debug function to force update role (only for josefhimanuel123@gmail.com)
  const handleForceUpdateRole = async () => {
    if (user && userDoc?.email === 'josefhimanuel123@gmail.com') {
      try {
        await authService.updateUserRole(user.uid, 'teacher');
        // Force page reload to reflect changes
        window.location.reload();
      } catch (error) {
        console.error('Error updating role:', error);
      }
    }
  };

  const handleCreateSampleData = async () => {
    if (user && isTeacher) {
      try {
        await createSampleData(user.uid);
        alert('Data contoh berhasil dibuat!');
      } catch (error) {
        console.error('Error creating sample data:', error);
        alert('Gagal membuat data contoh. Silakan coba lagi.');
      }
    }
  };

  const handleManageContent = () => {
    setShowManageContent(true);
  };

  const handleCreateQuiz = () => {
    setShowCreateQuiz(true);
  };

  const handleManageQuizzes = () => {
    setShowManageQuizzes(true);
  };

  const handleViewAnalytics = () => {
    alert(`Dashboard Analitik:\n\n📊 Progres Siswa: ${analytics.completionRate}% rata-rata penyelesaian\n🎯 Performa Kuis: ${analytics.avgScore}% rata-rata nilai\n📚 Siswa Aktif: ${students.length}\n📖 Total Konten: ${modules.length} bab, ${totalLessons} materi`);
  };

  const handleViewAllStudents = () => {
    setShowManageStudents(true);
  };

  if (!userDoc) {
    return (
      <div className="dashboard-loading">
        <p>Memuat data pengguna...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="container">
          <div className="logo">
            <h2>Kelaz</h2>
            <span>Kelas Online Desain Grafis</span>
          </div>
          <div className="user-menu">
            <span className="user-name">Selamat datang, {userDoc.name}</span>
            <span className={`user-role ${userDoc.role}`}>
              {userDoc.role === 'teacher' ? '👨‍🏫 Guru' : '👨‍🎓 Siswa'}
            </span>
            {/* Debug button for josefhimanuel123@gmail.com */}
            {userDoc.email === 'josefhimanuel123@gmail.com' && userDoc.role !== 'teacher' && (
              <button onClick={handleForceUpdateRole} className="btn-update-role">
                🔄 Perbaiki Role Guru
              </button>
            )}
            <button onClick={handleLogout} className="btn-logout">
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="container">
          {isStudent && (
            <div className="student-dashboard">
              <h1>Dashboard Siswa</h1>
              <div className="dashboard-grid">
                <div className="card">
                  <h3>📚 Kelas Saya</h3>
                  <p>Akses kelas yang Anda ikuti dan pantau progres pembelajaran</p>
                  <div className="course-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${studentStats.progressPercent}%` }}></div>
                    </div>
                    <span>{studentStats.progressPercent}% Selesai</span>
                  </div>
                  <button className="btn-primary">Lanjutkan Belajar</button>
                </div>

                <div className="card">
                  <h3>❓ Kuis</h3>
                  <p>Uji pengetahuan Anda dengan kuis interaktif</p>
                  <div className="quiz-stats">
                    <div className="stat">
                      <strong>{studentStats.completedQuizzes}</strong>
                      <span>Selesai</span>
                    </div>
                    <div className="stat">
                      <strong>{studentStats.averageScore}%</strong>
                      <span>Rata-rata Nilai</span>
                    </div>
                  </div>
                  <button className="btn-secondary">Ikuti Kuis</button>
                </div>

                <div className="card">
                  <h3>📊 Progres</h3>
                  <p>Pantau perjalanan belajar Anda</p>
                  <div className="progress-stats">
                    {studentStats.moduleProgress.slice(0,3).map(mp => (
                      <div key={mp.moduleId} className="progress-item">
                        <span>{mp.title}</span>
                        <div className="progress-bar small">
                          <div className="progress-fill" style={{ width: `${mp.percent}%` }}></div>
                        </div>
                      </div>
                    ))}
                    {studentStats.moduleProgress.length === 0 && (
                      <div className="empty-state">Belum ada progres untuk ditampilkan</div>
                    )}
                  </div>
                </div>

                <div className="card">
                  <h3>🎯 Pencapaian</h3>
                  <p>Milestone pembelajaran Anda</p>
                  <div className="achievements">
                    <div className={`achievement ${studentStats.completedQuizzes >= 1 ? 'earned' : ''}`}>🏆 Kuis Pertama Selesai</div>
                    <div className={`achievement ${studentStats.averageScore >= 90 ? 'earned' : ''}`}>💯 Rata-rata Nilai ≥ 90%</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isTeacher && (
            <div className="teacher-dashboard">
              <div className="dashboard-header-controls">
                <h1>Dashboard Guru</h1>
                <button onClick={refreshData} className="btn-refresh" disabled={dashboardLoading}>
                  🔄 Refresh Data
                </button>
                {modules.length === 0 && (
                  <button onClick={handleCreateSampleData} className="btn-sample-data">
                    📝 Buat Data Contoh
                  </button>
                )}
              </div>

              {dashboardError && (
                <div className="error-message">
                  Error memuat dashboard: {dashboardError}
                </div>
              )}

              {dashboardLoading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Memuat data dashboard...</p>
                </div>
              ) : (
                <div className="dashboard-grid">
                  <div className="card">
                    <h3>👥 Siswa</h3>
                    <p>Kelola dan pantau progres siswa</p>
                    <div className="student-count">
                      <strong>{analytics.totalStudents}</strong> Siswa Aktif
                    </div>
                    <div className="student-list">
                      {students.slice(0, 3).map(student => (
                        <div key={student.id} className="student-item">
                          👨‍🎓 {student.name}
                        </div>
                      ))}
                      {students.length > 3 && (
                        <div className="student-more">
                          +{students.length - 3} siswa lainnya
                        </div>
                      )}
                    </div>
                    <button className="btn-primary" onClick={handleViewAllStudents}>Lihat Semua Siswa</button>
                  </div>

                  <div className="card">
                    <h3>📚 Konten Kelas</h3>
                    <p>Buat dan kelola materi, bab, dan konten pembelajaran</p>
                    <div className="content-stats">
                      <div className="stat">
                        <strong>{modules.length}</strong>
                        <span>Bab</span>
                      </div>
                      <div className="stat">
                        <strong>{totalLessons}</strong>
                        <span>Materi</span>
                      </div>
                    </div>
                    <div className="module-list">
                      {modules.slice(0, 2).map(module => (
                        <div key={module.id} className="module-item">
                          📖 {module.title}
                        </div>
                      ))}
                      {modules.length > 2 && (
                        <div className="module-more">
                          +{modules.length - 2} bab lainnya
                        </div>
                      )}
                    </div>
                    <button className="btn-primary" onClick={handleManageContent}>
                      Kelola Konten
                    </button>
                  </div>

                  <div className="card">
                    <h3>❓ Kuis</h3>
                    <p>Buat dan kelola kuis serta penilaian</p>
                    <div className="quiz-stats">
                      <div className="stat">
                        <strong>{analytics.totalQuizzes}</strong>
                        <span>Total Kuis</span>
                      </div>
                      <div className="stat">
                        <strong>{analytics.totalSubmissions}</strong>
                        <span>Pengumpulan</span>
                      </div>
                    </div>
                    <div className="form-actions" style={{ justifyContent: 'flex-start', gap: '8px' }}>
                      <button className="btn-secondary" onClick={handleCreateQuiz}>
                        Buat Kuis
                      </button>
                      <button className="btn-primary" onClick={handleManageQuizzes}>
                        Kelola Kuis
                      </button>
                    </div>
                  </div>

                  <div className="card">
                    <h3>📊 Analitik</h3>
                    <p>Lihat analitik dan wawasan detail</p>
                    <div className="analytics-preview">
                      <div className="metric">
                        <span>Tingkat Penyelesaian</span>
                        <strong>{analytics.completionRate}%</strong>
                      </div>
                      <div className="metric">
                        <span>Rata-rata Nilai Kuis</span>
                        <strong>{analytics.avgScore}%</strong>
                      </div>
                    </div>
                    <button className="btn-secondary" onClick={handleViewAnalytics}>
                      Lihat Analitik
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showManageContent && (
        <ManageContent onClose={() => setShowManageContent(false)} />
      )}
      
      {showCreateQuiz && (
        <CreateQuiz onClose={() => setShowCreateQuiz(false)} />
      )}

      {showManageQuizzes && (
        <ManageQuizzes onClose={() => setShowManageQuizzes(false)} />
      )}

      {showManageStudents && (
        <ManageStudents onClose={() => setShowManageStudents(false)} />
      )}
    </div>
  );
};
