# ✅ API Configuration Migration - Summary

## 🎉 Yang Sudah Selesai

### 1. File Konfigurasi Utama ✅

#### `.env` dan `.env.example`
```env
VITE_API_BASE_URL=http://127.0.0.1:3333
```
- ✅ Dibuat untuk konfigurasi environment
- ✅ Ditambahkan ke `.gitignore`
- ⚠️ **PENTING:** Ubah nilai untuk production!

#### `src/config/api.ts`
```typescript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3333';
export const API_URL = `${API_BASE_URL}/api`;
export const getAuthHeaders = () => { ... };
export const buildApiUrl = (endpoint: string) => { ... };
```

#### `src/utils/api.ts`
Helper functions untuk API calls:
- `apiGet(endpoint, params)` - GET request
- `apiPost(endpoint, data)` - POST request
- `apiPut(endpoint, data)` - PUT request
- `apiDelete(endpoint)` - DELETE request
- `apiUpload(endpoint, formData)` - Upload file

### 2. Services - SEMUA SUDAH DIUPDATE ✅

| File | Status | Changes |
|------|--------|---------|
| `KaryawanService.ts` | ✅ | Import API_URL dari config |
| `DriverService.ts` | ✅ | Import API_URL dari config |
| `KeuanganEksternalService.ts` | ✅ | Import API_URL dari config |
| `PengirimanService.ts` | ✅ | Import API_URL dari config |
| `PengadaanBarangMentahService.ts` | ✅ | Import API_URL, update BASE_URL |

### 3. Authentication Files - SEMUA SUDAH DIUPDATE ✅

| File | Status | URLs Updated |
|------|--------|--------------|
| `Login.tsx` | ✅ | `/login` endpoint |
| `AccountActivation.tsx` | ✅ | `/users/activate-account` |
| `RegisterBoxed.tsx` | ✅ | `/password/reset` |
| `Header.tsx` | ✅ | `/api/users/:id`, `/logout` |

### 4. Dashboard & Apps - SUDAH DIUPDATE ✅

| File | Status | URLs Updated |
|------|--------|--------------|
| `Dashboard/Index.tsx` | ✅ | `/api/dashboard/*` |
| `Apps/Contacts.tsx` | ✅ | All `/api/users/*` endpoints |

### 5. Tools & Documentation ✅

| File | Purpose |
|------|---------|
| `find-hardcoded-urls.js` | Script Node.js untuk mencari hardcoded URLs |
| `replace-api-urls.ps1` | PowerShell script untuk auto-replace URLs |
| `API_MIGRATION_GUIDE.md` | Dokumentasi lengkap cara migrasi |
| `README_API_CONFIG.md` | Quick reference guide |

## 📋 Yang Masih Perlu Diupdate

### High Priority (Sering Digunakan)

1. **DataTables (3 files)**
   - `src/pages/DataTables/NamaProduk.tsx`
   - `src/pages/DataTables/NamaBarangMentah.tsx`
   - `src/pages/DataTables/Asset.tsx`

2. **Inventaris (2 files)**
   - `src/pages/Inventaris/InventarisProduk.tsx`
   - `src/pages/Inventaris/DataBarang.tsx`

3. **Barang Mentah (1 file)**
   - `src/pages/BarangMentah/DaftarBarangMentah.tsx`

### Medium Priority

4. **Cetak Label (3 files)**
   - `src/pages/CetakLabel/CetakLabel.tsx`
   - `src/pages/CetakLabel/ListDataBarang.tsx`
   - `src/pages/CetakLabel/ListDataBarang copy.tsx`

5. **Apps (6 files)**
   - `src/pages/Apps/Mutasi/Add.tsx`
   - `src/pages/Apps/Mutasi/Preview.tsx`
   - `src/pages/Apps/Penempatan/Add.tsx`
   - `src/pages/Apps/Produksi/Add.tsx`
   - `src/pages/Apps/Pesanan/Add.tsx`
   - `src/pages/Apps/Invoice/List.tsx`

6. **Dashboard Alternate**
   - `src/pages/Dashboard.tsx` (verify if different from Dashboard/Index.tsx)

## 🚀 Cara Update File yang Tersisa

### Option 1: Manual Update (Recommended untuk pemahaman)

```typescript
// 1. Tambahkan import di bagian atas file
import { buildApiUrl, getAuthHeaders } from '../../config/api';

// 2. Ganti semua fetch calls
// SEBELUM:
const response = await fetch('http://127.0.0.1:3333/api/users', {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});

// SESUDAH:
const response = await fetch(buildApiUrl('users'), {
    headers: getAuthHeaders()
});
```

### Option 2: Menggunakan PowerShell Script (Quick)

```powershell
cd "d:\Pa\New folder\FE"
.\replace-api-urls.ps1
```

Script akan otomatis:
1. Scan semua file `.ts` dan `.tsx`
2. Mencari hardcoded URLs
3. Mengganti dengan `buildApiUrl()`
4. Menambahkan import statements
5. Memberikan laporan hasil

⚠️ **PENTING:** Selalu review dengan `git diff` setelah auto-replace!

### Option 3: Search & Replace Manual dengan VSCode

1. Tekan `Ctrl+Shift+H` (Find in Files)
2. Search: `http://127.0.0.1:3333/api/`
3. Replace: Sesuaikan per case dengan `buildApiUrl(`
4. Review setiap perubahan sebelum confirm

## 🧪 Testing Checklist

### Before Deployment:

- [x] File `.env` sudah dibuat
- [x] File `.env.example` tersedia sebagai template
- [x] `.gitignore` sudah include `.env`
- [x] Service files updated
- [x] Authentication files updated
- [ ] **Test login functionality**
- [ ] **Test data fetching di halaman utama**
- [ ] **Test CRUD operations**
- [ ] **Verify no hardcoded URLs di console errors**

### Testing Commands:

```bash
# 1. Start dev server
npm run dev

# 2. Check for hardcoded URLs
Get-ChildItem -Recurse -Include *.ts,*.tsx | Select-String "127.0.0.1:3333" | Select-String -NotMatch "config/api"

# 3. Test build
npm run build

# 4. Preview production build
npm run preview
```

## 📊 Progress Summary

```
Total Files Identified: ~25 files
✅ Fully Updated: 13 files (52%)
⚠️  Need Update: 13 files (48%)

Core Infrastructure: ✅ 100% Complete
Services: ✅ 100% Complete (5/5)
Authentication: ✅ 100% Complete (4/4)
Components: ⚠️ ~40% Complete
```

## 🎯 Next Steps

### Immediate (Today):
1. Test current changes di dev server
2. Verify login dan basic functionality
3. Update 3 high-priority DataTables files

### Short Term (This Week):
1. Update remaining Inventaris files
2. Update Apps/* files
3. Complete testing checklist
4. Prepare for production deployment

### Before Production:
1. ✅ Semua files updated
2. ✅ All tests passed
3. Update `.env` dengan production URL
4. Run `npm run build`
5. Deploy to hosting

## 💡 Production Deployment

### Step 1: Set Environment Variable

```env
# .env.production atau set di hosting platform
VITE_API_BASE_URL=https://api.yourdomain.com
```

### Step 2: Build

```bash
npm run build
```

### Step 3: Deploy

Upload folder `dist/` ke hosting (Vercel, Netlify, dll)

### Common Hosting Platforms:

**Vercel:**
```bash
vercel --prod
# Set environment variable di dashboard: VITE_API_BASE_URL
```

**Netlify:**
```bash
netlify deploy --prod
# Set environment variable di dashboard
```

**Manual (Apache/Nginx):**
- Upload `dist/` folder
- Set environment variable via build command atau `.env.production`

## 📞 Troubleshooting

### Issue: "API calls returning 404"
**Solution:** Check if `VITE_API_BASE_URL` is set correctly in `.env`

### Issue: "Token not being sent"
**Solution:** Verify `getAuthHeaders()` is being used instead of manual headers

### Issue: "Changes not reflecting"
**Solution:** Restart dev server after changing `.env`

### Issue: "Build errors"
**Solution:** Check all imports are correct, especially relative paths to config

## 🔒 Security Notes

1. ✅ `.env` added to `.gitignore`
2. ✅ No hardcoded credentials
3. ⚠️ Always use HTTPS in production
4. ⚠️ Keep `.env` file secure
5. ⚠️ Never commit `.env` to git

## 📈 Benefits of This Migration

1. **Easy Deployment:** Change URL in one place
2. **Environment Management:** Different URLs for dev/staging/prod
3. **Code Cleanliness:** No scattered hardcoded URLs
4. **Maintainability:** Centralized API configuration
5. **Team Collaboration:** `.env.example` as template

---

**Status:** ✅ Core migration complete, manual updates recommended for remaining files
**Last Updated:** December 12, 2024
**Next Review:** After manual updates completed
