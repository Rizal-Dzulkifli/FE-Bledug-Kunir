import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import IconSearch from '../../components/Icon/IconSearch';
import IconRefresh from '../../components/Icon/IconRefresh';
import IconInfoCircle from '../../components/Icon/IconInfoCircle';
import IconEye from '../../components/Icon/IconEye';
import { KeuanganEksternalService, TransaksiTerpadu } from '../../services/KeuanganEksternalService';
import DataTable from 'datatables.net-dt';
import 'datatables.net-dt/css/dataTables.dataTables.css';

const TransaksiTerpaduPage: React.FC = () => {
    const tableRef = useRef<HTMLTableElement>(null);
    const dataTableRef = useRef<any>(null);
    
    const [data, setData] = useState<TransaksiTerpadu[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 15,
        total: 0,
        last_page: 1
    });
    
    // Filter states
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<string>('');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    
    // Summary data
    const [summary, setSummary] = useState({
        total_pemasukan: 0,
        total_pengeluaran: 0,
        total_keuangan: 0,
        total_pemeliharaan: 0,
        total_pengadaan: 0,
        total_penggajian: 0,
        total_penjualan: 0
    });

    // Helper function to safely destroy DataTable
    const destroyDataTable = () => {
        if (dataTableRef.current) {
            try {
                dataTableRef.current.destroy();
                dataTableRef.current = null;
            } catch (e) {
                console.log('Error destroying DataTable:', e);
            }
        }
    };

    const fetchData = async (page: number = 1) => {
        try {
            setLoading(true);
            
            // Destroy DataTable before updating state
            destroyDataTable();
            const params = {
                page,
                limit: pagination.per_page,
                search: search || undefined,
                status: status || undefined,
                startDate: startDate?.toISOString().split('T')[0],
                endDate: endDate?.toISOString().split('T')[0],
            };

            const response = await KeuanganEksternalService.getTransaksiTerpadu(params);
            
            setData(response.data);
            setPagination({
                current_page: response.meta.current_page,
                per_page: response.meta.per_page,
                total: response.meta.total,
                last_page: response.meta.last_page
            });

            // Gunakan summary dari backend (total keseluruhan, bukan hanya halaman ini)
            if (response.summary) {
                setSummary({
                    total_pemasukan: response.summary.total_pemasukan || 0,
                    total_pengeluaran: response.summary.total_pengeluaran || 0,
                    total_keuangan: response.summary.total_keuangan || 0,
                    total_pemeliharaan: response.summary.total_pemeliharaan || 0,
                    total_pengadaan: response.summary.total_pengadaan || 0,
                    total_penggajian: response.summary.total_penggajian || 0,
                    total_penjualan: response.summary.total_penjualan || 0
                });
            } else {
                // Fallback jika summary tidak ada (hitung dari data halaman ini saja)
                const totalPemasukan = response.data
                    .filter(item => item.status === 'masuk')
                    .reduce((sum, item) => sum + item.biaya, 0);
                
                const totalPengeluaran = response.data
                    .filter(item => item.status === 'keluar')
                    .reduce((sum, item) => sum + item.biaya, 0);

                setSummary({
                    total_pemasukan: totalPemasukan,
                    total_pengeluaran: totalPengeluaran,
                    total_keuangan: response.data.filter(item => item.jenis_transaksi === 'keuangan').length,
                    total_pemeliharaan: response.data.filter(item => item.jenis_transaksi === 'pemeliharaan').length,
                    total_pengadaan: response.data.filter(item => item.jenis_transaksi === 'pengadaan').length,
                    total_penggajian: response.data.filter(item => item.jenis_transaksi === 'penggajian').length,
                    total_penjualan: response.data.filter(item => item.jenis_transaksi === 'penjualan').length
                });
            }

        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: error instanceof Error ? error.message : 'Gagal memuat data transaksi',
                icon: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Initialize DataTable
    useEffect(() => {
        if (loading) return;

        destroyDataTable();

        const timer = setTimeout(() => {
            if (tableRef.current && !dataTableRef.current && data.length > 0) {
                try {
                    dataTableRef.current = new DataTable(tableRef.current, {
                        searching: false,
                        ordering: true,
                        paging: false,
                        info: false,
                        autoWidth: false,
                        retrieve: true,
                        destroy: true,
                        deferRender: true,
                        stateSave: false,
                        order: [[1, 'desc']], // Sort by Tanggal descending
                        language: {
                            lengthMenu: 'Tampilkan _MENU_ data per halaman',
                            zeroRecords: 'Data tidak ditemukan',
                            info: 'Menampilkan halaman _PAGE_ dari _PAGES_',
                            infoEmpty: 'Tidak ada data',
                            infoFiltered: '(difilter dari _MAX_ total data)',
                            paginate: {
                                first: '<iconify-icon icon="mdi:chevron-double-left" style="font-size: 1.25rem;"></iconify-icon>',
                                last: '<iconify-icon icon="mdi:chevron-double-right" style="font-size: 1.25rem;"></iconify-icon>',
                                next: '<iconify-icon icon="mdi:chevron-right" style="font-size: 1.25rem;"></iconify-icon>',
                                previous: '<iconify-icon icon="mdi:chevron-left" style="font-size: 1.25rem;"></iconify-icon>',
                            },
                            emptyTable: 'Tidak ada data tersedia'
                        },
                        dom: 'rt',
                        columnDefs: [
                            {
                                targets: 0, // No column
                                orderable: false,
                            },
                        ],
                    });
                } catch (error) {
                    console.error('Error initializing DataTable:', error);
                }
            }
        }, 150);

        return () => clearTimeout(timer);
    }, [data, loading]);

    // Search is handled server-side via fetchData, no client-side search needed

    const handleSearch = () => {
        setPagination(prev => ({ ...prev, current_page: 1 }));
        fetchData(1);
    };

    const handleReset = () => {
        setSearch('');
        setStatus('');
        setStartDate(null);
        setEndDate(null);
        setPagination(prev => ({ ...prev, current_page: 1 }));
        fetchData(1);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getJenisTransaksiBadge = (jenis: string) => {
        const colors: { [key: string]: string } = {
            'keuangan': 'bg-blue-100 text-blue-800',
            'pemeliharaan': 'bg-orange-100 text-orange-800',
            'pengadaan': 'bg-green-100 text-green-800',
            'penggajian': 'bg-purple-100 text-purple-800',
            'penjualan': 'bg-emerald-100 text-emerald-800'
        };
        return <span className={`badge ${colors[jenis] || 'bg-gray-100 text-gray-800'}`}>{jenis.toUpperCase()}</span>;
    };

    const getStatusBadge = (status: string) => {
        return (
            <span className={`badge ${status === 'masuk' ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                {status.toUpperCase()}
            </span>
        );
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">
                Transaksi Terpadu - Semua Aktivitas Keuangan
            </h2>

            <div className="panel border-l-4 border-blue-500 bg-blue-50 p-4 mb-6">
                <div className="flex items-center mb-2">
                    <IconInfoCircle className="w-4 h-4 mr-2 text-blue-500" />
                    <h4 className="text-blue-800 font-semibold">Informasi</h4>
                </div>
                <p className="text-blue-700">
                    Halaman ini menampilkan semua transaksi keuangan terintegrasi dari berbagai modul otomatisasi sistem: 
                    <strong>Biaya Pemeliharaan</strong>, 
                    <strong>Pengadaan Bahan Mentah</strong>, <strong>Penggajian Produksi</strong>, 
                    <strong>Penggajian Driver</strong>, dan <strong>Penjualan Pesanan</strong>.
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                {/* <div className="panel border">
                    <div className="text-xs text-gray-500 uppercase font-bold mb-2">
                        Total Pemasukan
                    </div>
                    <div className="text-lg font-bold text-green-600">
                        {formatCurrency(summary.total_pemasukan)}
                    </div>
                </div>
                <div className="panel border">
                    <div className="text-xs text-gray-500 uppercase font-bold mb-2">
                        Total Pengeluaran
                    </div>
                    <div className="text-lg font-bold text-red-600">
                        {formatCurrency(summary.total_pengeluaran)}
                    </div>
                </div> */}
                <div className="panel border">
                    <div className="text-xs text-gray-500 uppercase font-bold mb-2">
                        Keuangan
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                        {summary.total_keuangan} transaksi
                    </div>
                </div>
                <div className="panel border">
                    <div className="text-xs text-gray-500 uppercase font-bold mb-2">
                        Pemeliharaan
                    </div>
                    <div className="text-lg font-bold text-orange-600">
                        {summary.total_pemeliharaan} transaksi
                    </div>
                </div>
                <div className="panel border">
                    <div className="text-xs text-gray-500 uppercase font-bold mb-2">
                        Pengadaan
                    </div>
                    <div className="text-lg font-bold text-green-600">
                        {summary.total_pengadaan} transaksi
                    </div>
                </div>
                <div className="panel border">
                    <div className="text-xs text-gray-500 uppercase font-bold mb-2">
                        Penggajian
                    </div>
                    <div className="text-lg font-bold text-purple-600">
                        {summary.total_penggajian} transaksi
                    </div>
                </div>
                <div className="panel border">
                    <div className="text-xs text-gray-500 uppercase font-bold mb-2">
                        Penjualan
                    </div>
                    <div className="text-lg font-bold text-emerald-600">
                        {summary.total_penjualan} transaksi
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            <div className="panel border mb-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-3">
                        <div className="relative">
                            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                className="form-input pl-10"
                                placeholder="Cari deskripsi..."
                                value={search}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <select
                            className="form-select"
                            value={status}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value)}
                        >
                            <option value="">Semua Status</option>
                            <option value="masuk">Pemasukan</option>
                            <option value="keluar">Pengeluaran</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <input
                            type="date"
                            className="form-input"
                            placeholder="Tanggal Mulai"
                            value={startDate ? startDate.toISOString().split('T')[0] : ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <input
                            type="date"
                            className="form-input"
                            placeholder="Tanggal Akhir"
                            value={endDate ? endDate.toISOString().split('T')[0] : ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                    <div className="md:col-span-3">
                        <div className="flex gap-2">
                            <button className="btn btn-primary flex items-center gap-2" onClick={handleSearch}>
                                <IconSearch className="w-4 h-4" />
                                Cari
                            </button>
                            <button className="btn btn-outline-primary flex items-center gap-2" onClick={handleReset}>
                                <IconRefresh className="w-4 h-4" />
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="mt-5 panel p-5 border-0">
                <div className="overflow-x-auto">
                    <div className="datatables">
                        <table ref={tableRef} id="transaksiTerpaduTable" className="table-striped table-hover" style={{width:'100%'}}>
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Tanggal</th>
                                    <th>Jenis</th>
                                    <th>Deskripsi</th>
                                    <th className="text-right">Jumlah</th>
                                    <th>Status</th>
                                    <th>Kategori</th>
                                    {/* <th className="text-center">Detail</th> */}
                                </tr>
                            </thead>
                            <tbody>
                                {loading && !searchLoading ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8">
                                            <div className="flex justify-center items-center">
                                                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                                                Memuat data...
                                            </div>
                                        </td>
                                    </tr>
                                ) : data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8 text-gray-500">
                                            Tidak ada data transaksi
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((record: TransaksiTerpadu, index: number) => (
                                        <tr key={record.id || index}>
                                            <td>{((pagination.current_page - 1) * pagination.per_page) + index + 1}</td>
                                            <td className="whitespace-nowrap">
                                                {new Date(record.tanggal).toLocaleDateString('id-ID')}
                                            </td>
                                            <td>
                                                {getJenisTransaksiBadge(record.jenis_transaksi)}
                                            </td>
                                            <td>
                                                <div>
                                                    <div className="text-sm font-medium">{record.deskripsi}</div>
                                                    <div className="text-xs text-gray-500">{record.asal_modul}</div>
                                                </div>
                                            </td>
                                            <td className="text-right">
                                                <span className={`font-semibold ${record.status === 'masuk' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {formatCurrency(record.biaya)}
                                                </span>
                                            </td>
                                            <td>
                                                {getStatusBadge(record.status)}
                                            </td>
                                            <td>
                                                <span className="badge bg-gray-100 text-gray-800 border border-gray-300">
                                                    {record.kategori}
                                                </span>
                                            </td>
                                            {/* <td className="text-center">
                                                <button 
                                                    className="btn btn-sm btn-outline-primary" 
                                                    title="Lihat Detail"
                                                >
                                                    <IconEye className="w-4 h-4" />
                                                </button>
                                            </td> */}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Custom Server-Side Pagination */}
                <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-600">
                        Menampilkan {data.length > 0 ? ((pagination.current_page - 1) * pagination.per_page) + 1 : 0} - {Math.min(pagination.current_page * pagination.per_page, pagination.total)} dari {pagination.total} data
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => fetchData(1)}
                            disabled={pagination.current_page === 1 || loading}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => fetchData(pagination.current_page - 1)}
                            disabled={pagination.current_page === 1 || loading}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <span className="flex items-center px-3">
                            Halaman {pagination.current_page} dari {pagination.last_page}
                        </span>
                        <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => fetchData(pagination.current_page + 1)}
                            disabled={pagination.current_page === pagination.last_page || loading}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => fetchData(pagination.last_page)}
                            disabled={pagination.current_page === pagination.last_page || loading}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransaksiTerpaduPage;