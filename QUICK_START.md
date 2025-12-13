# 🚀 Quick Start - API Configuration

## ✅ Setup Selesai!

Konfigurasi API terpusat sudah berhasil dibuat. Berikut cara menggunakannya:

## 📦 File yang Sudah Dibuat

```
FE/
├── .env                                    ✅ Environment variables
├── .env.example                            ✅ Template
├── .gitignore                              ✅ Updated (include .env)
├── src/
│   ├── config/
│   │   └── api.ts                         ✅ API Configuration
│   └── utils/
│       └── api.ts                         ✅ API Helper Functions
├── find-hardcoded-urls.js                 ✅ Search tool
├── replace-api-urls.ps1                   ✅ Auto-replace script
├── API_MIGRATION_GUIDE.md                 ✅ Panduan lengkap
├── README_API_CONFIG.md                   ✅ Quick reference
└── API_MIGRATION_SUMMARY.md               ✅ Status update
```

## 🎯 Langkah Selanjutnya

### 1. Test Aplikasi (WAJIB!)

```powershell
cd "d:\Pa\New folder\FE"
npm run dev
```

Buka browser dan test:
- ✅ Login berfungsi
- ✅ Dashboard muncul
- ✅ Data users/contacts bisa diload
- ✅ Service keuangan berfungsi

### 2. Update File yang Tersisa (OPTIONAL tapi RECOMMENDED)

#### Cara Cepat - Gunakan Script:
```powershell
.\replace-api-urls.ps1
```

#### Cara Manual - Update per file:
Buka file yang masih ada hardcoded URL, lalu:

```typescript
// Tambahkan import
import { buildApiUrl, getAuthHeaders } from '../../config/api';

// Ganti fetch calls
// DARI:
fetch('http://127.0.0.1:3333/api/users', { ... })

// JADI:
fetch(buildApiUrl('users'), { headers: getAuthHeaders() })
```

**File Priority tinggi yang perlu diupdate:**
1. `src/pages/DataTables/NamaProduk.tsx`
2. `src/pages/DataTables/NamaBarangMentah.tsx`
3. `src/pages/DataTables/Asset.tsx`
4. `src/pages/Inventaris/InventarisProduk.tsx`
5. `src/pages/Inventaris/DataBarang.tsx`

### 3. Cek Hardcoded URLs yang Tersisa

```powershell
# Cari semua hardcoded URLs
Get-ChildItem -Recurse -Include *.ts,*.tsx | Select-String "127.0.0.1:3333"

# Atau gunakan script
node find-hardcoded-urls.js
```

## 🔧 Deployment ke Production

### Step 1: Update `.env`

```env
# Development (sekarang)
VITE_API_BASE_URL=http://127.0.0.1:3333

# Production (nanti saat deploy)
VITE_API_BASE_URL=https://api.yourdomain.com
```

### Step 2: Build

```bash
npm run build
```

### Step 3: Deploy

Upload folder `dist/` ke hosting.

## 📚 Dokumentasi Lengkap

- **`API_MIGRATION_GUIDE.md`** - Panduan detail cara migrate file
- **`README_API_CONFIG.md`** - Quick reference
- **`API_MIGRATION_SUMMARY.md`** - Status progress lengkap

## ✅ Yang Sudah Selesai

| Kategori | Status | Files |
|----------|--------|-------|
| **Config Files** | ✅ 100% | 2/2 |
| **Services** | ✅ 100% | 5/5 |
| **Authentication** | ✅ 100% | 4/4 |
| **Core Components** | ✅ 60% | ~8/13 |

## 🎉 Kesimpulan

**Core infrastructure sudah selesai!** 

Aplikasi sekarang:
- ✅ Menggunakan environment variable untuk API URL
- ✅ Gampang deploy ke production (tinggal ganti .env)
- ✅ Service utama sudah menggunakan config terpusat
- ✅ Authentication sudah update
- ⚠️ Beberapa component lain masih perlu diupdate manual

**Next Action:** 
Test aplikasi, pastikan berfungsi, lalu update file yang tersisa sesuai kebutuhan.

---

**Questions?** Baca `API_MIGRATION_GUIDE.md` untuk detail lengkap.
