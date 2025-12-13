# 🔐 SISTEM ROLE-BASED AUTHENTICATION

## 📋 Overview
Sistem ini membedakan tampilan dan akses berdasarkan 3 role user:
- **Admin**: Akses penuh ke semua fitur
- **Karyawan**: Hanya dapat mengakses data produksi
- **Driver**: Hanya dapat mengakses data pengiriman

## 🏗️ Struktur Implementasi

### 1. **Type Definitions** (`src/types/auth.ts`)
```typescript
export type UserRole = 'admin' | 'karyawan' | 'driver';

export interface User {
    user_id: number;
    email: string;
    nama: string;
    role: UserRole;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
    admin: {
        canAccessDashboard: true,
        canAccessInventaris: true,
        canAccessMasterData: true,
        canAccessProduksi: true,
        canAccessPemeliharaan: true,
        canAccessPengadaan: true,
        canAccessUsers: true,
        canAccessGaji: true,
        canAccessPengiriman: true,
        canAccessLaporan: true,
    },
    karyawan: {
        canAccessDashboard: true,
        canAccessProduksi: true,
        // Semua yang lain: false
    },
    driver: {
        canAccessDashboard: true,
        canAccessPengiriman: true,
        // Semua yang lain: false
    },
};
```

### 2. **Auth Context** (`src/contexts/AuthContext.tsx`)
```typescript
// Provides global auth state management
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
```

### 3. **Route Protection** (`src/router/ProtectedRoute.tsx`)
```typescript
interface ProtectedRouteProps {
  children: JSX.Element;
  requiredPermission?: keyof RolePermissions;
  requiredRole?: UserRole;
  fallbackPath?: string;
}
```

### 4. **Route Helpers** (`src/router/RouteHelpers.tsx`)
```typescript
// Helper functions for easy route protection
export const adminOnly = (element: React.ReactElement) => {
    return withRoleProtection(element, undefined, 'admin');
};

export const karyawanOnly = (element: React.ReactElement) => {
    return withRoleProtection(element, undefined, 'karyawan');
};

export const driverOnly = (element: React.ReactElement) => {
    return withRoleProtection(element, undefined, 'driver');
};
```

## 🎯 Pembagian Akses Berdasarkan Role

### **👑 ADMIN**
**Akses Penuh:**
- ✅ Dashboard
- ✅ Inventaris (Barang & Produk)
- ✅ Master Data (Supplier, Pelanggan, Nama Barang, Nama Produk, Asset)
- ✅ Produksi (Semua operasi)
- ✅ Pemeliharaan Asset
- ✅ Pengadaan
- ✅ User Management
- ✅ Penggajian

### **👷 KARYAWAN**
**Akses Terbatas:**
- ✅ Dashboard
- ✅ Produksi (Hanya data yang mereka ikuti)
- ❌ Inventaris
- ❌ Master Data
- ❌ Pemeliharaan
- ❌ Pengadaan
- ❌ User Management
- ❌ Penggajian

### **🚛 DRIVER**
**Akses Khusus:**
- ✅ Dashboard
- ✅ Pengiriman (Barang pesanan yang perlu dikirim)
- ❌ Inventaris
- ❌ Master Data
- ❌ Produksi
- ❌ Pemeliharaan
- ❌ Pengadaan
- ❌ User Management
- ❌ Penggajian

## 📁 File Structure

```
src/
├── types/
│   └── auth.ts                 # Type definitions & permissions
├── contexts/
│   └── AuthContext.tsx         # Global auth state management
├── router/
│   ├── ProtectedRoute.tsx      # Route protection component
│   ├── RouteHelpers.tsx        # Helper functions for routes
│   └── routes.tsx              # All application routes
├── components/
│   └── Layouts/
│       ├── Sidebar.tsx         # Role-based sidebar menu
│       └── Header.tsx          # Logout functionality
└── pages/
    ├── Authentication/
    │   └── Login.tsx           # Updated login with role support
    └── Apps/
        └── Pengiriman/
            └── Index.tsx       # Driver-specific page
```

## 🔧 Cara Penggunaan

### **1. Login dengan Role**
```typescript
// Login akan secara otomatis menyimpan role user
const submitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    // ... login logic
    const result: LoginResponse = await response.json();
    
    // AuthContext akan menyimpan user data termasuk role
    login(result.data.user, result.data.token.token);
    
    navigate('/dashboard');
};
```

### **2. Conditional Sidebar Menu**
```typescript
// Sidebar akan secara otomatis menyembunyikan menu berdasarkan role
{canAccessMenu('inventaris') && (
    <li className="menu nav-item">
        {/* Menu inventaris hanya muncul untuk admin */}
    </li>
)}

{canAccessMenu('produksi') && (
    <li className="nav-item">
        {/* Menu produksi muncul untuk admin dan karyawan */}
    </li>
)}

{canAccessMenu('pengiriman') && (
    <li className="nav-item">
        {/* Menu pengiriman hanya muncul untuk driver */}
    </li>
)}
```

### **3. Route Protection**
```typescript
// Di routes.tsx
{
    path: '/masterdata/supplier',
    element: adminOnly(<Supplier />),  // Hanya admin
},
{
    path: '/apps/produksi',
    element: withPermission(<ProduksiList />, 'canAccessProduksi'),  // Admin & Karyawan
},
{
    path: '/pengiriman',
    element: driverOnly(<PengirimanPage />),  // Hanya driver
}
```

### **4. Component Level Access Control**
```typescript
// Di component manapun
const { hasPermission, hasRole, canAccessMenu } = useAuth();

// Check permission
if (hasPermission('canAccessInventaris')) {
    // Show inventaris related content
}

// Check specific role
if (hasRole('admin')) {
    // Show admin-only content
}

// Check menu access
if (canAccessMenu('produksi')) {
    // Show produksi menu item
}
```

## 🚀 Testing Guide

### **Test Scenario 1: Admin Login**
1. Login dengan user yang memiliki role `admin`
2. Verifikasi sidebar menampilkan semua menu
3. Akses semua halaman harus berhasil
4. Tidak ada error 403 atau redirect

### **Test Scenario 2: Karyawan Login**
1. Login dengan user yang memiliki role `karyawan`
2. Verifikasi sidebar hanya menampilkan Dashboard dan Produksi
3. Akses halaman master data harus redirect ke dashboard
4. Akses halaman produksi harus berhasil

### **Test Scenario 3: Driver Login**
1. Login dengan user yang memiliki role `driver`
2. Verifikasi sidebar hanya menampilkan Dashboard dan Pengiriman
3. Akses halaman lain harus redirect ke dashboard
4. Akses halaman pengiriman harus berhasil

### **Test Scenario 4: Logout & Session**
1. Logout dari aplikasi
2. Verifikasi redirect ke halaman login
3. Verifikasi localStorage dibersihkan
4. Refresh page tidak boleh auto-login

## 🔍 Troubleshooting

### **Problem**: Menu tidak muncul setelah login
**Solution**: 
- Cek apakah AuthProvider sudah di-wrap di App.tsx
- Verifikasi role user di localStorage
- Cek console untuk error CORS atau network

### **Problem**: Access denied setelah login
**Solution**:
- Verifikasi role permissions di auth.ts
- Cek implementasi ProtectedRoute
- Pastikan route menggunakan helper yang benar

### **Problem**: Sidebar tidak responsive terhadap role
**Solution**:
- Verifikasi useAuth hook dipanggil di Sidebar.tsx
- Cek function canAccessMenu implementation
- Pastikan AuthProvider state ter-update

## 📝 Notes

1. **Backend Compatibility**: Pastikan backend mengembalikan field `role` dalam response login
2. **Session Persistence**: User role disimpan dalam localStorage dan akan di-restore saat aplikasi di-reload
3. **Security**: Route protection hanya di frontend - pastikan backend juga memiliki authorization
4. **Performance**: AuthContext hanya re-render saat state berubah menggunakan useReducer
5. **Extensibility**: Mudah menambah role baru dengan menambahkan di UserRole type dan ROLE_PERMISSIONS

## 🔄 Future Enhancements

1. **Dynamic Permissions**: Load permissions dari backend
2. **Role Hierarchy**: Implementasi role yang memiliki inheritance
3. **Feature Flags**: Kontrol fitur berdasarkan role dan environment
4. **Audit Logging**: Track akses user berdasarkan role
5. **Multi-tenancy**: Support multiple tenant dengan role berbeda