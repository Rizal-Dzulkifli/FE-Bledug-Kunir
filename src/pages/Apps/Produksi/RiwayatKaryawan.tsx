import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify-icon/react';
import { useAuth } from '../../../contexts/AuthContext';
import DataTable from 'datatables.net-dt';
import 'datatables.net-dt/css/dataTables.dataTables.css';

interface KontribusiSaya {
    berat_hasil: number;
    gaji_total: number;
    asset_digunakan: string;
}

interface Produk {
    nama: string;
    mode: 'existing_product' | 'new_product';
}

interface RiwayatProduksi {
    id_produksi: number;
    kode_produksi: string;
    status_produksi: string;
    tgl_produksi: string | null;
    tgl_tenggat: string;
    produk: Produk;
    kontribusi_saya: KontribusiSaya;
    total_hasil_produksi: number;
    stok_dihasilkan: number;
}

interface Statistics {
    periode: string;
    total_produksi_diikuti: number;
    total_berat_hasil: number;
    total_gaji_diperoleh: number;
    breakdown_status: Array<{
        status: string;
        jumlah: number;
    }>;
}

interface ApiResponse {
    message: string;
    data: {
        data: RiwayatProduksi[];
        meta: {
            total: number;
            current_page: number;
            per_page: number;
        };
    };
    statistics: Statistics;
}

const RiwayatProduksiKaryawan = () => {
    const { state } = useAuth();
    
    // Refs for DataTable
    const tableRef = useRef<HTMLTableElement>(null);
    const dataTableRef = useRef<any>(null);
    
    const [riwayatList, setRiwayatList] = useState<RiwayatProduksi[]>([]);
    const [statistics, setStatistics] = useState<Statistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [bulanFilter, setBulanFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Destroy DataTable helper
    const destroyDataTable = () => {
        if (dataTableRef.current) {
            try {
                dataTableRef.current.destroy();
                dataTableRef.current = null;
            } catch (error) {
                console.log('DataTable cleanup:', error);
            }
        }
    };

    useEffect(() => {
        fetchRiwayatProduksi();
    }, [bulanFilter, statusFilter]);

    // Initialize DataTable
    useEffect(() => {
        if (!loading && tableRef.current) {
            setTimeout(() => {
                if (tableRef.current && !dataTableRef.current) {
                    try {
                        dataTableRef.current = new DataTable(tableRef.current, {
                            pageLength: 10,
                            lengthMenu: [10, 25],
                            deferRender: true,
                            stateSave: false,
                            searching: true,
                            ordering: true,
                            info: true,
                            paging: true,
                            autoWidth: false,
                            retrieve: true,
                            destroy: true,
                            order: [[0, 'desc']],
                            language: {
                                lengthMenu: '_MENU_',
                                search: '',
                                searchPlaceholder: 'Cari...',
                                info: 'Menampilkan _START_ sampai _END_ dari _TOTAL_ data',
                                infoEmpty: 'Menampilkan 0 sampai 0 dari 0 data',
                                infoFiltered: '(difilter dari _MAX_ total data)',
                                paginate: {
                                    first: 'Pertama',
                                    last: 'Terakhir',
                                    next: 'Selanjutnya',
                                    previous: 'Sebelumnya'
                                },
                                zeroRecords: 'Data tidak ditemukan'
                            }
                        });
                    } catch (error) {
                        console.error('DataTable initialization error:', error);
                    }
                }
            }, 150);
        }

        return () => {
            destroyDataTable();
        };
    }, [loading, riwayatList]);

    const fetchRiwayatProduksi = async () => {
        try {
            destroyDataTable();
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');
            
            if (!token) {
                setError('Token tidak ditemukan, silakan login kembali');
                return;
            }

            const params = new URLSearchParams();
            params.append('page', '1');
            params.append('limit', '1000');
            if (bulanFilter) params.append('bulan', bulanFilter);
            if (statusFilter) params.append('status', statusFilter);

            const response = await fetch(`http://localhost:3333/api/karyawan/produksi/riwayat?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    setError('Sesi telah berakhir, silakan login kembali');
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result: ApiResponse = await response.json();
            setRiwayatList(result.data.data);
            setStatistics(result.statistics);
        } catch (error) {
            console.error('Error fetching riwayat produksi:', error);
            setError('Gagal memuat riwayat produksi. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Belum dimulai';
        return new Date(dateString).toLocaleDateString('id-ID');
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'selesai':
                return 'text-success bg-success/20';
            case 'sedang produksi':
                return 'text-info bg-info/20';
            case 'belum produksi':
                return 'text-warning bg-warning/20';
            case 'telat produksi':
                return 'text-danger bg-danger/20';
            default:
                return 'text-gray-500 bg-gray-200';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'selesai':
                return 'Selesai';
            case 'sedang produksi':
                return 'Sedang Produksi';
            case 'belum produksi':
                return 'Belum Dimulai';
            case 'telat produksi':
                return 'Terlambat';
            default:
                return status;
        }
    };

    const getCurrentMonth = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Icon icon="eos-icons:loading" width="3rem" height="3rem" className="animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading riwayat produksi...</p>
                </div>
            </div>
        );
    }

  

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-primary text-white-light w-12 h-12 rounded-md flex items-center justify-center">
                        <Icon icon="solar:history-bold-duotone" width="24" height="24" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Riwayat Produksi</h1>
                        <p className="text-gray-600">Selamat datang, {state.user?.nama} - Riwayat produksi yang pernah Anda ikuti</p>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            {statistics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100">Total Produksi</p>
                                <p className="text-2xl font-bold">{statistics.total_produksi_diikuti}</p>
                            </div>
                            <Icon icon="solar:widget-2-bold-duotone" width="2.5rem" height="2.5rem" className="text-blue-200" />
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100">Total Berat Hasil</p>
                                <p className="text-2xl font-bold">{statistics.total_berat_hasil}kg</p>
                            </div>
                            <Icon icon="solar:scale-bold-duotone" width="2.5rem" height="2.5rem" className="text-green-200" />
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-6 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-yellow-100">Total Gaji</p>
                                <p className="text-2xl font-bold">{formatCurrency(statistics.total_gaji_diperoleh)}</p>
                            </div>
                            <Icon icon="solar:wallet-money-bold-duotone" width="2.5rem" height="2.5rem" className="text-yellow-200" />
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100">Periode</p>
                                <p className="text-2xl font-bold">{statistics.periode}</p>
                            </div>
                            <Icon icon="solar:calendar-bold-duotone" width="2.5rem" height="2.5rem" className="text-purple-200" />
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Filter Bulan
                    </label>
                    <input
                        type="month"
                        value={bulanFilter}
                        onChange={(e) => setBulanFilter(e.target.value)}
                        className="form-input"
                        max={getCurrentMonth()}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Filter Status
                    </label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="form-select"
                    >
                        <option value="">Semua Status</option>
                        <option value="selesai">Selesai</option>
                        <option value="sedang produksi">Sedang Produksi</option>
                        <option value="belum produksi">Belum Dimulai</option>
                        <option value="telat produksi">Terlambat</option>
                    </select>
                </div>
            </div>

            {/* Riwayat Table */}
            <div className="panel p-5 border-0">
                {loading ? (
                    <div className="text-center py-4">
                        <Icon icon="eos-icons:loading" width="2rem" className="text-primary mx-auto" />
                        <p className="mt-2 text-gray-500">Memuat data...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <div className="datatables">
                            <table ref={tableRef} id="riwayatTable" className="table-striped table-hover" style={{width:'100%'}}>
                            <thead>
                                <tr>
                                    <th>Kode Produksi</th>
                                    <th>Produk</th>
                                    <th>Tanggal</th>
                                    <th>Status</th>
                                    <th>Kontribusi Saya</th>
                                    <th>Total Hasil</th>
                                    <th>Gaji</th>
                                </tr>
                            </thead>
                            <tbody>
                                {riwayatList.map((riwayat) => (
                                <tr key={riwayat.id_produksi}>
                                    <td>
                                        <div className="font-semibold text-primary">{riwayat.kode_produksi}</div>
                                    </td>
                                    <td>
                                        <div>
                                            <div className="font-semibold">{riwayat.produk.nama}</div>
                                            <div className="text-xs text-gray-500">
                                                {riwayat.produk.mode === 'new_product' ? 'Produk Baru' : 'Produk Existing'}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div>
                                            <div className="text-sm">{formatDate(riwayat.tgl_produksi)}</div>
                                            <div className="text-xs text-gray-500">s/d {formatDate(riwayat.tgl_tenggat)}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(riwayat.status_produksi)}`}>
                                            {getStatusText(riwayat.status_produksi)}
                                        </span>
                                    </td>
                                    <td>
                                        <div>
                                            <div className="font-semibold">{riwayat.kontribusi_saya.berat_hasil}kg</div>
                                            <div className="text-xs text-gray-500">{riwayat.kontribusi_saya.asset_digunakan}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div>
                                            <div className="font-semibold">{riwayat.total_hasil_produksi}kg</div>
                                            <div className="text-xs text-gray-500">{riwayat.stok_dihasilkan} unit</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="font-semibold text-success">
                                            {formatCurrency(riwayat.kontribusi_saya.gaji_total)}
                                        </div>
                                    </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RiwayatProduksiKaryawan;