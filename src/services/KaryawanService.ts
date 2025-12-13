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

export interface KaryawanStats {
    total_produksi: number;
    produksi_bulan_ini: number;
    total_inventaris: number;
    inventaris_tersedia: number;
    total_pengiriman: number;
    pengiriman_selesai: number;
}

export interface RecentProduksi {
    id: number;
    no_produksi: string;
    tanggal_produksi: string;
    total_kuantitas: number;
    status: string;
    karyawan: {
        nama: string;
    };
    detailProduksi: Array<{
        produk: {
            kode: string;
            namaProduk: {
                nama_produk: string;
            };
        };
        kuantitas: number;
    }>;
}

export interface InventarisItem {
    id: number;
    kode_barang: string;
    namaBarang: string;
    lokasi: string;
    status: string;
    created_at: string;
}

class KaryawanService {
    private baseUrl = API_BASE_URL;

    // Get karyawan statistics (using existing endpoints)
    async getKaryawanStats(): Promise<ApiResponse<KaryawanStats>> {
        try {
            // Menggunakan endpoint yang sudah ada untuk mendapatkan statistik
            const [statistikResponse, produksiResponse, pengirimanResponse] = await Promise.all([
                fetch(`${this.baseUrl}/statistics`, {
                    method: 'GET',
                    headers: getHeaders(),
                }),
                fetch(`${this.baseUrl}/produksi/statistics`, {
                    method: 'GET',
                    headers: getHeaders(),
                }),
                fetch(`${this.baseUrl}/pengiriman/statistics`, {
                    method: 'GET',
                    headers: getHeaders(),
                })
            ]);

            const [statistikData, produksiData, pengirimanData] = await Promise.all([
                statistikResponse.json(),
                produksiResponse.json(),
                pengirimanResponse.json()
            ]);

            // Kombinasi data dari berbagai endpoint
            const stats: KaryawanStats = {
                total_produksi: produksiData.data?.total_produksi || 0,
                produksi_bulan_ini: produksiData.data?.produksi_bulan_ini || 0,
                total_inventaris: statistikData.totalInventaris || 0,
                inventaris_tersedia: statistikData.tersedia || 0,
                total_pengiriman: pengirimanData.data?.total_pengiriman?.[0]?.total || 0,
                pengiriman_selesai: pengirimanData.data?.selesai || 0,
            };

            return {
                success: true,
                message: 'Statistik karyawan berhasil diambil',
                data: stats
            };
        } catch (error) {
            console.error('Error fetching karyawan stats:', error);
            return {
                success: false,
                message: 'Gagal mengambil statistik karyawan',
                data: {
                    total_produksi: 0,
                    produksi_bulan_ini: 0,
                    total_inventaris: 0,
                    inventaris_tersedia: 0,
                    total_pengiriman: 0,
                    pengiriman_selesai: 0,
                }
            };
        }
    }

    // Get recent produksi
    async getRecentProduksi(limit: number = 5): Promise<ApiResponse<RecentProduksi[]>> {
        try {
            const response = await fetch(`${this.baseUrl}/produksi?limit=${limit}&page=1`, {
                method: 'GET',
                headers: getHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return {
                success: result.success,
                message: result.message,
                data: result.data.data || [] // Extract the data array from pagination
            };
        } catch (error) {
            console.error('Error fetching recent produksi:', error);
            return {
                success: false,
                message: 'Gagal mengambil data produksi',
                data: []
            };
        }
    }

    // Get recent inventaris
    async getRecentInventaris(limit: number = 5): Promise<ApiResponse<InventarisItem[]>> {
        try {
            const response = await fetch(`${this.baseUrl}/inventaris?limit=${limit}&page=1`, {
                method: 'GET',
                headers: getHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return {
                success: result.success,
                message: result.message,
                data: result.data.data || [] // Extract the data array from pagination
            };
        } catch (error) {
            console.error('Error fetching recent inventaris:', error);
            return {
                success: false,
                message: 'Gagal mengambil data inventaris',
                data: []
            };
        }
    }

    // Get inventaris statistics for chart
    async getInventarisStats(): Promise<ApiResponse<{
        tersedia: number;
        ditempatkan: number;
        dipinjamkan: number;
        rusak: number;
    }>> {
        try {
            const response = await fetch(`${this.baseUrl}/statistics`, {
                method: 'GET',
                headers: getHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return {
                success: true,
                message: 'Statistik inventaris berhasil diambil',
                data: {
                    tersedia: result.tersedia || 0,
                    ditempatkan: result.ditempatkan || 0,
                    dipinjamkan: result.dipinjamkan || 0,
                    rusak: result.rusak || 0,
                }
            };
        } catch (error) {
            console.error('Error fetching inventaris stats:', error);
            return {
                success: false,
                message: 'Gagal mengambil statistik inventaris',
                data: {
                    tersedia: 0,
                    ditempatkan: 0,
                    dipinjamkan: 0,
                    rusak: 0,
                }
            };
        }
    }
}

export default new KaryawanService();