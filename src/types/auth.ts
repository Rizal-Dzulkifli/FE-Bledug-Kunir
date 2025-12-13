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

export interface AuthToken {
    token: string;
    type: string;
    expires_at?: string;
}

export interface LoginResponse {
    data: {
        user: User;
        token: AuthToken;
    };
    message: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    role: UserRole | null;
}

// Permissions berdasarkan role
export interface RolePermissions {
    canAccessDashboard: boolean;
    canAccessInventaris: boolean;
    canAccessMasterData: boolean;
    canAccessProduksi: boolean;
    canAccessPemeliharaan: boolean;
    canAccessPengadaan: boolean;
    canAccessPesanan: boolean;
    canAccessUsers: boolean;
    canAccessGaji: boolean;
    canAccessPengiriman: boolean;
    canAccessLaporan: boolean;
    canAccessKeuangan: boolean;
}

// Konfigurasi menu untuk setiap role
export interface MenuConfig {
    admin: string[];
    karyawan: string[];
    driver: string[];
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
    admin: {
        canAccessDashboard: true,
        canAccessInventaris: true,
        canAccessMasterData: true,
        canAccessProduksi: true,
        canAccessPemeliharaan: true,
        canAccessPengadaan: true,
        canAccessPesanan: true,
        canAccessUsers: true,
        canAccessGaji: true,
        canAccessPengiriman: true,
        canAccessLaporan: true,
        canAccessKeuangan: true,
    },
    karyawan: {
        canAccessDashboard: true,
        canAccessInventaris: false,
        canAccessMasterData: false,
        canAccessProduksi: true,
        canAccessPemeliharaan: false,
        canAccessPengadaan: false,
        canAccessPesanan: false,
        canAccessUsers: false,
        canAccessGaji: false,
        canAccessPengiriman: false, // Karyawan tidak bisa akses pengiriman
        canAccessLaporan: false,
        canAccessKeuangan: false,
    },
    driver: {
        canAccessDashboard: true,
        canAccessInventaris: false,
        canAccessMasterData: false,
        canAccessProduksi: false,
        canAccessPemeliharaan: false,
        canAccessPengadaan: false,
        canAccessPesanan: false,
        canAccessUsers: false,
        canAccessGaji: false,
        canAccessPengiriman: true,
        canAccessLaporan: false,
        canAccessKeuangan: false,
    },
};

export const MENU_CONFIG: MenuConfig = {
    admin: [
        'dashboard',
        'inventaris',
        'masterdata', 
        'produksi',
        'pemeliharaan',
        'pengadaan',
        'users',
        'gaji'
    ],
    karyawan: [
        'dashboard',
        'produksi'
    ],
    driver: [
        'dashboard',
        'pengiriman'
    ]
};