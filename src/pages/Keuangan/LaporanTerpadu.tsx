import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { KeuanganEksternalService, LaporanTerpadu } from '../../services/KeuanganEksternalService';
import IconSearch from '../../components/Icon/IconSearch';
import IconCalendar from '../../components/Icon/IconCalendar';
import IconTrendingUp from '../../components/Icon/IconTrendingUp';

const KeuanganLaporanTerpadu = () => {
    const { year, month } = useParams<{ year: string; month: string }>();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<LaporanTerpadu | null>(null);
    
    // Initialize filters based on URL params or default values
    const getInitialFilters = () => {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1; // 1-12
        
        if (year && month) {
            return {
                month: parseInt(month),
                year: parseInt(year),
            };
        }
        
        return {
            month: currentMonth,
            year: currentYear,
        };
    };
    
    const [filters, setFilters] = useState(getInitialFilters());

    // Get start and end date from selected month and year
    const getDateRange = () => {
        const year = filters.year;
        const month = filters.month;
        
        // Format: YYYY-MM-DD
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        
        // Hitung hari terakhir bulan
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        
        return { startDate, endDate };
    };

    // Fetch integrated report data
    const fetchLaporanTerpadu = async () => {
        try {
            setLoading(true);
            
            const { startDate, endDate } = getDateRange();
            
            const params = {
                start_date: startDate,
                end_date: endDate,
            };

            const response = await KeuanganEksternalService.getLaporanTerpadu(params);
            
            if (response) {
                console.log('📊 [Laporan Terpadu] Response data:', response);
                console.log('📊 [Laporan Terpadu] Penggajian Produksi:', response.penggajian_produksi);
                
                if (response.penggajian_produksi) {
                    console.log('✅ Penggajian Produksi exists:');
                    console.log('   - Total Gaji:', response.penggajian_produksi.total_gaji);
                    console.log('   - Jumlah Produksi:', response.penggajian_produksi.jumlah_produksi);
                    console.log('   - Jumlah Karyawan:', response.penggajian_produksi.jumlah_karyawan);
                    console.log('   - Produksi data:', response.penggajian_produksi.produksi);
                } else {
                    console.warn('⚠️ Penggajian Produksi TIDAK ADA dalam response!');
                }
                
                setData(response);
            }
        } catch (error) {
            console.error('Error fetching integrated report:', error);
            Swal.fire('Error', 'Gagal memuat laporan terpadu', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handle filter changes
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: parseInt(value)
        }));
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchLaporanTerpadu();
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Format date - handle timezone issue
    const formatDate = (dateString: string) => {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    // Calculate totals
    const calculateGrandTotal = () => {
        if (!data) return { total_masuk: 0, total_keluar: 0 };

        // Pastikan konversi ke number dengan parseFloat untuk menghindari string concatenation
        const keuangan_masuk = parseFloat(String(data.keuangan_eksternal.total_masuk || 0));
        const penjualan_masuk = parseFloat(String(data.penjualan?.total_penjualan || 0));
        const keuangan_keluar = parseFloat(String(data.keuangan_eksternal.total_keluar || 0));
        const pengadaan_keluar = parseFloat(String(data.pengadaan_bahan.total_biaya || 0));
        const pemeliharaan_keluar = parseFloat(String(data.pemeliharaan.total_biaya || 0));
        const penggajian_produksi_keluar = parseFloat(String(data.penggajian_produksi?.total_gaji || 0));
        const penggajian_driver_keluar = parseFloat(String(data.penggajian_driver?.total_gaji || 0));

        console.log('💰 [Grand Total Calculation]:');
        console.log('   - Keuangan Masuk:', keuangan_masuk, typeof keuangan_masuk);
        console.log('   - Penjualan Masuk:', penjualan_masuk, typeof penjualan_masuk);
        console.log('   - Keuangan Keluar:', keuangan_keluar, typeof keuangan_keluar);
        console.log('   - Pengadaan Keluar:', pengadaan_keluar, typeof pengadaan_keluar);
        console.log('   - Pemeliharaan Keluar:', pemeliharaan_keluar, typeof pemeliharaan_keluar);
        console.log('   - Penggajian Produksi Keluar:', penggajian_produksi_keluar, typeof penggajian_produksi_keluar);
        console.log('   - Penggajian Driver Keluar:', penggajian_driver_keluar, typeof penggajian_driver_keluar);

        const total_masuk = keuangan_masuk + penjualan_masuk;
        const total_keluar = keuangan_keluar + pengadaan_keluar + pemeliharaan_keluar + penggajian_produksi_keluar + penggajian_driver_keluar;

        console.log('   - TOTAL MASUK:', total_masuk);
        console.log('   - TOTAL KELUAR:', total_keluar);

        return { total_masuk, total_keluar };
    };

    useEffect(() => {
        fetchLaporanTerpadu();
    }, []);

    const grandTotal = calculateGrandTotal();

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
                                <Link to="/keuangan/laporan-terpadu" className="text-primary hover:text-primary-dark">
                                    Laporan Bulanan Terpadu
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
                        <IconTrendingUp className="w-6 h-6" />
                        Laporan Terpadu - {getPeriodTitle()}
                    </h2>
                    {year && month && (
                        <Link 
                            to="/keuangan/laporan-terpadu" 
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

                        <div className="flex items-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary gap-2 w-full"
                            >
                                <IconSearch className="w-4 h-4" />
                                {loading ? 'Memuat...' : 'Tampilkan Laporan'}
                            </button>
                        </div>
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
                    {/* Executive Summary */}
                    <div className="panel">
                        <div className="flex items-center justify-between mb-5">
                            <h5 className="font-semibold text-lg dark:text-white-light">
                                Ringkasan Eksekutif - Periode {formatDate(data.periode.start_date)} s.d {formatDate(data.periode.end_date)}
                            </h5>
                            <IconTrendingUp className="w-5 h-5 text-primary" />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900 dark:to-green-800 p-6 rounded-lg">
                                <div className="text-success font-semibold text-lg">Total Pemasukan</div>
                                <div className="text-3xl font-bold text-success">
                                    {formatCurrency(grandTotal.total_masuk)}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                                    <div>• Keuangan Eksternal: {formatCurrency(data.keuangan_eksternal.total_masuk)}</div>
                                    <div>• Penjualan: {formatCurrency(data.penjualan?.total_penjualan || 0)}</div>
                                </div>
                            </div>
                            
                            <div className="bg-gradient-to-r from-red-100 to-red-50 dark:from-red-900 dark:to-red-800 p-6 rounded-lg">
                                <div className="text-danger font-semibold text-lg">Total Pengeluaran</div>
                                <div className="text-3xl font-bold text-danger">
                                    {formatCurrency(grandTotal.total_keluar)}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                                    <div>• Keuangan: {formatCurrency(data.keuangan_eksternal.total_keluar)}</div>
                                    <div>• Pengadaan: {formatCurrency(data.pengadaan_bahan.total_biaya)}</div>
                                    <div>• Pemeliharaan: {formatCurrency(data.pemeliharaan.total_biaya)}</div>
                                    <div>• Penggajian Produksi: {formatCurrency(data.penggajian_produksi?.total_gaji || 0)}</div>
                                    <div>• Penggajian Driver: {formatCurrency(data.penggajian_driver?.total_gaji || 0)}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Breakdown by Module */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                        {/* Keuangan Eksternal */}
                        <div className="panel">
                            <h5 className="font-semibold text-lg dark:text-white-light mb-4">
                                Keuangan Eksternal
                            </h5>
                            
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900 rounded-lg">
                                    <span className="font-medium">Pemasukan</span>
                                    <span className="font-bold text-success">
                                        {formatCurrency(data.keuangan_eksternal.total_masuk)}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900 rounded-lg">
                                    <span className="font-medium">Pengeluaran</span>
                                    <span className="font-bold text-danger">
                                        {formatCurrency(data.keuangan_eksternal.total_keluar)}
                                    </span>
                                </div>
                                
                                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                                    {data.keuangan_eksternal.transaksi.length} transaksi
                                </div>
                            </div>
                        </div>

                        {/* Penjualan/Pesanan */}
                        {data.penjualan && data.penjualan.total_penjualan > 0 && (
                            <div className="panel">
                                <h5 className="font-semibold text-lg dark:text-white-light mb-4">
                                    Penjualan
                                </h5>
                                
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-900 rounded-lg">
                                        <span className="font-medium">Total Penjualan</span>
                                        <span className="font-bold text-emerald-600">
                                            {formatCurrency(data.penjualan.total_penjualan)}
                                        </span>
                                    </div>
                                    
                                    <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                                        {data.penjualan.jumlah_pesanan} pesanan
                                    </div>
                                    
                                    {/* Top 3 Pesanan */}
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Pesanan Terbesar:
                                        </div>
                                        {data.penjualan.pesanan.slice(0, 3).map((item: any, index: number) => (
                                            <div key={index} className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                                <div className="font-medium truncate">{item.no_pesanan || 'Pesanan ' + (index + 1)}</div>
                                                <div className="text-emerald-600 font-semibold">
                                                    {formatCurrency(item.total_harga || 0)}
                                                </div>
                                                <div className="text-gray-500 text-xs">
                                                    {item.pelanggan?.nama || '-'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Pengadaan */}
                        <div className="panel">
                            <h5 className="font-semibold text-lg dark:text-white-light mb-4">
                                Pengadaan Bahan Baku
                            </h5>
                            
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900 rounded-lg">
                                    <span className="font-medium">Total Pengadaan</span>
                                    <span className="font-bold text-danger">
                                        {formatCurrency(data.pengadaan_bahan.total_biaya)}
                                    </span>
                                </div>
                                
                                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                                    {data.pengadaan_bahan.jumlah_pengadaan} pengadaan
                                </div>
                                
                                {/* Top 3 Pengadaan */}
                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Pengadaan Terbesar:
                                    </div>
                                    {data.pengadaan_bahan.pengadaan.slice(0, 3).map((item: any, index: number) => (
                                        <div key={index} className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                            <div className="font-medium truncate">{item.nama_bahan || 'Pengadaan ' + (index + 1)}</div>
                                            <div className="text-danger font-semibold">
                                                {formatCurrency(item.total_biaya || 0)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Pemeliharaan */}
                        <div className="panel">
                            <h5 className="font-semibold text-lg dark:text-white-light mb-4">
                                Pemeliharaan Aset
                            </h5>
                            
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900 rounded-lg">
                                    <span className="font-medium">Total Pemeliharaan</span>
                                    <span className="font-bold text-danger">
                                        {formatCurrency(data.pemeliharaan.total_biaya)}
                                    </span>
                                </div>
                                
                                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                                    {data.pemeliharaan.jumlah_pemeliharaan} aktivitas
                                </div>
                                
                                {/* Top 3 Pemeliharaan */}
                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Pemeliharaan Terbesar:
                                    </div>
                                    {data.pemeliharaan.pemeliharaan.slice(0, 3).map((item: any, index: number) => (
                                        <div key={index} className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                            <div className="font-medium truncate">{item.nama_aset || 'Pemeliharaan ' + (index + 1)}</div>
                                            <div className="text-danger font-semibold">
                                                {formatCurrency(item.biaya || 0)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Penggajian Produksi */}
                        {data.penggajian_produksi && data.penggajian_produksi.total_gaji > 0 && (
                            <div className="panel">
                                <h5 className="font-semibold text-lg dark:text-white-light mb-4">
                                    Penggajian Produksi
                                </h5>
                                
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900 rounded-lg">
                                        <span className="font-medium">Total Penggajian</span>
                                        <span className="font-bold text-warning">
                                            {formatCurrency(data.penggajian_produksi.total_gaji)}
                                        </span>
                                    </div>
                                    
                                    <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                                        {data.penggajian_produksi.jumlah_karyawan} karyawan dari {data.penggajian_produksi.jumlah_produksi} produksi
                                    </div>
                                    
                                    {/* Top 3 Produksi */}
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Produksi Terbesar:
                                        </div>
                                        {data.penggajian_produksi.produksi.slice(0, 3).map((item: any, index: number) => {
                                            const totalGaji = item.detailProduksi?.reduce((sum: number, detail: any) => 
                                                sum + (Number(detail.gaji_total) || 0), 0) || 0;
                                            return (
                                                <div key={index} className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                                    <div className="font-medium truncate">{item.kode_produksi}</div>
                                                    <div className="text-warning font-semibold">
                                                        {formatCurrency(totalGaji)}
                                                    </div>
                                                    <div className="text-gray-500 text-xs">
                                                        {item.detailProduksi?.length || 0} karyawan
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Financial Health Indicators */}
                    <div className="panel">
                        <h5 className="font-semibold text-lg dark:text-white-light mb-5">
                            Kelengkapan Data Transaksi
                        </h5>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                            <div className="text-center p-3 border rounded-lg bg-blue-50 dark:bg-blue-900">
                                <div className="text-lg font-bold text-blue-600">✓</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">Keuangan Eksternal</div>
                                <div className="text-sm font-semibold">{data.keuangan_eksternal.transaksi.length}</div>
                            </div>
                            
                            <div className="text-center p-3 border rounded-lg bg-emerald-50 dark:bg-emerald-900">
                                <div className="text-lg font-bold text-emerald-600">✓</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">Penjualan</div>
                                <div className="text-sm font-semibold">{data.penjualan?.jumlah_pesanan || 0}</div>
                            </div>
                            
                            <div className="text-center p-3 border rounded-lg bg-purple-50 dark:bg-purple-900">
                                <div className="text-lg font-bold text-purple-600">✓</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">Pengadaan</div>
                                <div className="text-sm font-semibold">{data.pengadaan_bahan.jumlah_pengadaan}</div>
                            </div>
                            
                            <div className="text-center p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-900">
                                <div className="text-lg font-bold text-yellow-600">✓</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">Pemeliharaan</div>
                                <div className="text-sm font-semibold">{data.pemeliharaan.jumlah_pemeliharaan}</div>
                            </div>
                            
                            <div className="text-center p-3 border rounded-lg bg-orange-50 dark:bg-orange-900">
                                <div className="text-lg font-bold text-orange-600">✓</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">Gaji Produksi</div>
                                <div className="text-sm font-semibold">{data.penggajian_produksi?.jumlah_produksi || 0}</div>
                            </div>
                            
                            <div className="text-center p-3 border rounded-lg bg-cyan-50 dark:bg-cyan-900">
                                <div className="text-lg font-bold text-cyan-600">✓</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">Gaji Driver</div>
                                <div className="text-sm font-semibold">{data.penggajian_driver?.jumlah_pengiriman || 0}</div>
                            </div>
                        </div>

                        {/* <h5 className="font-semibold text-lg dark:text-white-light mb-5 mt-8">
                            Indikator Kesehatan Keuangan
                        </h5>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="text-center p-4 border rounded-lg">
                                <div className="text-2xl font-bold text-primary">
                                    {((grandTotal.total_masuk / (grandTotal.total_keluar || 1)) * 100).toFixed(1)}%
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Rasio Pemasukan vs Pengeluaran</div>
                            </div>
                            
                            <div className="text-center p-4 border rounded-lg">
                                <div className="text-2xl font-bold text-info">
                                    {((data.pengadaan_bahan.total_biaya / grandTotal.total_keluar) * 100).toFixed(1)}%
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Proporsi Pengadaan</div>
                            </div>
                            
                            <div className="text-center p-4 border rounded-lg">
                                <div className="text-2xl font-bold text-warning">
                                    {((data.pemeliharaan.total_biaya / grandTotal.total_keluar) * 100).toFixed(1)}%
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Proporsi Pemeliharaan</div>
                            </div>

                            {data.penggajian_produksi && data.penggajian_produksi.total_gaji > 0 && (
                                <div className="text-center p-4 border rounded-lg">
                                    <div className="text-2xl font-bold text-success">
                                        {(((data.penggajian_produksi.total_gaji + (data.penggajian_driver?.total_gaji || 0)) / grandTotal.total_keluar) * 100).toFixed(1)}%
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Proporsi Total Penggajian</div>
                                </div>
                            )}
                        </div> */}
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

export default KeuanganLaporanTerpadu;