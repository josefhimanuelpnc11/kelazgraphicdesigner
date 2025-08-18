---
applyTo: '**/*.ts'
---
KelazGraphicDesigner — Online Class Platform

Platform kelas online ringan untuk kelompok kecil (saat ini 3 murid), fokus ke materi, kuis, dan tracking progres.

🏗️ Arsitektur

Frontend: React + Vite (TypeScript + SWC)

Hosting: GitHub Pages (gratis), Custom domain via Namecheap

Auth: Firebase Authentication (Google + Email/Password)

Database: Firebase Firestore

Storage: Firebase Storage (PDF, gambar, materi desain)

Catatan: Koleksi Firestore (users, modules, lessons, quizzes, questions, answers, progress) belum dibuat di Console — dibuat on-demand lewat kode saat pertama tulis.

🎯 MVP Features

Login/registrasi (Google & Email/Password), simpan profil + role: 'student' | 'teacher'.

Dashboard murid (modules, lessons, quizzes, progres).

Penyajian materi (teks, gambar, link video/PDF).

Kuis pilihan ganda + autoskor + simpan progres.

Dashboard guru (kelola konten & pantau murid).

🧩 Data Model (Firestore)

Prinsip: denormalisasi secukupnya, query ringan, indeks terarah.

Collections (level root):

users/{uid}

type UserDoc = {
  name: string
  email: string
  role: 'student' | 'teacher'
  createdAt: FirebaseTimestamp
}


modules/{moduleId}

type ModuleDoc = {
  title: string
  description?: string
  createdBy: string // uid guru
  createdAt: FirebaseTimestamp
  order?: number
}


modules/{moduleId}/lessons/{lessonId}

type LessonDoc = {
  title: string
  content?: string // rich text / markdown
  assets?: string[] // URLs storage
  order?: number
  createdAt: FirebaseTimestamp
}


quizzes/{quizId}

type QuizDoc = {
  moduleId?: string
  title: string
  createdBy: string // uid guru
  createdAt: FirebaseTimestamp
  timeLimitSec?: number
}


quizzes/{quizId}/questions/{questionId}

type QuestionDoc = {
  text: string
  options: string[] // ["A", "B", ...]
  correctIndex: number // 0-based
  order?: number
}


answers/{answerId} (flat untuk query cepat per user)

type AnswerDoc = {
  userId: string
  quizId: string
  questionId: string
  selectedIndex: number
  isCorrect: boolean
  answeredAt: FirebaseTimestamp
}


progress/{userId} (opsional; bisa juga pakai view terhitung di klien)

type ProgressDoc = {
  scores: Record<string, number> // { [quizId]: scorePercent }
  updatedAt: FirebaseTimestamp
}


Indeks yang disarankan (Composite):

answers: where(userId ==) & orderBy(answeredAt desc)

quizzes: where(moduleId ==) & orderBy(createdAt desc)

🔐 Keamanan (Firestore Security Rules)

Prinsip: default deny, akses minimum, pemisahan peran.

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() { return request.auth != null; }
    function isOwner(uid) { return signedIn() && request.auth.uid == uid; }
    function isTeacher() {
      return signedIn() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher';
    }

    match /users/{uid} {
      allow create: if isOwner(uid);
      allow read: if isOwner(uid) || isTeacher();
      allow update: if isOwner(uid) || isTeacher();
      allow delete: if isTeacher();
    }

    match /modules/{moduleId} {
      allow read: if signedIn();
      allow create, update, delete: if isTeacher();
      match /lessons/{lessonId} {
        allow read: if signedIn();
        allow create, update, delete: if isTeacher();
      }
    }

    match /quizzes/{quizId} {
      allow read: if signedIn();
      allow create, update, delete: if isTeacher();
      match /questions/{questionId} {
        allow read: if signedIn();
        allow create, update, delete: if isTeacher();
      }
    }

    match /answers/{answerId} {
      // create hanya oleh pemilik jawaban
      allow create: if signedIn() && request.resource.data.userId == request.auth.uid;
      // read oleh pemilik atau guru
      allow read: if signedIn()
        && (resource.data.userId == request.auth.uid || isTeacher());
      // update/delete oleh pemilik atau guru
      allow update, delete: if signedIn()
        && (resource.data.userId == request.auth.uid || isTeacher());
    }

    match /progress/{userId} {
      allow read: if isOwner(userId) || isTeacher();
      allow write: if isTeacher();
    }
  }
}


Tambahan keamanan rekomendasi:

App Check aktif (reCAPTCHA v3/hCaptcha) untuk kurangi abuse dari skrip.

Batasi Authorized domains di Authentication.

Jangan expose data sensitif di dokumen publik.

⚙️ Environment & Konfigurasi

Simpan konfigurasi di file .env Vite:

VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...


Akses via import.meta.env.VITE_....

Catatan: API key Firebase bukan rahasia; Rules adalah garis pertahanan utama.

Pisahkan dev vs prod project Firebase bila memungkinkan.

🧠 State Management & Data Fetch

Mulai sederhana dengan React hooks + Firebase SDK.

Untuk data async & cache: pertimbangkan TanStack Query (React Query).

Optimisasi query:

Paginate/limit (limit, startAfter).

Hindari nested reads tak perlu.

Rancang dokumen sesuai pola akses (read-heavy).

🎨 UX/UI & Aksesibilitas

Desain minimal, responsif (mobile-first).

Komponen aksesibel (label form, focus ring, ARIA untuk kuis).

Performance budget: LCP < 2.5s, interaktif < 3s di 3G cepat.

Gambar materi → kompresi, gunakan width/height eksplisit.

Pertimbangkan dark mode sederhana.

🧪 Testing & Kualitas

Type checks: tsc --noEmit.

Unit/UI: Vitest + React Testing Library.

Emulator Suite untuk Auth/Firestore/Storage saat dev lokal (hindari nembak prod).

Lint: ESLint + Prettier, enforce via CI.

🚀 CI/CD & Deploy

Build: npm run build → output dist/.

Deploy: gh-pages script atau GitHub Actions.

Pastikan CNAME untuk custom domain Namecheap.

Checklist deploy:

Rules terset bukan test mode.

Domain terdaftar di Auth.

App Check (opsional) non-breaking.

🧯 Error Handling & Observability

Tangani error Firebase (kode error) → tampilkan pesan ramah.

Logging non-PII ke console (dev) / optional Sentry (prod).

Notifikasi UI untuk kegagalan submit kuis, retry aman idempotent.

📜 Definisi Selesai (DoD)

Fitur punya:

UI/UX dasar + validasi input.

Akses dibatasi sesuai Rules.

Tes minimal lulus (auth flow happy path).

Loading/empty/error state ditangani.

Dokumentasi singkat di README.

Build sukses, deploy sukses, smoke test di prod 👍

❓ Keputusan & Risiko (ADR Ringkas)

Firestore vs RTDB: pilih Firestore (query & indeks kuat).

Backend-less: kurangi maintenance; trade-off logic kompleks di klien.

Gratis selamanya: GitHub Pages + Firebase free tier cukup untuk kelas kecil; pantau kuota read/write kalau skala naik.

Risiko: Rules salah konfigurasi → data bocor. Mitigasi: default-deny, review rules, emulator test.

🧭 Pedoman untuk Copilot

Selalu pakai TypeScript (.ts/.tsx), fungsi pure & hooks.

Simpan user baru ke users/{uid} setelah login pertama.

Query patuhi model & indeks di atas.

Jangan hardcode rahasia; ambil dari import.meta.env.

Tulis handler error & state loading setiap kali fetch.

Ikuti folder:

src/
  components/   // UI
  pages/        // route-level
  services/     // auth.ts, firestore.ts
  types/        // tipe TS: *.d.ts
  hooks/
  firebase.ts
