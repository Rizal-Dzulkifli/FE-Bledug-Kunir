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
    data?: T;
    message?: string;
    summary?: {
        total_masuk: number;
        total_keluar: number;
    };
    meta?: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
        first_page: number;
        first_page_url: string;
        last_page_url: string;
        next_page_url: string | null;
        previous_page_url: string | null;
    };
}

export interface KeuanganEksternal {
    keuangan_id: number;
    tanggal: string;
    deskripsi: string;
    biaya: number;
    status: 'masuk' | 'keluar';
    kategori: 'operasional' | 'investasi' | 'penjualan' | 'pembelian' | 'lainnya';
    referensi?: string;
    catatan?: string;
    created_by: number;
    createdAt: string;
    updatedAt: string;
}

export interface KeuanganFormData {
    tanggal: string;
    deskripsi: string;
    biaya: number;
    status: 'masuk' | 'keluar';
    kategori: 'operasional' | 'investasi' | 'penjualan' | 'pembelian' | 'lainnya';
    referensi?: string;
    catatan?: string;
}

export interface DashboardSummary {
    total_keseluruhan: {
        total_masuk: number;
        total_keluar: number;
        breakdown_pengeluaran?: {
            keuangan_eksternal: number;
            pemeliharaan: number;
            pengadaan: number;
            produksi: number;
        };
    };
    bulan_ini: {
        total_masuk: number;
        total_keluar: number;
        jumlah_transaksi: number;
        breakdown_pengeluaran?: {
            keuangan_eksternal: number;
            pemeliharaan: number;
            pengadaan: number;
            produksi: number;
        };
    };
    transaksi_terakhir: KeuanganEksternal[];
}

export interface DashboardLengkap {
    ringkasan_harian: {
        tanggal: string;
        pemasukan: number;
        pengeluaran: number;
    };
    ringkasan_bulanan: {
        bulan: string;
        pemasukan: number;
        pengeluaran: number;
    };
    ringkasan_tahunan: {
        tahun: number;
        pemasukan: number;
        pengeluaran: number;
    };
    kategori_pengeluaran: {
        operasional: number;
        investasi: number;
        pembelian: number;
        pengadaan: number;
        pemeliharaan: number;
        penggajian: number;
        lainnya: number;
    };
    tren_bulanan: Array<{
        bulan: string;
        pemasukan: number;
        pengeluaran: number;
    }>;
}

export interface LaporanKeuangan {
    periode: {
        start_date: string;
        end_date: string;
    };
    summary: {
        total_masuk: number;
        total_keluar: number;
        jumlah_transaksi: number;
        breakdown_pengeluaran?: {
            keuangan_eksternal: number;
            pemeliharaan: number;
            pengadaan: number;
            produksi: number;
        };
    };
    kategori_summary: {
        [key: string]: {
            masuk: number;
            keluar: number;
        };
    };
    transaksi: KeuanganEksternal[];
}

export interface LaporanTerpadu {
    periode: {
        start_date: string;
        end_date: string;
    };
    keuangan_eksternal: {
        total_masuk: number;
        total_keluar: number;
        transaksi: KeuanganEksternal[];
    };
    penjualan: {
        total_penjualan: number;
        jumlah_pesanan: number;
        pesanan: any[];
    };
    pengadaan_bahan: {
        total_biaya: number;
        jumlah_pengadaan: number;
        pengadaan: any[];
    };
    pemeliharaan: {
        total_biaya: number;
        jumlah_pemeliharaan: number;
        pemeliharaan: any[];
    };
    penggajian_produksi?: {
        total_gaji: number;
        jumlah_produksi: number;
        jumlah_karyawan: number;
        produksi: any[];
    };
    penggajian_driver?: {
        total_gaji: number;
        jumlah_pengiriman: number;
        jumlah_driver: number;
        pengiriman: any[];
    };
    total_keseluruhan: {
        total_pemasukan: number;
        total_pengeluaran: number;
        saldo_bersih: number;
    };
}

export interface ProyeksiKeuangan {
    proyeksi: Array<{
        bulan: string;
        proyeksi_pemasukan: number;
        proyeksi_pengeluaran: number;
        proyeksi_saldo: number;
    }>;
    rekomendasi: string[];
}

// Interface for integrated transaction (including pemeliharaan, pengadaan, penggajian, dan penjualan)
export interface TransaksiTerpadu extends KeuanganEksternal {
    id: string; // Unique ID for all transaction types (pemeliharaan_1, pengadaan-2, etc)
    jenis_transaksi: 'keuangan' | 'pemeliharaan' | 'pengadaan' | 'penggajian' | 'penjualan';
    asal_modul?: string;
    detail_asal?: {
        id?: number;
        nomor?: string;
        nama_aset?: string;
        nama_bahan?: string;
        kode_produksi?: string;
        jumlah_karyawan?: number;
        detail_karyawan?: Array<{
            nama: string;
            berat_hasil: number;
            gaji_total: number;
        }>;
        no_pesanan?: string;
        nama_pelanggan?: string;
        status_pemesanan?: string;
        status_pembayaran?: string;
        mode_pengiriman?: string;
    };
}

// Keuangan Eksternal Service
export class KeuanganEksternalService {
    
    // Get list of transactions with filters
    static async getTransaksi(params?: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
        kategori?: string;
        start_date?: string;
        end_date?: string;
    }): Promise<ApiResponse<KeuanganEksternal[]>> {
        const queryParams = new URLSearchParams();
        
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    queryParams.append(key, value.toString());
                }
            });
        }

        const url = `${API_BASE_URL}/keuangan-eksternal?${queryParams.toString()}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: getHeaders(),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    // Create new transaction
    static async createTransaksi(data: KeuanganFormData): Promise<ApiResponse<KeuanganEksternal>> {
        const response = await fetch(`${API_BASE_URL}/keuangan-eksternal`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    // Get transaction by ID
    static async getTransaksiById(id: number): Promise<ApiResponse<KeuanganEksternal>> {
        const response = await fetch(`${API_BASE_URL}/keuangan-eksternal/${id}`, {
            method: 'GET',
            headers: getHeaders(),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    // Update transaction
    static async updateTransaksi(id: number, data: Partial<KeuanganFormData>): Promise<ApiResponse<KeuanganEksternal>> {
        const response = await fetch(`${API_BASE_URL}/keuangan-eksternal/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    // Delete transaction
    static async deleteTransaksi(id: number): Promise<ApiResponse<null>> {
        const response = await fetch(`${API_BASE_URL}/keuangan-eksternal/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    // Get integrated transactions (keuangan + pemeliharaan + pengadaan)
    static async getTransaksiTerpadu(params: {
        page?: number;
        limit?: number;
        startDate?: string;
        endDate?: string;
        status?: string;
        search?: string;
    } = {}): Promise<{
        data: TransaksiTerpadu[];
        meta: {
            total: number;
            per_page: number;
            current_page: number;
            last_page: number;
        };
        summary?: {
            total_pemasukan: number;
            total_pengeluaran: number;
            total_keuangan: number;
            total_pemeliharaan: number;
            total_pengadaan: number;
            total_penggajian: number;
            total_penjualan: number;
        };
    }> {
        const queryParams = new URLSearchParams();
        
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        if (params.status) queryParams.append('status', params.status);
        if (params.search) queryParams.append('search', params.search);

        const response = await fetch(`${API_BASE_URL}/keuangan-eksternal/transaksi-terpadu?${queryParams}`, {
            method: 'GET',
            headers: getHeaders(),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    // Get dashboard summary
    static async getDashboard(): Promise<DashboardSummary> {
        const response = await fetch(`${API_BASE_URL}/keuangan-eksternal/dashboard`, {
            method: 'GET',
            headers: getHeaders(),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    // Get dashboard lengkap
    static async getDashboardLengkap(): Promise<DashboardLengkap> {
        const response = await fetch(`${API_BASE_URL}/keuangan-eksternal/dashboard-lengkap`, {
            method: 'GET',
            headers: getHeaders(),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    // Get laporan
    static async getLaporan(params?: {
        start_date?: string;
        end_date?: string;
    }): Promise<LaporanKeuangan> {
        const queryParams = new URLSearchParams();
        
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    queryParams.append(key, value);
                }
            });
        }

        const url = `${API_BASE_URL}/keuangan-eksternal/laporan?${queryParams.toString()}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: getHeaders(),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    // Get laporan terpadu
    static async getLaporanTerpadu(params?: {
        start_date?: string;
        end_date?: string;
    }): Promise<LaporanTerpadu> {
        const queryParams = new URLSearchParams();
        
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    queryParams.append(key, value);
                }
            });
        }

        const url = `${API_BASE_URL}/keuangan-eksternal/laporan-terpadu?${queryParams.toString()}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: getHeaders(),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    // Get ringkasan bulanan
    static async getRingkasanBulanan(year: number): Promise<{
        year: number;
        ringkasan_bulanan: Array<{
            month: number;
            monthName: string;
            year: number;
            total_pemasukan: number;
            total_pengeluaran: number;
            breakdown_pengeluaran?: {
                keuangan_eksternal: number;
                pemeliharaan: number;
                pengadaan: number;
                produksi: number;
            };
            jumlah_transaksi: number;
            periode: {
                start_date: string;
                end_date: string;
            };
        }>;
        total_keseluruhan: {
            total_pemasukan: number;
            total_pengeluaran: number;
            jumlah_transaksi: number;
        };
    }> {
        const response = await fetch(`${API_BASE_URL}/keuangan-eksternal/ringkasan-bulanan?year=${year}`, {
            method: 'GET',
            headers: getHeaders(),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    // Get proyeksi
    static async getProyeksi(bulanKeDepan?: number): Promise<ProyeksiKeuangan> {
        const queryParams = new URLSearchParams();
        
        if (bulanKeDepan) {
            queryParams.append('bulan_ke_depan', bulanKeDepan.toString());
        }

        const url = `${API_BASE_URL}/keuangan-eksternal/proyeksi?${queryParams.toString()}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: getHeaders(),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }
}

export default KeuanganEksternalService;