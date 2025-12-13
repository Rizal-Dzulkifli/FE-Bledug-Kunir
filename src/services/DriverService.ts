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

export interface DriverStats {
    total_pengiriman: number;
    dalam_perjalanan: number;
    selesai: number;
    gagal: number;
    pengiriman_hari_ini: number;
    total_gaji: number;
    gaji_dibayar: number;
    gaji_belum_dibayar: number;
}

export interface RecentDelivery {
    id: number;
    pesanan: {
        no_pesanan: string;
        pelanggan: {
            nama: string;
        };
        total_harga: number;
    };
    tanggal_pengiriman: string;
    alamat_pengiriman?: string;
    status_pengiriman: string;
    gaji_driver: number;
    gaji_dibayar: boolean;
}

class DriverService {
    private baseUrl = `${API_BASE_URL}/pengiriman`;

    // Get driver statistics
    async getDriverStats(driverId: number): Promise<ApiResponse<DriverStats>> {
        try {
            const response = await fetch(`${this.baseUrl}/driver/${driverId}/stats`, {
                method: 'GET',
                headers: getHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching driver stats:', error);
            // Fallback: return empty stats if endpoint fails
            return {
                success: false,
                message: 'Failed to fetch stats',
                data: {
                    total_pengiriman: 0,
                    dalam_perjalanan: 0,
                    selesai: 0,
                    gagal: 0,
                    pengiriman_hari_ini: 0,
                    total_gaji: 0,
                    gaji_dibayar: 0,
                    gaji_belum_dibayar: 0,
                }
            };
        }
    }

    // Get recent deliveries for driver
    async getRecentDeliveries(driverId: number, limit: number = 5): Promise<ApiResponse<RecentDelivery[]>> {
        try {
            const response = await fetch(`${this.baseUrl}/driver/${driverId}?limit=${limit}&page=1`, {
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
                data: result.data.data // Extract the data array from pagination
            };
        } catch (error) {
            console.error('Error fetching recent deliveries:', error);
            throw error;
        }
    }

    // Get driver salary report
    async getSalaryReport(driverId: number, startDate?: string, endDate?: string): Promise<ApiResponse<{
        totalGaji: number;
        totalPengiriman: number;
        pengiriman: any[];
    }>> {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('driver_id', driverId.toString());
            if (startDate) queryParams.append('start_date', startDate);
            if (endDate) queryParams.append('end_date', endDate);

            const response = await fetch(`${this.baseUrl}/gaji/laporan?${queryParams.toString()}`, {
                method: 'GET',
                headers: getHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching salary report:', error);
            throw error;
        }
    }
}

export default new DriverService();