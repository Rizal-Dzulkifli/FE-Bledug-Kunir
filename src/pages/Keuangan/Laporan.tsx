import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { KeuanganEksternalService, LaporanKeuangan } from '../../services/KeuanganEksternalService';
import IconDownload from '../../components/Icon/IconDownload';
import IconSearch from '../../components/Icon/IconSearch';
import IconCalendar from '../../components/Icon/IconCalendar';

const KeuanganLaporan = () => {
    const { year, month } = useParams<{ year: string; month: string }>();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<LaporanKeuangan | null>(null);
    
    // Initialize filters based on URL params or default values
    const getInitialFilters = () => {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1; // 1-12
        
        if (year && month) {
            return {
                month: parseInt(month),
                year: parseInt(year),
                status: '',
                kategori: '',
            };
        }
        
        return {
            month: currentMonth,
            year: currentYear,
            status: '',
            kategori: '',
        };
    };
    
    const [filters, setFilters] = useState(getInitialFilters());

    // Get start and end date from selected month and year
    const getDateRange = () => {
        // Gunakan UTC untuk menghindari masalah timezone
        const year = filters.year;
        const month = filters.month;
        
        // Format: YYYY-MM-DD
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        
        // Hitung hari terakhir bulan
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        
        return { startDate, endDate };
    };

    // Fetch report data
    const fetchLaporan = async () => {
        try {
            setLoading(true);
            
            const { startDate, endDate } = getDateRange();
            
            const params = {
                start_date: startDate,
                end_date: endDate,
                ...(filters.status && { status: filters.status }),
                ...(filters.kategori && { kategori: filters.kategori }),
            };

            const response = await KeuanganEksternalService.getLaporan(params);
            
            if (response) {
                setData(response);
            }
        } catch (error) {
            console.error('Error fetching report:', error);
            Swal.fire('Error', 'Gagal memuat laporan', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handle filter changes
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchLaporan();
    };

    // Export to Excel (placeholder - would need backend implementation)
    const handleExport = async () => {
        try {
            Swal.fire('Info', 'Fitur export sedang dalam pengembangan', 'info');
        } catch (error) {
            console.error('Error exporting report:', error);
            Swal.fire('Error', 'Gagal mengexport laporan', 'error');
        }
    };

    // Format currency with validation
    const formatCurrency = (amount: number | undefined | null) => {
        // Validate and convert to number
        const validAmount = Number(amount) || 0;
        
        // Check if it's a valid number
        if (isNaN(validAmount)) {
            console.warn('Invalid amount for currency formatting:', amount);
            return 'Rp 0';
        }
        
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(validAmount);
    };

    // Format date - handle timezone issue
    const formatDate = (dateString: string) => {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    // Get status badge
    const getStatusBadge = (status: string) => {
        return status === 'masuk' 
            ? <span className="badge bg-success text-white text-xs">{status.toUpperCase()}</span>
            : <span className="badge bg-danger text-white text-xs">{status.toUpperCase()}</span>;
    };

    // Get kategori badge
    const getKategoriBadge = (kategori: string) => {
        const colors = {
            operasional: 'bg-info',
            investasi: 'bg-warning',
            penjualan: 'bg-success',
            pembelian: 'bg-primary',
            lainnya: 'bg-secondary',
        };
        
        return <span className={`badge ${colors[kategori as keyof typeof colors]} text-white text-xs`}>
            {kategori.toUpperCase()}
        </span>;
    };

    useEffect(() => {
        fetchLaporan();
    }, []);

    // Get month name in Indonesian
    const getMonthName = (month: number): string => {
        const months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        return months[month - 1];
    };

    // Get period title
    const getPeriodTitle = () => {
        return `${getMonthName(filters.month)} ${filters.year}`;
    };

    return (
        <div className="space-y-6">
            {/* Breadcrumb & Header */}
            <div className="flex flex-col gap-2">
                {year && month && (
                    <nav className="flex" aria-label="Breadcrumb">
                        <ol className="inline-flex items-center space-x-1 md:space-x-3">
                            <li className="inline-flex items-center">
                                <Link to="/keuangan/laporan" className="text-primary hover:text-primary-dark">
                                    Laporan Bulanan
                                </Link>
                            </li>
                            <li>
                                <div className="flex items-center">
                                    <span className="text-gray-500 mx-2">/</span>
                                    <span className="text-gray-600 dark:text-gray-400">
                                        {getPeriodTitle()}
                                    </span>
                                </div>
                            </li>
                        </ol>
                    </nav>
                )}
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold dark:text-white-light flex items-center gap-2">
                        <IconCalendar className="w-6 h-6" />
                        Laporan Keuangan - {getPeriodTitle()}
                    </h2>
                    {year && month && (
                        <Link 
                            to="/keuangan/laporan" 
                            className="btn btn-outline-primary gap-2"
                        >
                            ← Kembali ke Daftar Bulan
                        </Link>
                    )}
                </div>
            </div>

            {/* Filter Panel */}
            <div className="panel">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Bulan</label>
                            <select
                                name="month"
                                value={filters.month}
                                onChange={handleFilterChange}
                                className="form-select"
                                required
                            >
                                <option value="1">Januari</option>
                                <option value="2">Februari</option>
                                <option value="3">Maret</option>
                                <option value="4">April</option>
                                <option value="5">Mei</option>
                                <option value="6">Juni</option>
                                <option value="7">Juli</option>
                                <option value="8">Agustus</option>
                                <option value="9">September</option>
                                <option value="10">Oktober</option>
                                <option value="11">November</option>
                                <option value="12">Desember</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Tahun</label>
                            <select
                                name="year"
                                value={filters.year}
                                onChange={handleFilterChange}
                                className="form-select"
                                required
                            >
                                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Status</label>
                            <select
                                name="status"
                                value={filters.status}
                                onChange={handleFilterChange}
                                className="form-select"
                            >
                                <option value="">Semua Status</option>
                                <option value="masuk">Masuk</option>
                                <option value="keluar">Keluar</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Kategori</label>
                            <select
                                name="kategori"
                                value={filters.kategori}
                                onChange={handleFilterChange}
                                className="form-select"
                            >
                                <option value="">Semua Kategori</option>
                                <option value="operasional">Operasional</option>
                                <option value="investasi">Investasi</option>
                                <option value="penjualan">Penjualan</option>
                                <option value="pembelian">Pembelian</option>
                                <option value="lainnya">Lainnya</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary gap-2"
                        >
                            <IconSearch className="w-4 h-4" />
                            {loading ? 'Memuat...' : 'Tampilkan Laporan'}
                        </button>
                        
                        {data && (
                            <button
                                type="button"
                                onClick={handleExport}
                                className="btn btn-success gap-2"
                            >
                                <IconDownload className="w-4 h-4" />
                                Export Excel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Report Content */}
            {loading ? (
                <div className="panel">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                </div>
            ) : data ? (
                <div className="space-y-6">
                    {/* Summary */}
                    <div className="panel">
                        <div className="flex items-center justify-between mb-5">
                            <h5 className="font-semibold text-lg dark:text-white-light">
                                Ringkasan Periode {formatDate(data.periode.start_date)} - {formatDate(data.periode.end_date)}
                            </h5>
                            <IconCalendar className="w-5 h-5 text-primary" />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900 dark:to-green-800 p-4 rounded-lg">
                                <div className="text-success font-semibold">Total Pemasukan</div>
                                <div className="text-2xl font-bold text-success">
                                    {formatCurrency(data.summary?.total_masuk)}
                                </div>
                            </div>
                            
                            <div className="bg-gradient-to-r from-red-100 to-red-50 dark:from-red-900 dark:to-red-800 p-4 rounded-lg">
                                <div className="text-danger font-semibold">Total Pengeluaran</div>
                                <div className="text-2xl font-bold text-danger">
                                    {formatCurrency(data.summary?.total_keluar)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Category Breakdown */}
                    <div className="panel p-5 border-0">
                        <h5 className="font-semibold text-lg dark:text-white-light mb-5">
                            Rincian per Kategori
                        </h5>
                        
                        <div className="overflow-x-auto">
                            <div className="datatables">
                                <table className="table-striped table-hover" style={{width:'100%'}}>
                                    <thead>
                                        <tr>
                                            <th>No</th>
                                            <th>Kategori</th>
                                            <th>Pemasukan</th>
                                            <th>Pengeluaran</th>
                                            <th>Selisih</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {data.kategori_summary && Object.entries(data.kategori_summary).map(([kategori, summary], index) => {
                                        const masuk = Number(summary?.masuk) || 0;
                                        const keluar = Number(summary?.keluar) || 0;
                                        const selisih = masuk - keluar;
                                        return (
                                            <tr key={kategori}>
                                                <td>{index + 1}</td>
                                                <td>
                                                    {getKategoriBadge(kategori)}
                                                </td>
                                                <td>
                                                    <span className="text-success font-semibold">
                                                        {formatCurrency(masuk)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="text-danger font-semibold">
                                                        {formatCurrency(keluar)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`font-semibold ${selisih >= 0 ? 'text-success' : 'text-danger'}`}>
                                                        {formatCurrency(selisih)}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Transaction Details */}
                    <div className="panel p-5 border-0">
                        <h5 className="font-semibold text-lg dark:text-white-light mb-5">
                            Detail Transaksi
                        </h5>
                        
                        <div className="overflow-x-auto">
                            <div className="datatables">
                                <table className="table-striped table-hover" style={{width:'100%'}}>
                                    <thead>
                                        <tr>
                                            <th>No</th>
                                            <th>Tanggal</th>
                                            <th>Deskripsi</th>
                                            <th>Kategori</th>
                                            <th>Status</th>
                                            <th>Biaya</th>
                                            <th>Referensi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {!data.transaksi || data.transaksi.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="text-center py-8">
                                                    <p className="text-gray-500">Tidak ada transaksi dalam periode ini</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            data.transaksi.map((transaksi, index) => (
                                                <tr key={transaksi.keuangan_id}>
                                                    <td>{index + 1}</td>
                                                    <td>{formatDate(transaksi.tanggal)}</td>
                                                    <td>
                                                        <div className="max-w-xs">
                                                            {transaksi.deskripsi || '-'}
                                                        </div>
                                                    </td>
                                                    <td>{getKategoriBadge(transaksi.kategori || 'lainnya')}</td>
                                                    <td>{getStatusBadge(transaksi.status || 'keluar')}</td>
                                                    <td>
                                                        <span className={`font-semibold ${transaksi.status === 'masuk' ? 'text-success' : 'text-danger'}`}>
                                                            {formatCurrency(transaksi.biaya)}
                                                        </span>
                                                    </td>
                                                    <td>{transaksi.referensi || '-'}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="panel">
                    <div className="text-center py-12">
                        <p className="text-gray-500 mb-4">Silakan tentukan periode laporan dan klik "Tampilkan Laporan"</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KeuanganLaporan;