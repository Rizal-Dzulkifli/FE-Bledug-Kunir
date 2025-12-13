# Halaman Tambah Produksi - Updated

## Overview
Halaman ini digunakan untuk membuat produksi baru dengan dua mode: **Existing Product** dan **New Product**, dengan perhitungan harga otomatis untuk bahan mentah.

## Fitur

### 1. Form Utama
- **Mode Produksi**: Pilihan antara "existing_product" atau "new_product"
- **Existing Product Mode**: 
  - Dropdown produk dari tabel `produks` dengan informasi harga dan berat
  - Menampilkan: Nama Produk - Berat - Harga
- **New Product Mode**: 
  - Dropdown nama produk dari tabel `nama_produks`
  - Input berat produk (kg)
  - Input harga jual (Rp)
  - Input deskripsi produk
- **Tanggal Tenggat**: Input date yang wajib diisi
- **Deskripsi**: Textarea untuk deskripsi produksi (opsional)

### 2. Detail Bahan (dengan Perhitungan Harga)
- Tabel dinamis untuk menambah/hapus bahan mentah
- **Barang Mentah**: Dropdown dari tabel `barang_mentah` dengan stok
- **Berat (kg)**: Input number dengan step 0.1
- **Harga/kg**: Otomatis ditampilkan dari database
- **Total Harga**: Kalkulasi otomatis (berat × harga/kg)
- **Total Biaya Bahan**: Sum dari semua total harga bahan

### 3. Detail Produksi
- Tabel dinamis untuk menambah/hapus karyawan dan asset
- **Karyawan**: Dropdown dari tabel `users` dengan role="karyawan"
- **Asset/Mesin**: Dropdown dari tabel `assets` dengan jenis mesin
- **Aksi**: Tombol hapus untuk setiap baris (minimum 1 baris)

## Data Source Mapping

### Existing Product Mode:
```sql
-- Table: produks
SELECT id_produk_detail, nama_produk, berat_produk, harga_jual, deskripsi 
FROM produks
```

### New Product Mode:
```sql
-- Table: nama_produks  
SELECT id_produk, nama_produk 
FROM nama_produks
```

### Barang Mentah:
```sql
-- Table: barang_mentahs
SELECT id_barangmentah, nama_barang_mentah, berat_mentah, harga_jual_per_kg 
FROM barang_mentahs
```

### Karyawan:
```sql
-- Table: users
SELECT user_id, nama, role 
FROM users 
WHERE role = 'karyawan'
```

### Asset/Mesin:
```sql
-- Table: assets
SELECT id_asset, nama_asset, jenis 
FROM assets
```

## Struktur Data Output

### Existing Product:
```json
{
  "mode_produksi": "existing_product",
  "id_produk_detail": 1,
  "tgl_tenggat": "2025-10-20",
  "deskripsi": "Deskripsi produksi (opsional)",
  "detail_bahan": [
    {"id_barangmentah": 1, "berat": 250.5},
    {"id_barangmentah": 2, "berat": 150.0}
  ],
  "detail_produksi": [
    {"id_user": 2, "id_asset": 2},
    {"id_user": 3, "id_asset": 1}
  ]
}
```

### New Product:
```json
{
  "mode_produksi": "new_product",
  "id_produk": 1,
  "berat_produk": 500,
  "harga_jual": 75000,
  "deskripsi_produk": "Kue coklat premium",
  "tgl_tenggat": "2025-10-20",
  "deskripsi": "Deskripsi produksi",
  "detail_bahan": [
    {"id_barangmentah": 1, "berat": 250}
  ],
  "detail_produksi": [
    {"id_user": 2, "id_asset": 2}
  ]
}
```

## Fitur Perhitungan Harga

### Detail Bahan:
- **Harga per kg**: Otomatis diambil dari `barang_mentahs.harga_jual_per_kg`
- **Total per bahan**: `berat × harga_jual_per_kg`
- **Grand Total**: Sum dari semua total bahan
- **Display**: Format Rupiah dengan separator ribuan

### Mock Data Structure:
```typescript
// Barang Mentah dengan harga
{
  id_barangmentah: 1,
  nama_barang_mentah: 'Tepung Terigu',
  berat_mentah: 1000, // stok dalam kg
  harga_jual_per_kg: 15000 // harga per kg
}

// Karyawan dengan role
{
  user_id: 1,
  nama: 'Ahmad Karyawan',
  role: 'karyawan'
}

// Asset dengan jenis
{
  id_asset: 1,
  nama_asset: 'Mesin Mixer',
  jenis: 'Produksi'
}
```

## Validasi
- Tanggal tenggat wajib diisi
- **Existing Product**: id_produk_detail wajib
- **New Product**: id_produk, berat_produk, dan harga_jual wajib
- Semua detail bahan harus diisi (barang mentah dan berat > 0)
- Semua detail produksi harus diisi (karyawan dan asset)

## API Integration - LIVE IMPLEMENTATION ✅

### Endpoint Mapping:
```typescript
// Load functions dengan API calls aktif:
loadProdukExistingList()    // GET /api/produks
loadNamaBarangList()        // GET /api/nama-produks?limit=1000
loadBarangMentahList()      // GET /api/barang-mentah?limit=1000
loadKaryawanList()          // GET /api/users (filtered by role=karyawan)
loadAssetList()             // GET /api/assets?limit=1000

// Submit function:
handleSubmit()              // POST /api/produksi
```

### Response Data Mapping:

**Produk Existing** (dari ProducsController):
```json
{
  "data": [
    {
      "id_produk_detail": 1,
      "nama_produk": "Product Name", 
      "berat_produk": 500,
      "harga_jual": 50000,
      "deskripsi": "Product description"
    }
  ]
}
```

**Nama Produk** (dari NamaProduksController):
```json
{
  "data": [
    {
      "id_produk": 1,
      "nama_produk": "Kue Coklat",
      "kode_produk": "KUE001"
    }
  ]
}
```

**Barang Mentah** (dari BarangMentahsController):
```json
{
  "data": {
    "data": [
      {
        "id_barangmentah": 1,
        "berat_mentah": 1000,
        "harga_jual": 15000,
        "namaBarangMentah": {
          "nama_barang_mentah": "Tepung Terigu"
        }
      }
    ]
  }
}
```

**Users/Karyawan** (dari UsersController):
```json
{
  "data": [
    {
      "user_id": 1,
      "nama": "Ahmad Karyawan",
      "role": "karyawan",
      "email": "ahmad@example.com"
    }
  ]
}
```

**Assets** (dari AssetsController):
```json
{
  "data": {
    "data": [
      {
        "id_asset": 1,
        "asset": "Mesin Mixer"
      }
    ]
  }
}
```

### Headers Required:
```typescript
const headers = {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
}
```

### Error Handling:
- ✅ Network error handling dengan SweetAlert2
- ✅ Authentication error untuk semua endpoints
- ✅ Response validation dan data transformation
- ✅ User-friendly error messages

### Data Transformation:
Beberapa data ditransformasi untuk konsistensi:
- `barang_mentah`: Menggunakan `harga_jual` sebagai `harga_jual_per_kg` jika tidak ada
- `asset`: Menggunakan field `asset` dari API sebagai `nama_asset`
- `users`: Filter otomatis untuk role 'karyawan'
- `barang_mentah`: Extract `nama_barang_mentah` dari relasi `namaBarangMentah`