# 🔧 API Configuration - Centralized API URLs

## 📁 File Structure

```
FE/
├── .env                          # Environment variables (DON'T commit!)
├── .env.example                  # Template untuk .env
├── src/
│   ├── config/
│   │   └── api.ts               # ✅ API Configuration (SUDAH DIBUAT)
│   ├── utils/
│   │   └── api.ts               # ✅ API Helper Functions (SUDAH DIBUAT)
│   └── services/
│       ├── KaryawanService.ts    # ✅ UPDATED
│       ├── DriverService.ts      # ✅ UPDATED
│       ├── KeuanganEksternalService.ts  # ✅ UPDATED
│       ├── PengirimanService.ts  # ✅ UPDATED
│       └── PengadaanBarangMentahService.ts  # ✅ UPDATED
├── find-hardcoded-urls.js       # Script untuk mencari hardcoded URLs
├── replace-api-urls.ps1         # PowerShell script untuk auto-replace
└── API_MIGRATION_GUIDE.md       # Dokumentasi lengkap migrasi
```

## ⚙️ Setup Environment

### 1. Buat file `.env` di root folder FE:

```env
VITE_API_BASE_URL=http://127.0.0.1:3333
```

### 2. Untuk Production:

```env
VITE_API_BASE_URL=https://your-domain.com
```

### 3. Restart Dev Server:

```bash
npm run dev
```

## 🎯 Penggunaan

### Method 1: Import dari config (Manual)

```typescript
import { buildApiUrl, getAuthHeaders } from '../config/api';

// GET request
const response = await fetch(buildApiUrl('users'), {
    headers: getAuthHeaders()
});
const data = await response.json();

// POST request
const response = await fetch(buildApiUrl('users'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ nama, email, role })
});
```

### Method 2: Gunakan API Utils (Recommended)

```typescript
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api';

// GET
const users = await apiGet('users');
const usersPaginated = await apiGet('users', { page: 1, limit: 10 });

// POST
const newUser = await apiPost('users', { nama, email, role });

// PUT
const updatedUser = await apiPut(`users/${userId}`, updateData);

// DELETE
await apiDelete(`users/${userId}`);
```

## ✅ Status Update

### Sudah Diupdate ✅

**Services (5 files):**
- `src/services/KaryawanService.ts`
- `src/services/DriverService.ts`
- `src/services/KeuanganEksternalService.ts`
- `src/services/PengirimanService.ts`
- `src/services/PengadaanBarangMentahService.ts`

**Authentication (4 files):**
- `src/pages/Authentication/Login.tsx`
- `src/pages/Authentication/AccountActivation.tsx`
- `src/pages/Authentication/RegisterBoxed.tsx`
- `src/components/Layouts/Header.tsx`

**Dashboard & Apps (3 files):**
- `src/pages/Dashboard/Index.tsx`
- `src/pages/Dashboard.tsx` (needs manual check)
- `src/pages/Apps/Contacts.tsx`

### Perlu Update Manual ⚠️

**Data Tables:**
- `src/pages/DataTables/NamaProduk.tsx`
- `src/pages/DataTables/NamaBarangMentah.tsx`
- `src/pages/DataTables/Asset.tsx`

**Inventaris:**
- `src/pages/Inventaris/InventarisProduk.tsx`
- `src/pages/Inventaris/DataBarang.tsx`

**Barang Mentah:**
- `src/pages/BarangMentah/DaftarBarangMentah.tsx`

**Cetak Label:**
- `src/pages/CetakLabel/CetakLabel.tsx`
- `src/pages/CetakLabel/ListDataBarang.tsx`
- `src/pages/CetakLabel/ListDataBarang copy.tsx`

**Apps:**
- `src/pages/Apps/Mutasi/Add.tsx`
- `src/pages/Apps/Mutasi/Preview.tsx`
- `src/pages/Apps/Penempatan/Add.tsx`
- `src/pages/Apps/Produksi/Add.tsx`
- `src/pages/Apps/Pesanan/Add.tsx`
- `src/pages/Apps/Invoice/List.tsx`

**Keuangan:**
- Semua file di `src/pages/Keuangan/` sudah menggunakan KeuanganEksternalService ✅
- `src/pages/Keuangan/Laporan.tsx` ✅ (menggunakan service)

## 🛠️ Tools untuk Update Otomatis

### 1. Cari Hardcoded URLs:

```powershell
# Di folder FE
Get-ChildItem -Recurse -Include *.ts,*.tsx | Select-String -Pattern "http://127.0.0.1:3333|http://localhost:3333"
```

Atau gunakan script:
```bash
node find-hardcoded-urls.js
```

### 2. Auto-Replace (PowerShell):

```powershell
.\replace-api-urls.ps1
```

Script ini akan:
- Mencari semua hardcoded URLs
- Mengganti dengan `buildApiUrl()`
- Menambahkan import statement yang diperlukan
- Memberikan laporan file yang diupdate

⚠️ **WARNING:** Review perubahan dengan `git diff` sebelum commit!

## 📝 Pattern Replacement

### Sebelum (❌):
```typescript
const response = await fetch('http://127.0.0.1:3333/api/users', {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});
```

### Sesudah (✅):
```typescript
import { buildApiUrl, getAuthHeaders } from '../../config/api';

const response = await fetch(buildApiUrl('users'), {
    headers: getAuthHeaders()
});
```

### Atau lebih simpel (✅✅):
```typescript
import { apiGet } from '../../utils/api';

const data = await apiGet('users');
```

## 🚀 Deployment Checklist

- [x] Buat `src/config/api.ts`
- [x] Buat `src/utils/api.ts`
- [x] Update semua services
- [x] Update authentication files
- [x] Buat `.env` dan `.env.example`
- [ ] Update semua React components (in progress)
- [ ] Test di localhost
- [ ] Set environment variable untuk production
- [ ] Build dan deploy

## 💡 Best Practices

1. **Selalu gunakan environment variable** untuk URL
2. **Gunakan API utils** untuk code yang lebih bersih
3. **Test setiap perubahan** sebelum commit
4. **Jangan commit file `.env`** (sudah ada di `.gitignore`)
5. **Review `git diff`** sebelum push

## 🔍 Verify Installation

```bash
# Check if .env exists
ls .env

# Check if config files exist
ls src/config/api.ts
ls src/utils/api.ts

# Test dev server
npm run dev
```

## 📞 Support

Jika ada masalah:
1. Pastikan `.env` sudah dibuat
2. Restart dev server setelah update `.env`
3. Clear browser cache
4. Check console untuk error messages
5. Review `API_MIGRATION_GUIDE.md` untuk detail lengkap

---

**Last Updated:** December 2024
**Status:** ✅ Core files updated, manual update needed for remaining components
