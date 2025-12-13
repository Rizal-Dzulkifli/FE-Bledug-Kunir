import { API_URL } from '../config/api';

// Service untuk Pengadaan Barang Mentah dengan fitur tracking dan hooks
export interface BeratTersedia {
  id_barangmentah: number;
  nama_barang: string;
  kode: string;
  total_berat_masuk: number;
  total_berat_terpakai: number;
  berat_tersedia: number;
  harga_beli_rata: number;
}

export interface DetailKetersediaan extends BeratTersedia {
  riwayat_pengadaan: Array<{
    no_pemesanan: string;
    tgl_transaksi: string;
    berat: number;
  }>;
  riwayat_penggunaan: Array<{
    no_produksi: string;
    tgl_produksi: string;
    berat_terpakai: number;
  }>;
}

export interface PrediksiKehabisan {
  berat_tersedia: number;
  rata_penggunaan_per_hari: number;
  prediksi_hari_habis: number;
  status_prediksi: 'aman' | 'peringatan' | 'kritis';
}

export interface RingkasanKetersediaan {
  total_jenis_barang: number;
  barang_hampir_habis: number;
  barang_stok_aman: number;
  total_nilai_stok: number;
}

export interface ValidasiKetersediaan {
  valid: boolean;
  detail: Array<{
    id_barangmentah: number;
    nama_barang: string;
    berat_diminta: number;
    tersedia: boolean;
    status: 'OK' | 'TIDAK_CUKUP';
  }>;
}

export interface Supplier {
  id_kontak: number;
  nama: string;
  no_telp: string | null;
  alamat: string | null;
}

export interface BarangMentah {
  id_barangmentah: number;
  id_bm: number;
  kode: string;
  berat_mentah: number;
  harga_beli: number;
  harga_jual: number;
  namaBarangMentah?: {
    id_bm: number;
    nama_barang_mentah: string;
    kode_barang: string;
  };
}

export interface DetailPengadaan {
  id_dpemesananb: number;
  id_barangmentah: number;
  berat: number;
  barangMentah: BarangMentah;
}

export interface PengadaanItem {
  id_pemesanan: number;
  id_kontak: number;
  no_pemesanan: string;
  tgl_transaksi: string;
  total_harga: number;
  status: 'selesai' | 'belum di bayar' | 'dibatalkan' | 'proses';
  deskripsi: string | null;
  kontak: Supplier;
  detailPengadaan: DetailPengadaan[];
}

export interface PaginatedPengadaan {
  data: PengadaanItem[];
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}

export interface CreatePengadaanPayload {
  id_kontak: number;
  tgl_transaksi: string;
  status: 'selesai' | 'belum di bayar' | 'dibatalkan' | 'proses';
  deskripsi?: string;
  detail_barang: Array<{
    id_barangmentah: number;
    berat: number;
  }>;
}

class PengadaanBarangMentahService {
  private static BASE_URL = `${API_URL}/pengadaan-barang-mentah`;

  private static getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  // ==================== BASIC CRUD OPERATIONS ====================

  /**
   * Get paginated pengadaan list with search
   */
  static async getPengadaans(
    page: number = 1, 
    limit: number = 10, 
    search?: string
  ): Promise<{ data: PaginatedPengadaan; message: string }> {
    try {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const url = `${this.BASE_URL}?page=${page}&limit=${limit}${searchParam}`;
      
      // 🔧 Add timeout and retry mechanism
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // 🔧 Handle specific error status
        if (response.status === 503) {
          throw new Error('Database service is currently unavailable. Please try again in a moment.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching pengadaans:', error);
      
      // 🔧 Enhanced error handling
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout. Please check your connection and try again.');
        }
        if (error.message.includes('Failed to fetch')) {
          throw new Error('Unable to connect to server. Please check if the backend is running.');
        }
      }
      
      throw error;
    }
  }

  /**
   * Get single pengadaan by ID
   */
  static async getPengadaanById(id: number): Promise<{ data: PengadaanItem; message: string }> {
    try {
      const response = await fetch(`${this.BASE_URL}/${id}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching pengadaan by ID:', error);
      throw error;
    }
  }

  /**
   * Create new pengadaan
   */
  static async createPengadaan(payload: CreatePengadaanPayload): Promise<{ data: PengadaanItem; message: string }> {
    try {
      const response = await fetch(this.BASE_URL, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating pengadaan:', error);
      throw error;
    }
  }

  /**
   * Update pengadaan
   */
  static async updatePengadaan(id: number, payload: Partial<CreatePengadaanPayload>): Promise<{ data: PengadaanItem; message: string }> {
    try {
      const response = await fetch(`${this.BASE_URL}/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating pengadaan:', error);
      throw error;
    }
  }

  /**
   * Delete pengadaan
   */
  static async deletePengadaan(id: number): Promise<{ message: string }> {
    try {
      const response = await fetch(`${this.BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting pengadaan:', error);
      throw error;
    }
  }

  // ==================== DROPDOWN DATA ====================

  /**
   * Get suppliers for dropdown
   */
  static async getSuppliers(): Promise<{ data: Supplier[]; message: string }> {
    try {
      const response = await fetch(`${this.BASE_URL}/suppliers`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      throw error;
    }
  }

  /**
   * Get barang mentah for dropdown
   */
  static async getBarangMentah(): Promise<{ data: BarangMentah[]; message: string }> {
    try {
      const response = await fetch(`${this.BASE_URL}/barang-mentah`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching barang mentah:', error);
      throw error;
    }
  }

  // ==================== 🎯 NEW TRACKING & HOOKS FEATURES ====================

  /**
   * 🆕 Get ketersediaan berat barang mentah
   */
  static async getKetersediaanBerat(id_barangmentah?: number): Promise<{ data: BeratTersedia[]; message: string }> {
    try {
      const param = id_barangmentah ? `?id_barangmentah=${id_barangmentah}` : '';
      const response = await fetch(`${this.BASE_URL}/ketersediaan-berat${param}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching ketersediaan berat:', error);
      throw error;
    }
  }

  /**
   * 🆕 Get detail ketersediaan dengan riwayat
   */
  static async getDetailKetersediaan(id_barangmentah: number): Promise<{ data: DetailKetersediaan; message: string }> {
    try {
      const response = await fetch(`${this.BASE_URL}/detail-ketersediaan/${id_barangmentah}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching detail ketersediaan:', error);
      throw error;
    }
  }

  /**
   * 🆕 Get prediksi kehabisan barang mentah
   */
  static async getPrediksiKehabisan(id_barangmentah: number): Promise<{ data: PrediksiKehabisan; message: string }> {
    try {
      const response = await fetch(`${this.BASE_URL}/prediksi-kehabisan/${id_barangmentah}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching prediksi kehabisan:', error);
      throw error;
    }
  }

  /**
   * 🆕 Get ringkasan ketersediaan untuk dashboard
   */
  static async getRingkasanKetersediaan(): Promise<{ data: RingkasanKetersediaan; message: string }> {
    try {
      const response = await fetch(`${this.BASE_URL}/ringkasan-ketersediaan`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching ringkasan ketersediaan:', error);
      throw error;
    }
  }

  /**
   * 🆕 Validasi ketersediaan berat untuk produksi
   */
  static async validateKetersediaanBerat(
    barangMentah: Array<{ id_barangmentah: number; berat_diminta: number }>
  ): Promise<{ data: ValidasiKetersediaan; message: string }> {
    try {
      const response = await fetch(`${this.BASE_URL}/validate-ketersediaan-berat`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ barang_mentah: barangMentah }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error validating ketersediaan berat:', error);
      throw error;
    }
  }

  // ==================== UTILITY FUNCTIONS ====================

  /**
   * Get status badge color for pengadaan
   */
  static getStatusBadgeColor(status: string): string {
    switch (status) {
      case 'selesai':
        return 'badge-outline-success';
      case 'proses':
        return 'badge-outline-info';
      case 'belum di bayar':
        return 'badge-outline-warning';
      case 'dibatalkan':
        return 'badge-outline-danger';
      default:
        return 'badge-outline-secondary';
    }
  }

  /**
   * Get ketersediaan status color
   */
  static getKetersediaanStatusColor(status: string): string {
    switch (status) {
      case 'aman':
        return 'badge-outline-success';
      case 'peringatan':
        return 'badge-outline-warning';
      case 'kritis':
        return 'badge-outline-danger';
      case 'habis':
        return 'badge-outline-dark';
      default:
        return 'badge-outline-secondary';
    }
  }

  /**
   * Format currency to Rupiah
   */
  static formatCurrency(amount: number): string {
    const cleanValue = amount % 1 === 0 ? Math.floor(amount) : amount;
    return `Rp ${cleanValue.toLocaleString('id-ID')}`;
  }

  /**
   * Format weight with unit
   */
  static formatWeight(weight: number): string {
    return `${weight.toLocaleString('id-ID')} kg`;
  }

  /**
   * Format date to Indonesian locale
   */
  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Get statistics for dashboard
   */
  static async getStatistics(): Promise<{ data: any; message: string }> {
    try {
      const response = await fetch(`${this.BASE_URL}/statistics`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  }
}

export default PengadaanBarangMentahService;