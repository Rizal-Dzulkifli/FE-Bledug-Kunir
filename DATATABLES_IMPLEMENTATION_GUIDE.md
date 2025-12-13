# Panduan Implementasi DataTables ke Semua Tabel

## 📋 Daftar Tabel yang Perlu Diupdate

Berdasarkan scanning project, berikut tabel-tabel yang terdeteksi:

### ✅ Sudah Diimplementasikan
1. **InventarisProduk.tsx** - Sudah menggunakan DataTables

### 🔄 Perlu Diimplementasikan
2. **InventarisBarang.tsx** - Menggunakan pagination manual
3. **DaftarBarangMentah.tsx** - Menggunakan pagination manual
4. **LaporanBulanan.tsx** - Table tanpa pagination
5. **CetakLabel.tsx** - Table sederhana
6. **ListDataBarang.tsx** - Table dengan pagination
7. **Dashboard/Index.tsx** - Table untuk dashboard
8. **Apps/Contacts.tsx** - Table kontak
9. **Apps/Mailbox.tsx** - Table email

---

## 🚀 Langkah Implementasi untuk Setiap Tabel

### Step 1: Install Dependencies (Sudah Selesai)
```bash
npm install datatables.net-dt
```

### Step 2: Import Dependencies

Tambahkan di bagian atas file component:

```tsx
import { useRef } from 'react';
import DataTable from 'datatables.net-dt';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import './datatables-custom.css'; // Sesuaikan path relatif
```

### Step 3: Tambahkan State & Refs

```tsx
const [data, setData] = useState<any[]>([]); // Data yang akan ditampilkan
const [loading, setLoading] = useState(true);
const [search, setSearch] = useState('');
const [searchLoading, setSearchLoading] = useState(false);
const tableRef = useRef<HTMLTableElement>(null);
const dataTableRef = useRef<any>(null);
```

### Step 4: Update Fetch Function

Ubah fetch untuk mengambil semua data (bukan paginated):

```tsx
const fetchData = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    // Fetch all data dengan limit besar
    const url = `http://127.0.0.1:3333/api/endpoint?page=1&limit=1000`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    setData(result.data.data || []);
  } catch (error) {
    Swal.fire('Error', 'Terjadi kesalahan saat mengambil data', 'error');
  } finally {
    setLoading(false);
  }
};
```

### Step 5: Tambahkan DataTables Initialization

```tsx
// Effect untuk initialize DataTables
useEffect(() => {
  if (tableRef.current && data.length > 0 && !loading) {
    // Destroy existing DataTable if it exists
    if (dataTableRef.current) {
      try {
        dataTableRef.current.destroy();
      } catch (e) {
        console.log('Error destroying DataTable:', e);
      }
      dataTableRef.current = null;
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (tableRef.current && !dataTableRef.current) {
        try {
          dataTableRef.current = new DataTable(tableRef.current, {
            pageLength: 10,
            lengthMenu: [5, 10, 25, 50],
            ordering: true,
            searching: true,
            paging: true,
            info: true,
            autoWidth: false,
            retrieve: true,
            destroy: true,
            dom: '<"flex justify-between items-center mb-4"l>rt<"flex justify-between items-center mt-4"ip>',
            columnDefs: [
              { orderable: false, targets: -1 } // Disable sorting pada kolom terakhir (Aksi)
            ],
            language: {
              lengthMenu: "Tampilkan _MENU_ data per halaman",
              info: "Menampilkan _START_ sampai _END_ dari _TOTAL_ data",
              infoEmpty: "Menampilkan 0 sampai 0 dari 0 data",
              infoFiltered: "(difilter dari _MAX_ total data)",
              search: "Cari:",
              paginate: {
                first: '<iconify-icon icon="mdi:chevron-double-left"></iconify-icon>',
                last: '<iconify-icon icon="mdi:chevron-double-right"></iconify-icon>',
                next: '<iconify-icon icon="mdi:chevron-right"></iconify-icon>',
                previous: '<iconify-icon icon="mdi:chevron-left"></iconify-icon>'
              },
              zeroRecords: "Tidak ada data yang sesuai",
              emptyTable: "Tidak ada data tersedia"
            }
          });
        } catch (error) {
          console.error('Error initializing DataTable:', error);
        }
      }
    }, 150);

    return () => clearTimeout(timer);
  }

  // Cleanup
  return () => {
    if (dataTableRef.current) {
      try {
        dataTableRef.current.destroy();
      } catch (e) {
        console.log('Error in cleanup:', e);
      }
      dataTableRef.current = null;
    }
  };
}, [data, loading]);

// Effect untuk handle custom search
useEffect(() => {
  if (dataTableRef.current && search !== undefined) {
    setSearchLoading(true);
    const timer = setTimeout(() => {
      dataTableRef.current.search(search).draw();
      setSearchLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }
}, [search]);
```

### Step 6: Update JSX - Header dengan Search

```tsx
<div className="flex items-center justify-between flex-wrap gap-4">
  <h2 className="text-xl">Judul Halaman</h2>
  <div className="flex sm:flex-row flex-col sm:items-center sm:gap-3 gap-4 w-full sm:w-auto">
    <div className="flex gap-3">
      <button type="button" className="btn btn-primary" onClick={handleAdd}>
        <Icon icon="solar:add-circle-line-duotone" className="ltr:mr-2 rtl:ml-2" width="1.2rem" />
        Tambah Data
      </button>
      <div className="relative">
        <input
          type="text"
          className="form-input w-full sm:w-auto"
          placeholder="Cari..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button 
          type="button" 
          className={`absolute ltr:right-1 rtl:left-1 inset-y-1 m-auto rounded-full w-9 h-9 p-0 flex items-center justify-center ${searchLoading ? 'animate-spin' : ''}`}
        >
          <Icon icon={searchLoading ? "material-symbols:sync" : "material-symbols:search"} />
        </button>
      </div>
    </div>
  </div>
</div>
```

### Step 7: Update JSX - Table Structure

```tsx
{loading ? (
  <div className="mt-5 panel p-5 text-center">
    <p>Loading data...</p>
  </div>
) : (
  <div className="mt-5 panel p-5 border-0">
    <div className="datatables">
      <table ref={tableRef} id="uniqueTableId" className="table-striped table-hover" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>No</th>
            <th>Kolom 1</th>
            <th>Kolom 2</th>
            <th className="text-center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={item.id}>
              <td>{index + 1}</td>
              <td>{item.field1}</td>
              <td>{item.field2}</td>
              <td className="text-center">
                <div className="flex gap-2 justify-center">
                  <button className="btn btn-sm btn-outline-primary">
                    <Icon icon="mdi:eye" width="16" />
                  </button>
                  <button className="btn btn-sm btn-outline-warning">
                    <Icon icon="mdi:pencil" width="16" />
                  </button>
                  <button className="btn btn-sm btn-outline-danger">
                    <Icon icon="mdi:delete" width="16" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}
```

### Step 8: Remove Old Pagination

Hapus kode pagination manual seperti:
- State: `page`, `totalPages`, `limit`, `maxVisiblePages`
- Functions: `goToPage()`, `getVisiblePages()`, `getSerialNumber()`
- JSX pagination buttons

### Step 9: Copy CSS File

Copy file `datatables-custom.css` dari `src/pages/Inventaris/` ke folder yang sama dengan component yang sedang diupdate. Atau gunakan path absolut jika ingin sharing CSS.

---

## 📁 Struktur File CSS

Untuk memudahkan sharing CSS, bisa letakkan di folder global:

**Opsi 1: CSS Global (Recommended)**
```
src/
  styles/
    datatables-custom.css  <- Letakkan di sini
```

Import dengan:
```tsx
import '../styles/datatables-custom.css';
```

**Opsi 2: CSS Per Folder**
```
src/pages/
  Inventaris/
    datatables-custom.css
  BarangMentah/
    datatables-custom.css (copy)
  Keuangan/
    datatables-custom.css (copy)
```

---

## ⚠️ Hal yang Perlu Diperhatikan

1. **Table ID Unique**: Pastikan setiap table punya ID unik
   ```tsx
   <table ref={tableRef} id="produkTable">
   <table ref={tableRef} id="barangMentahTable">
   ```

2. **Column Index untuk Sorting**: Sesuaikan `targets` dengan kolom Aksi
   ```tsx
   columnDefs: [
     { orderable: false, targets: -1 } // -1 = kolom terakhir
     // atau
     { orderable: false, targets: 7 }  // Index spesifik
   ]
   ```

3. **Loading State**: Pastikan tabel hanya dirender setelah data loaded
   ```tsx
   {loading ? <Loading /> : <Table />}
   ```

4. **Memory Leak**: Cleanup DataTable saat unmount sudah dihandle di useEffect

5. **Browser Cache**: Setelah implementasi, lakukan hard refresh (`Ctrl + Shift + R`)

---

## 🎨 Kustomisasi

### Mengubah Jumlah Baris Default
```tsx
pageLength: 25, // Default 25 baris
lengthMenu: [10, 25, 50, 100], // Opsi dropdown
```

### Menonaktifkan Sorting di Multiple Columns
```tsx
columnDefs: [
  { orderable: false, targets: [0, -1] } // Kolom pertama dan terakhir
]
```

### Mengubah Warna Primary Button
Edit di `datatables-custom.css`:
```css
.dataTables_wrapper .dataTables_paginate .paginate_button.current {
  background-color: #your-color !important;
}
```

---

## 🐛 Troubleshooting

### Issue: DataTable not initialized
**Solution**: Pastikan data sudah loaded dan `loading = false`

### Issue: Cannot reinitialise DataTable
**Solution**: Sudah dihandle dengan `destroy: true` dan `retrieve: true`

### Issue: Pagination tidak muncul
**Solution**: Pastikan import CSS sudah benar

### Issue: Icon tidak muncul di pagination
**Solution**: Gunakan `<iconify-icon>` tag, bukan komponen React `<Icon>`

### Issue: Search tidak berfungsi
**Solution**: Pastikan useEffect untuk search sudah ditambahkan

---

## 📝 Checklist Implementasi

Untuk setiap tabel yang akan diupdate:

- [ ] Install dependencies (sekali saja untuk project)
- [ ] Import DataTable, CSS, dan useRef
- [ ] Tambahkan state dan refs
- [ ] Update fetch function untuk ambil semua data
- [ ] Tambahkan useEffect untuk DataTables initialization
- [ ] Tambahkan useEffect untuk custom search
- [ ] Update JSX header dengan search input
- [ ] Update JSX table dengan ref dan conditional rendering
- [ ] Hapus pagination manual (state, functions, JSX)
- [ ] Copy/import datatables-custom.css
- [ ] Test di browser
- [ ] Hard refresh browser

---

## 💡 Tips

1. **Implementasikan satu per satu** - Jangan update semua sekaligus
2. **Backup file dulu** - Sebelum edit, backup file asli
3. **Test setelah setiap perubahan** - Pastikan tidak ada error
4. **Gunakan git** - Commit setelah berhasil per file
5. **Dokumentasi perubahan** - Catat jika ada customization khusus

---

## 🎯 Priority Order (Rekomendasi)

Update dengan urutan priority:

1. **High Priority** (Sering diakses):
   - InventarisBarang.tsx
   - DaftarBarangMentah.tsx
   - Dashboard/Index.tsx

2. **Medium Priority**:
   - LaporanBulanan.tsx
   - Apps/Contacts.tsx

3. **Low Priority**:
   - CetakLabel.tsx
   - ListDataBarang.tsx
   - Apps/Mailbox.tsx

---

## 📞 Bantuan Lebih Lanjut

Jika ada pertanyaan atau kendala saat implementasi:
1. Pastikan pattern sama dengan InventarisProduk.tsx
2. Check console browser untuk error messages
3. Verifikasi network tab bahwa data sudah ter-fetch
4. Pastikan tidak ada conflict dengan CSS lain

---

**Happy Coding! 🚀**
