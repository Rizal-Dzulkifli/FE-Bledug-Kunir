import { API_URL, getAuthHeaders as getConfigAuthHeaders } from '../config/api';

// API Base Configuration
const API_BASE_URL = API_URL;

// Get token from localStorage
const getAuthToken = (): string | null => {
    return localStorage.getItem('token');
};

// Common headers for API requests
const getHeaders = (): HeadersInit => {
    const token = getAuthToken();
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };
};

// API Response interfaces
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface PaginatedResponse<T> {
    success: boolean;
    message: string;
    data: {
        data: T[];
        meta: {
            total: number;
            per_page: number;
            current_page: number;
            last_page: number;
        };
    };
}

// Pengiriman interfaces
export interface Pelanggan {
    id_kontak: number;
    nama: string;
    no_telp: string;
    alamat: string;
}

export interface Driver {
    user_id: number;
    nama: string;
    email: string;
}

export interface DetailPesanan {
    id_detail_pesanan: number;
    jenis_barang: 'barang_mentah' | 'produk';
    kuantitas: number;
    barangMentah?: {
        kode: string;
        namaBarangMentah: {
            nama_barang_mentah: string;
        };
    };
    produk?: {
        kode: string;
        namaProduk: {
            nama_produk: string;
        };
    };
}

export interface Pesanan {
    id_pesanan: number;
    no_pesanan: string;
    tgl_pesanan: string;
    total_harga: number;
    status_pemesanan: string;
    status_pembayaran: string;
    mode_pengiriman: string;
    pelanggan: Pelanggan;
    detailPesanan: DetailPesanan[];
}

export interface Pengiriman {
    id: number;
    pesanan_id: number;
    driver_id: number;
    tanggal_pengiriman: string;
    status_pengiriman: 'Dalam Perjalanan' | 'Selesai' | 'Gagal';
    gaji_driver: number;
    gaji_dibayar: boolean;
    catatan: string | null;
    createdAt: string;
    updatedAt: string;
    pesanan: Pesanan;
    driver: Driver;
}

export interface GajiDriverReport {
    totalGaji: number;
    totalPengiriman: number;
    transaksi: Pengiriman[]; // Ubah dari transaksi keuangan ke data pengiriman
}

export interface BatchPaymentResult {
    berhasil: number;
    gagal: number;
    detail: {
        berhasil: number[]; // Array ID pengiriman yang berhasil
        gagal: Array<{ id: number; error: string }>;
    };
}

export interface PengirimanStats {
    total_pengiriman: Array<{ total: number }>;
    dalam_perjalanan: number;
    selesai: number;
    gagal: number;
    pengiriman_hari_ini: Pengiriman[];
}

export interface CreatePengirimanData {
    pesanan_id: number;
    driver_id: number;
    tanggal_pengiriman: string;
    catatan?: string;
}

export interface UpdatePengirimanData {
    status_pengiriman: 'Dalam Perjalanan' | 'Selesai' | 'Gagal';
    catatan?: string;
}

// PengirimanService class
class PengirimanService {
    private baseUrl = `${API_BASE_URL}/pengiriman`;

    // Get all pengiriman with filters
    async getAllPengiriman(params?: {
        page?: number;
        limit?: number;
        status_pengiriman?: string;
        driver_id?: number;
        start_date?: string;
        end_date?: string;
    }): Promise<PaginatedResponse<Pengiriman>> {
        try {
            const queryParams = new URLSearchParams();
            if (params) {
                Object.entries(params).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        queryParams.append(key, String(value));
                    }
                });
            }

            const url = `${this.baseUrl}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: getHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching pengiriman:', error);
            throw error;
        }
    }

    // Get single pengiriman by ID
    async getPengirimanById(id: number): Promise<ApiResponse<Pengiriman>> {
        try {
            const response = await fetch(`${this.baseUrl}/${id}`, {
                method: 'GET',
                headers: getHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching pengiriman by ID:', error);
            throw error;
        }
    }

    // Create new pengiriman
    async createPengiriman(data: CreatePengirimanData): Promise<ApiResponse<Pengiriman>> {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating pengiriman:', error);
            throw error;
        }
    }

    // Update pengiriman status
    async updatePengiriman(id: number, data: UpdatePengirimanData): Promise<ApiResponse<Pengiriman>> {
        try {
            const response = await fetch(`${this.baseUrl}/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating pengiriman:', error);
            throw error;
        }
    }

    // Delete pengiriman
    async deletePengiriman(id: number): Promise<ApiResponse<any>> {
        try {
            const response = await fetch(`${this.baseUrl}/${id}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error deleting pengiriman:', error);
            throw error;
        }
    }

    // Get pesanan siap kirim
    async getPesananSiapKirim(params?: {
        page?: number;
        limit?: number;
    }): Promise<PaginatedResponse<Pesanan>> {
        try {
            const queryParams = new URLSearchParams();
            if (params) {
                Object.entries(params).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        queryParams.append(key, String(value));
                    }
                });
            }

            const url = `${this.baseUrl}/pesanan-siap-kirim${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: getHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching pesanan siap kirim:', error);
            throw error;
        }
    }

    // Get available drivers
    async getDrivers(): Promise<ApiResponse<Driver[]>> {
        try {
            const response = await fetch(`${this.baseUrl}/drivers`, {
                method: 'GET',
                headers: getHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching drivers:', error);
            throw error;
        }
    }

    // Get pengiriman by driver
    async getPengirimanByDriver(driverId: number, params?: {
        page?: number;
        limit?: number;
        status?: string;
    }): Promise<PaginatedResponse<Pengiriman>> {
        try {
            const queryParams = new URLSearchParams();
            if (params) {
                Object.entries(params).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        queryParams.append(key, String(value));
                    }
                });
            }

            const url = `${this.baseUrl}/driver/${driverId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: getHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching pengiriman by driver:', error);
            throw error;
        }
    }

    // Get pengiriman statistics
    async getPengirimanStats(): Promise<ApiResponse<PengirimanStats>> {
        try {
            const response = await fetch(`${this.baseUrl}/statistics`, {
                method: 'GET',
                headers: getHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching pengiriman statistics:', error);
            throw error;
        }
    }

    // Get gaji yang belum dibayar
    async getGajiBelumDibayar(driverId?: number): Promise<ApiResponse<GajiDriverReport>> {
        try {
            const queryParams = new URLSearchParams();
            if (driverId) {
                queryParams.append('driver_id', String(driverId));
            }

            const url = `${this.baseUrl}/gaji/belum-dibayar${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: getHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching unpaid salary:', error);
            throw error;
        }
    }

    // Bayar gaji driver batch
    async bayarGajiDriver(pengirimanIds: number[], catatan?: string): Promise<ApiResponse<BatchPaymentResult>> {
        try {
            const response = await fetch(`${this.baseUrl}/gaji/bayar`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    pengiriman_ids: pengirimanIds,
                    catatan
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error paying driver salary:', error);
            throw error;
        }
    }

    // Get laporan gaji driver (langsung dari data pengiriman)
    async getLaporanGajiDriver(params?: {
        driver_id?: number;
        start_date?: string;
        end_date?: string;
    }): Promise<ApiResponse<{
        totalGaji: number;
        totalPengiriman: number;
        pengiriman: Pengiriman[];
    }>> {
        try {
            const queryParams = new URLSearchParams();
            if (params) {
                Object.entries(params).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        queryParams.append(key, String(value));
                    }
                });
            }

            const url = `${this.baseUrl}/gaji/laporan${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: getHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching driver salary report:', error);
            throw error;
        }
    }
}

export default new PengirimanService();