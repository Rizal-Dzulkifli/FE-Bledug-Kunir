# Migrasi API URL ke Centralized Configuration

## 📋 Overview
Semua hardcoded URL API (`http://127.0.0.1:3333`) telah dipindahkan ke konfigurasi terpusat untuk memudahkan deployment.

## 🎯 File Konfigurasi

### 1. Environment Variables (`.env`)
```env
VITE_API_BASE_URL=http://127.0.0.1:3333
```

Untuk production, ubah menjadi:
```env
VITE_API_BASE_URL=https://your-production-domain.com
```

### 2. API Config (`src/config/api.ts`)
File ini berisi:
- `API_BASE_URL`: Base URL dari environment variable
- `API_URL`: `${API_BASE_URL}/api` - untuk endpoint yang memerlukan /api prefix
- `getAuthHeaders()`: Helper untuk mendapatkan headers dengan token
- `buildApiUrl(endpoint)`: Helper untuk membangun URL lengkap

### 3. API Utils (`src/utils/api.ts`)
Helper functions untuk mempermudah API calls:
- `apiGet(endpoint, params)` - GET request
- `apiPost(endpoint, data)` - POST request
- `apiPut(endpoint, data)` - PUT request
- `apiDelete(endpoint)` - DELETE request
- `apiUpload(endpoint, formData)` - Upload file

## ✅ File yang Sudah Diupdate

### Services
- ✅ `src/services/KaryawanService.ts`
- ✅ `src/services/DriverService.ts`
- ✅ `src/services/KeuanganEksternalService.ts`
- ✅ `src/services/PengirimanService.ts`
- ✅ `src/services/PengadaanBarangMentahService.ts`

### Authentication
- ✅ `src/pages/Authentication/Login.tsx`
- ✅ `src/pages/Authentication/AccountActivation.tsx`
- ✅ `src/pages/Authentication/RegisterBoxed.tsx`
- ✅ `src/components/Layouts/Header.tsx`

## 🔄 Cara Migrate File Lainnya

### Pattern Lama → Pattern Baru

#### 1. Import API Config
```typescript
// ❌ LAMA - Tidak ada import
const response = await fetch('http://127.0.0.1:3333/api/users', { ... });

// ✅ BARU - Import config
import { buildApiUrl, getAuthHeaders } from '../../config/api';
const response = await fetch(buildApiUrl('users'), {
    headers: getAuthHeaders()
});
```

#### 2. Menggunakan API Utils (Recommended)
```typescript
// ❌ LAMA
import { buildApiUrl, getAuthHeaders } from '../../config/api';
const response = await fetch(buildApiUrl('users'), {
    method: 'GET',
    headers: getAuthHeaders()
});
const data = await response.json();

// ✅ BARU - Lebih simpel dengan utils
import { apiGet } from '../../utils/api';
const data = await apiGet('users');
```

### Contoh Lengkap untuk Berbagai Kasus

#### GET dengan Query Parameters
```typescript
// LAMA
const response = await fetch(`http://127.0.0.1:3333/api/produk?page=${page}&limit=${limit}`, {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});

// BARU - Method 1: Manual
import { buildApiUrl, getAuthHeaders } from '../../config/api';
const response = await fetch(buildApiUrl(`produk?page=${page}&limit=${limit}`), {
    headers: getAuthHeaders()
});

// BARU - Method 2: Dengan Utils (Recommended)
import { apiGet } from '../../utils/api';
const data = await apiGet('produk', { page, limit });
```

#### POST dengan Body
```typescript
// LAMA
const response = await fetch('http://127.0.0.1:3333/api/users', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ nama, email, role })
});

// BARU - Method 1: Manual
import { buildApiUrl, getAuthHeaders } from '../../config/api';
const response = await fetch(buildApiUrl('users'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ nama, email, role })
});

// BARU - Method 2: Dengan Utils (Recommended)
import { apiPost } from '../../utils/api';
const data = await apiPost('users', { nama, email, role });
```

#### PUT untuk Update
```typescript
// LAMA
const response = await fetch(`http://127.0.0.1:3333/api/users/${userId}`, {
    method: 'PUT',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
});

// BARU - Dengan Utils
import { apiPut } from '../../utils/api';
const data = await apiPut(`users/${userId}`, updateData);
```

#### DELETE
```typescript
// LAMA
const response = await fetch(`http://127.0.0.1:3333/api/users/${userId}`, {
    method: 'DELETE',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});

// BARU - Dengan Utils
import { apiDelete } from '../../utils/api';
await apiDelete(`users/${userId}`);
```

#### Non-API Endpoints (login, logout, dll)
```typescript
// LAMA
const response = await fetch('http://127.0.0.1:3333/login', { ... });

// BARU
import { API_BASE_URL } from '../../config/api';
const response = await fetch(`${API_BASE_URL}/login`, { ... });
```

## 📝 File yang Masih Perlu Diupdate

Berikut daftar file yang masih menggunakan hardcoded URL dan perlu diupdate:

### Data Tables
- `src/pages/DataTables/NamaProduk.tsx`
- `src/pages/DataTables/NamaBarangMentah.tsx`
- `src/pages/DataTables/Asset.tsx`

### Inventaris
- `src/pages/Inventaris/InventarisProduk.tsx`
- `src/pages/Inventaris/DataBarang.tsx`

### Barang Mentah
- `src/pages/BarangMentah/DaftarBarangMentah.tsx`

### Cetak Label
- `src/pages/CetakLabel/CetakLabel.tsx`
- `src/pages/CetakLabel/ListDataBarang.tsx`
- `src/pages/CetakLabel/ListDataBarang copy.tsx`

### Dashboard
- `src/pages/Dashboard.tsx`
- `src/pages/Dashboard/Index.tsx`

### Apps
- `src/pages/Apps/Contacts.tsx`
- `src/pages/Apps/Mutasi/Add.tsx`
- `src/pages/Apps/Mutasi/Preview.tsx`
- `src/pages/Apps/Penempatan/Add.tsx`
- `src/pages/Apps/Produksi/Add.tsx`
- `src/pages/Apps/Pesanan/Add.tsx`
- `src/pages/Apps/Invoice/List.tsx`

## 🚀 Deployment Checklist

1. ✅ Buat file `.env` di root FE
2. ✅ Set `VITE_API_BASE_URL` sesuai environment
3. ✅ Update semua hardcoded URLs
4. ✅ Test di localhost
5. ⬜ Update `.env` untuk production
6. ⬜ Build project: `npm run build`
7. ⬜ Deploy ke hosting

## 🔍 Cara Mencari Hardcoded URLs yang Tersisa

Jalankan command ini di terminal:
```bash
# Windows PowerShell
cd FE
Get-ChildItem -Recurse -Include *.ts,*.tsx | Select-String -Pattern "http://127.0.0.1:3333|http://localhost:3333"
```

Atau gunakan script yang sudah dibuat:
```bash
node find-hardcoded-urls.js
```

## 💡 Tips

1. **Gunakan API Utils** untuk code yang lebih bersih dan konsisten
2. **Test setiap perubahan** sebelum commit
3. **Jangan commit file `.env`** ke git (sudah ada di `.gitignore`)
4. **Gunakan `.env.example`** sebagai template untuk development
5. **Set environment variable** yang berbeda untuk development, staging, dan production

## ⚠️ Important Notes

- File `.env` harus ada di root folder FE (sejajar dengan `package.json`)
- Vite menggunakan prefix `VITE_` untuk environment variables yang bisa diakses di frontend
- Setelah update `.env`, restart dev server: `npm run dev`
- Untuk production build, set environment variable sebelum build atau gunakan file `.env.production`
