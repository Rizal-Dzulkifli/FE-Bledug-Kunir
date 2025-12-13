import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { KeuanganEksternalService } from '../../services/KeuanganEksternalService';
import ReactApexChart from 'react-apexcharts';
import IconPlus from '../../components/Icon/IconPlus';
import IconMinus from '../../components/Icon/IconMinus';
import IconDollarSign from '../../components/Icon/IconDollarSign';
import IconTrendingUp from '../../components/Icon/IconTrendingUp';
import IconCalendar from '../../components/Icon/IconCalendar';
import IconEye from '../../components/Icon/IconEye';
import IconRefresh from '../../components/Icon/IconRefresh';

const KeuanganDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    // Get date range based on selected period
    const getDateRange = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        
        switch (selectedPeriod) {
            case 'thisMonth':
                const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
                const lastDay = new Date(year, month, 0).getDate();
                const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
                return { startDate, endDate };
            
            case 'lastMonth':
                const lastMonth = month === 1 ? 12 : month - 1;
                const lastMonthYear = month === 1 ? year - 1 : year;
                const lastMonthStart = `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}-01`;
                const lastMonthEnd = `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}-${new Date(lastMonthYear, lastMonth, 0).getDate()}`;
                return { startDate: lastMonthStart, endDate: lastMonthEnd };
            
            case 'thisYear':
                return { startDate: `${year}-01-01`, endDate: `${year}-12-31` };
            
            case 'custom':
                return { startDate: customStartDate, endDate: customEndDate };
            
            default:
                return { startDate: `${year}-${String(month).padStart(2, '0')}-01`, endDate: `${year}-${String(month).padStart(2, '0')}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}` };
        }
    };

    // Fetch dashboard data lengkap (all modules)
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const { startDate, endDate } = getDateRange();
            
            if (!startDate || !endDate) {
                setError('Tanggal tidak valid');
                return;
            }
            
            const response = await KeuanganEksternalService.getLaporanTerpadu({
                start_date: startDate,
                end_date: endDate
            });
            
            if (response) {
                console.log('📊 Dashboard Data:', response);
                setData(response);
            } else {
                setError('Gagal memuat data dashboard');
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError('Gagal memuat data dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [selectedPeriod, customStartDate, customEndDate]);

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="panel">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="panel">
                <div className="text-center py-12">
                    <p className="text-danger mb-4">{error || 'Data tidak tersedia'}</p>
                    <button 
                        onClick={fetchDashboardData}
                        className="btn btn-primary"
                    >
                        Muat Ulang
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Period Filter */}
            <div className="panel">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold dark:text-white-light">
                            Dashboard Keuangan Terpadu
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Ringkasan keuangan dari semua modul
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {/* Period Selector */}
                        <select 
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="form-select w-auto"
                        >
                            <option value="thisMonth">Bulan Ini</option>
                            <option value="lastMonth">Bulan Lalu</option>
                            <option value="thisYear">Tahun Ini</option>
                            <option value="custom">Custom</option>
                        </select>

                        {/* Custom Date Range */}
                        {selectedPeriod === 'custom' && (
                            <div className="flex items-center gap-2">
                                <input 
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                    className="form-input w-auto"
                                />
                                <span className="text-gray-500">-</span>
                                <input 
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    className="form-input w-auto"
                                />
                            </div>
                        )}

                        {/* Refresh Button */}
                        <button 
                            onClick={fetchDashboardData}
                            disabled={loading}
                            className="btn btn-outline-primary"
                        >
                            <IconRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>

                        {/* Add Transaction Button */}
                        <Link 
                            to="/keuangan/transaksi/add" 
                            className="btn btn-primary gap-2"
                        >
                            <IconPlus className="w-4 h-4" />
                            Tambah
                        </Link>
                    </div>
                </div>
            </div>

            {/* Summary Cards - All Modules */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Pemasukan */}
                <div className="panel bg-gradient-to-r from-green-500 to-emerald-500">
                    <div className="flex justify-between items-center">
                        <div className="text-white">
                            <div className="text-2xl font-bold">
                                {formatCurrency(data.total_keseluruhan?.total_pemasukan || 0)}
                            </div>
                            <div className="text-sm mt-1 opacity-80">Total Pemasukan</div>
                            <div className="text-xs mt-1 opacity-60">
                                Keuangan + Penjualan
                            </div>
                        </div>
                        <div className="text-white opacity-20">
                            <IconPlus className="w-10 h-10" />
                        </div>
                    </div>
                </div>

                {/* Total Pengeluaran */}
                <div className="panel bg-gradient-to-r from-red-500 to-pink-500">
                    <div className="flex justify-between items-center">
                        <div className="text-white">
                            <div className="text-2xl font-bold">
                                {formatCurrency(data.total_keseluruhan?.total_pengeluaran || 0)}
                            </div>
                            <div className="text-sm mt-1 opacity-80">Total Pengeluaran</div>
                            <div className="text-xs mt-1 opacity-60">
                                Semua Modul
                            </div>
                        </div>
                        <div className="text-white opacity-20">
                            <IconMinus className="w-10 h-10" />
                        </div>
                    </div>
                </div>

                {/* Saldo Bersih */}
                <div className="panel bg-gradient-to-r from-blue-500 to-cyan-500">
                    <div className="flex justify-between items-center">
                        <div className="text-white">
                            <div className="text-2xl font-bold">
                                {formatCurrency(data.total_keseluruhan?.saldo_bersih || 0)}
                            </div>
                            <div className="text-sm mt-1 opacity-80">Saldo Bersih</div>
                            <div className="text-xs mt-1 opacity-60">
                                Pemasukan - Pengeluaran
                            </div>
                        </div>
                        <div className="text-white opacity-20">
                            <IconDollarSign className="w-10 h-10" />
                        </div>
                    </div>
                </div>

                {/* Total Transaksi */}
                <div className="panel bg-gradient-to-r from-purple-500 to-violet-500">
                    <div className="flex justify-between items-center">
                        <div className="text-white">
                            <div className="text-2xl font-bold">
                                {(data.keuangan_eksternal?.transaksi?.length || 0) + 
                                 (data.penjualan?.jumlah_pesanan || 0) +
                                 (data.pengadaan_bahan?.jumlah_pengadaan || 0) +
                                 (data.pemeliharaan?.jumlah_pemeliharaan || 0)}
                            </div>
                            <div className="text-sm mt-1 opacity-80">Total Transaksi</div>
                            <div className="text-xs mt-1 opacity-60">
                                Semua Aktivitas
                            </div>
                        </div>
                        <div className="text-white opacity-20">
                            <IconCalendar className="w-10 h-10" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pemasukan vs Pengeluaran Chart */}
                <div className="panel">
                    <div className="flex items-center justify-between mb-5">
                        <h5 className="font-semibold text-lg dark:text-white-light">
                            Pemasukan vs Pengeluaran
                        </h5>
                    </div>
                    <ReactApexChart
                        options={{
                            chart: {
                                type: 'donut',
                                height: 300,
                            },
                            labels: ['Pemasukan', 'Pengeluaran'],
                            colors: ['#10b981', '#ef4444'],
                            legend: {
                                position: 'bottom',
                            },
                            dataLabels: {
                                enabled: true,
                            },
                            plotOptions: {
                                pie: {
                                    donut: {
                                        size: '65%',
                                        labels: {
                                            show: true,
                                            total: {
                                                show: true,
                                                label: 'Total',
                                                formatter: () => {
                                                    const total = (data.total_keseluruhan?.total_pemasukan || 0) + 
                                                                (data.total_keseluruhan?.total_pengeluaran || 0);
                                                    return formatCurrency(total);
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        }}
                        series={[
                            data.total_keseluruhan?.total_pemasukan || 0,
                            data.total_keseluruhan?.total_pengeluaran || 0,
                        ]}
                        type="donut"
                        height={300}
                    />
                </div>

                {/* Breakdown Pengeluaran Chart */}
                <div className="panel">
                    <div className="flex items-center justify-between mb-5">
                        <h5 className="font-semibold text-lg dark:text-white-light">
                            Breakdown Pengeluaran
                        </h5>
                    </div>
                    <ReactApexChart
                        options={{
                            chart: {
                                type: 'bar',
                                height: 300,
                                toolbar: {
                                    show: false,
                                },
                            },
                            plotOptions: {
                                bar: {
                                    horizontal: true,
                                    dataLabels: {
                                        position: 'top',
                                    },
                                },
                            },
                            colors: ['#4361ee'],
                            dataLabels: {
                                enabled: false,
                            },
                            xaxis: {
                                categories: ['Keuangan', 'Pengadaan', 'Pemeliharaan', 'Gaji Produksi', 'Gaji Driver'],
                                labels: {
                                    formatter: (val) => formatCurrency(Number(val)),
                                },
                            },
                            tooltip: {
                                y: {
                                    formatter: (val) => formatCurrency(val),
                                },
                            },
                        }}
                        series={[{
                            name: 'Pengeluaran',
                            data: [
                                data.keuangan_eksternal?.total_keluar || 0,
                                data.pengadaan_bahan?.total_biaya || 0,
                                data.pemeliharaan?.total_biaya || 0,
                                data.penggajian_produksi?.total_gaji || 0,
                                data.penggajian_driver?.total_gaji || 0,
                            ],
                        }]}
                        type="bar"
                        height={300}
                    />
                </div>
            </div>

            {/* Breakdown by Module */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Keuangan Eksternal */}
                <div className="panel">
                    <h5 className="font-semibold text-lg dark:text-white-light mb-4">
                        Keuangan Eksternal
                    </h5>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900 rounded">
                            <span className="text-sm">Pemasukan</span>
                            <span className="font-bold text-success">
                                {formatCurrency(data.keuangan_eksternal?.total_masuk || 0)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900 rounded">
                            <span className="text-sm">Pengeluaran</span>
                            <span className="font-bold text-danger">
                                {formatCurrency(data.keuangan_eksternal?.total_keluar || 0)}
                            </span>
                        </div>
                        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                            {data.keuangan_eksternal?.transaksi?.length || 0} transaksi
                        </div>
                    </div>
                </div>

                {/* Penjualan */}
                {data.penjualan && data.penjualan.total_penjualan > 0 && (
                    <div className="panel">
                        <h5 className="font-semibold text-lg dark:text-white-light mb-4">
                            Penjualan
                        </h5>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-2 bg-emerald-50 dark:bg-emerald-900 rounded">
                                <span className="text-sm">Total Penjualan</span>
                                <span className="font-bold text-emerald-600">
                                    {formatCurrency(data.penjualan.total_penjualan)}
                                </span>
                            </div>
                            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                                {data.penjualan.jumlah_pesanan} pesanan
                            </div>
                        </div>
                    </div>
                )}

                {/* Pengadaan */}
                <div className="panel">
                    <h5 className="font-semibold text-lg dark:text-white-light mb-4">
                        Pengadaan Bahan
                    </h5>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900 rounded">
                            <span className="text-sm">Total Biaya</span>
                            <span className="font-bold text-danger">
                                {formatCurrency(data.pengadaan_bahan?.total_biaya || 0)}
                            </span>
                        </div>
                        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                            {data.pengadaan_bahan?.jumlah_pengadaan || 0} pengadaan
                        </div>
                    </div>
                </div>

                {/* Pemeliharaan */}
                <div className="panel">
                    <h5 className="font-semibold text-lg dark:text-white-light mb-4">
                        Pemeliharaan Aset
                    </h5>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900 rounded">
                            <span className="text-sm">Total Biaya</span>
                            <span className="font-bold text-danger">
                                {formatCurrency(data.pemeliharaan?.total_biaya || 0)}
                            </span>
                        </div>
                        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                            {data.pemeliharaan?.jumlah_pemeliharaan || 0} aktivitas
                        </div>
                    </div>
                </div>

                {/* Penggajian Produksi */}
                {data.penggajian_produksi && data.penggajian_produksi.total_gaji > 0 && (
                    <div className="panel">
                        <h5 className="font-semibold text-lg dark:text-white-light mb-4">
                            Gaji Produksi
                        </h5>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-2 bg-orange-50 dark:bg-orange-900 rounded">
                                <span className="text-sm">Total Gaji</span>
                                <span className="font-bold text-warning">
                                    {formatCurrency(data.penggajian_produksi.total_gaji)}
                                </span>
                            </div>
                            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                                {data.penggajian_produksi.jumlah_karyawan} karyawan
                            </div>
                        </div>
                    </div>
                )}

                {/* Penggajian Driver */}
                {data.penggajian_driver && data.penggajian_driver.total_gaji > 0 && (
                    <div className="panel">
                        <h5 className="font-semibold text-lg dark:text-white-light mb-4">
                            Gaji Driver
                        </h5>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-2 bg-cyan-50 dark:bg-cyan-900 rounded">
                                <span className="text-sm">Total Gaji</span>
                                <span className="font-bold text-cyan-600">
                                    {formatCurrency(data.penggajian_driver.total_gaji)}
                                </span>
                            </div>
                            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                                {data.penggajian_driver.jumlah_driver} driver
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="panel">
                <h5 className="font-semibold text-lg dark:text-white-light mb-5">
                    Akses Cepat
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link to="/keuangan/transaksi" className="btn btn-outline-primary w-full">
                        Transaksi Manual
                    </Link>
                    <Link to="/keuangan/transaksi-terpadu" className="btn btn-outline-success w-full">
                        Transaksi Terpadu
                    </Link>
                    <Link to="/keuangan/laporan" className="btn btn-outline-info w-full">
                        Laporan Manual
                    </Link>
                    <Link to="/keuangan/laporan-terpadu" className="btn btn-outline-warning w-full">
                        Laporan Terpadu
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default KeuanganDashboard;