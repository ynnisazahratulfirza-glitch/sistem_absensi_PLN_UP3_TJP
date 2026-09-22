# Setup Sistem Absensi PLN UP3

## Langkah 1 - Setup Firebase

1. Buka https://console.firebase.google.com
2. Klik "Add Project" → beri nama (misal: absensi-pln)
3. Aktifkan fitur berikut:
   - **Authentication** → Sign-in method → Email/Password → Enable
   - **Firestore Database** → Create database → Start in test mode
   - **Storage** → Get started → Start in test mode

4. Buka Project Settings → scroll ke "Your apps" → klik ikon Web (</>)
5. Copy konfigurasi Firebase

## Langkah 2 - Isi file .env

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=nama-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=nama-project
VITE_FIREBASE_STORAGE_BUCKET=nama-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc
```

## Langkah 3 - Buat Akun Admin

1. Jalankan aplikasi: `npm run dev`
2. Buka browser: http://localhost:5173/seed-admin
3. Klik "Buat Akun Admin"
4. Selesai! Admin sudah terdaftar

## Langkah 4 - Firestore Rules

Buka Firestore → Rules → paste ini:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
    match /absensi/{docId} {
      allow read, write: if request.auth != null;
    }
    match /lembur/{docId} {
      allow read, write: if request.auth != null;
    }
    match /admins/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Langkah 5 - Storage Rules

Buka Storage → Rules → paste ini:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Jalankan Aplikasi

```bash
npm run dev
```

## Akun Default

| Role  | Email             | Password    |
|-------|-------------------|-------------|
| Admin | admin@gmail.com   | adminplnup3 |
| User  | Daftar via /register |          |

## Struktur Database Firestore

### Collection: users
```json
{
  "uid": "firebase-uid",
  "nama": "Nama Lengkap",
  "nip": "NIP001",
  "jabatan": "Teknisi",
  "email": "email@gmail.com",
  "role": "user | admin",
  "fotoURL": "https://...",
  "createdAt": "2026-09-22T00:00:00.000Z"
}
```

### Collection: absensi
```json
{
  "uid": "firebase-uid",
  "tanggal": "2026-09-22",
  "bulan": "2026-09",
  "jamMasuk": "08:00",
  "jamKeluar": "17:00",
  "status": "Hadir",
  "fotoAbsensi": "https://...",
  "keterangan": "",
  "createdAt": "..."
}
```

### Collection: lembur
```json
{
  "uid": "firebase-uid",
  "tanggal": "2026-09-22",
  "bulan": "2026-09",
  "jamMulai": "17:00",
  "jamSelesai": "20:00",
  "jumlahJam": 3,
  "nukonfiden": "NK-001",
  "fotoBukti": "https://...",
  "keterangan": "Pekerjaan tambahan",
  "createdAt": "..."
}
```
