# Panduan Penyebaran & Ekspor (Deployment Guide) - Cyber AI

Proyek ini telah dikonfigurasi sepenuhnya agar **siap diekspor** dan **siap dideploy (disiarkan)** ke berbagai platform hosting populer secara instan! 

Kami telah merancang arsitektur aplikasi agar mendukung dua jenis hosting utama:
1. **Layanan Server Node.js (Railway / Render / VPS / Heroku)** - *Sangat Direkomendasikan!* Mendukung server full-stack Express + Vite secara menyatu tanpa batas serverless.
2. **Layanan Serverless (Vercel)** - Menggunakan file konfigurasi `vercel.json` dan folder `api/` khusus yang baru saja kami buat agar backend berjalan sebagai Serverless Functions.

---

## 🚀 Langkah 1: Ekspor Kode Aplikasi Anda
Untuk mengunduh proyek ini dari Google AI Studio:
1. Klik menu **Settings** (ikon gerigi) atau tombol Ekspor di kanan atas AI Studio.
2. Pilih **Export as ZIP** untuk mengunduh kode sumber lengkap ke komputer Anda, atau hubungkan langsung ke **GitHub**.

---

## 🎨 Langkah 2: Pilihan Cara Deploy (Hosting)

### Pilihan A: Deploy di Railway atau Render (Paling Direkomendasikan ⭐)
Railway dan Render sangat cocok untuk aplikasi Express full-stack ini karena mereka menjalankan server Node.js secara aktif 24/7 dan melayani request secara instan.

1. **Hubungkan Repo GitHub** Anda ke Railway atau Render.
2. Sistem akan otomatis mendeteksi pengaturan build dari `package.json` Anda:
   * **Build Command:** `npm run build`
   * **Start Command:** `npm start`
3. Masukkan **Environment Variables** (lihat bagian konfigurasi variabel di bawah).
4. Klik **Deploy**. Selesai! Aplikasi Anda akan online dalam 2 menit.

---

### Pilihan B: Deploy di Vercel (Menggunakan Serverless)
Kami telah menyematkan file `vercel.json` dan folder `/api/index.ts` untuk memfasilitasi hosting gratis di Vercel.

1. **Hubungkan Repo GitHub** Anda ke Vercel.
2. Vercel akan membaca konfigurasi `vercel.json` dan memisahkan static frontend dengan backend secara otomatis.
3. Masukkan **Environment Variables** (lihat bagian konfigurasi di bawah).
4. Klik **Deploy**. Vercel akan otomatis menyiarkan SPA Vite Anda ke CDN global mereka dan menyematkan rute `/api/*` ke Serverless Function Node.js.

---

## 🔐 Langkah 3: Konfigurasi Variabel Lingkungan (Environment Variables)

Saat melakukan deploy di platform apa pun (Railway, Render, Vercel), Anda **wajib** mengisi variabel berikut di panel pengaturan environment platform tersebut agar fitur AI, Whitelist, dan OAuth Google dapat bekerja:

### 1. Kredensial Firebase (Untuk Verifikasi Google Sign-In & Whitelist)
Variabel ini wajib dimasukkan agar verifikasi akun Google dan database Whitelist Firebase Firestore berjalan aman:
* `VITE_FIREBASE_API_KEY` = *(Ambil dari Konsol Firebase -> Setelan Proyek -> Aplikasi Web)*
* `VITE_FIREBASE_AUTH_DOMAIN` = *(Ambil dari Konsol Firebase -> Setelan Proyek)*
* `VITE_FIREBASE_PROJECT_ID` = `gen-lang-client-0786430533`
* `VITE_FIREBASE_STORAGE_BUCKET` = *(Ambil dari Konsol Firebase)*
* `VITE_FIREBASE_MESSAGING_SENDER_ID` = *(Ambil dari Konsol Firebase)*
* `VITE_FIREBASE_APP_ID` = *(Ambil dari Konsol Firebase)*
* `VITE_FIREBASE_DATABASE_ID` = `ai-studio-remixcyberai-6903ea11-f68c-4e95-9937-982d1782066c`

### 2. Kunci Kecerdasan Buatan (Gemini API Key)
* `GEMINI_API_KEY` = *(Kunci API Gemini Anda dari Google AI Studio)*

### 3. Kredensial Google OAuth (Jika Menggunakan Custom Login Flow)
Jika Anda menggunakan custom OAuth backend:
* `GOOGLE_CLIENT_ID` = *(Google OAuth Client ID dari Google Cloud Console)*
* `GOOGLE_CLIENT_SECRET` = *(Google OAuth Client Secret dari Google Cloud Console)*
* `APP_URL` = *(URL domain live aplikasi Anda setelah dideploy, contoh: `https://cyber-ai.vercel.app`)*

---

## ⚙️ Langkah 4: Setelan Penting di Google Cloud Console & Firebase Console
Agar login akun Google Anda tidak diblokir oleh browser atau penyedia auth:
1. **Firebase Authentication:** Masuk ke Firebase Console -> Authentication -> Sign-in method, pastikan **Google** sudah diaktifkan.
2. **Authorized Domains:** Di dalam Firebase Console -> Authentication -> Settings -> Authorized Domains, **tambahkan domain hosting baru Anda** (contoh: `domain-anda.vercel.app` atau `domain-anda.up.railway.app`) ke dalam daftar domain yang diizinkan. Jika tidak ditambahkan, popup Google Sign-In akan memunculkan error penolakan domain.

---

Aplikasi Anda kini sudah **100% siap** untuk disebarluaskan dan digunakan secara profesional! ⚡🚀
