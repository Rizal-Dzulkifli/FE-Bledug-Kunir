import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ReactApexChart from 'react-apexcharts';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../store';
import { setPageTitle } from '../store/themeConfigSlice';
import { useAuth } from '../contexts/AuthContext';
import KaryawanService, { KaryawanStats, RecentProduksi, InventarisItem } from '../services/KaryawanService';
import { Icon } from '@iconify-icon/react';
import Swal from 'sweetalert2';

const KaryawanDashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { state } = useAuth();
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl' ? true : false;

    const [stats, setStats] = useState<KaryawanStats>({
        total_produksi: 0,
        produksi_bulan_ini: 0,
        total_inventaris: 0,
        inventaris_tersedia: 0,
        total_pengiriman: 0,
        pengiriman_selesai: 0,
    });
    
    const [recentProduksi, setRecentProduksi] = useState<RecentProduksi[]>([]);
    const [recentInventaris, setRecentInventaris] = useState<InventarisItem[]>([]);
    const [inventarisChartData, setInventarisChartData] = useState({
        tersedia: 0,
        ditempatkan: 0,
        dipinjamkan: 0,
        rusak: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        dispatch(setPageTitle('Dashboard Karyawan'));
        
        // Pastikan user adalah karyawan
        if (state.user?.role !== 'karyawan') {
            navigate('/dashboard');
            return;
        }
        
        fetchDashboardData();
    }, [dispatch, navigate, state.user]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            
            const [statsResponse, produksiResponse, inventarisResponse, inventarisStatsResponse] = await Promise.all([
                KaryawanService.getKaryawanStats(),
                KaryawanService.getRecentProduksi(5),
                KaryawanService.getRecentInventaris(5),
                KaryawanService.getInventarisStats(),
            ]);

            if (statsResponse.success) {
                setStats(statsResponse.data);
            }
            
            if (produksiResponse.success) {
                setRecentProduksi(produksiResponse.data);
            }

            if (inventarisResponse.success) {
                setRecentInventaris(inventarisResponse.data);
            }

            if (inventarisStatsResponse.success) {
                setInventarisChartData(inventarisStatsResponse.data);
            }
            
        } catch (error: any) {
            console.error('Error fetching dashboard data:', error);
            Swal.fire('Error', error.message || 'Gagal memuat data dashboard', 'error');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'selesai':
            case 'tersedia':
                return 'badge-outline-success';
            case 'proses':
            case 'ditempatkan':
                return 'badge-outline-warning';
            case 'batal':
            case 'rusak':
                return 'badge-outline-danger';
            case 'dipinjamkan':
                return 'badge-outline-info';
            default:
                return 'badge-outline-primary';
        }
    };

    // Chart data untuk status inventaris
    const inventarisChart: any = {
        series: [inventarisChartData.tersedia, inventarisChartData.ditempatkan, inventarisChartData.dipinjamkan, inventarisChartData.rusak],
        options: {
            chart: {
                height: 300,
                type: 'donut',
                zoom: { enabled: false },
                toolbar: { show: false },
            },
            stroke: { show: false },
            labels: ['Tersedia', 'Ditempatkan', 'Dipinjamkan', 'Rusak'],
            colors: ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'],
            responsive: [
                {
                    breakpoint: 480,
                    options: {
                        chart: { width: 200 },
                    },
                },
            ],
            legend: { position: 'bottom' },
        },
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Icon icon="solar:loading-linear" className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-gray-500">Memuat data dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <h2 className="text-xl font-semibold">Dashboard Karyawan</h2>
                <div className="text-sm text-gray-500">
                    Selamat datang, {state.user?.nama}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
                <div className="panel bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-sm opacity-80">Total Produksi</div>
                            <div className="text-2xl font-bold mt-1">{stats.total_produksi}</div>
                        </div>
                        <Icon icon="solar:settings-bold-duotone" className="w-10 h-10 opacity-80" />
                    </div>
                </div>

                <div className="panel bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-sm opacity-80">Produksi Bulan Ini</div>
                            <div className="text-2xl font-bold mt-1">{stats.produksi_bulan_ini}</div>
                        </div>
                        <Icon icon="solar:calendar-bold-duotone" className="w-10 h-10 opacity-80" />
                    </div>
                </div>

                <div className="panel bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-sm opacity-80">Total Inventaris</div>
                            <div className="text-2xl font-bold mt-1">{stats.total_inventaris}</div>
                        </div>
                        <Icon icon="solar:box-bold-duotone" className="w-10 h-10 opacity-80" />
                    </div>
                </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="panel">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-500">Inventaris Tersedia</div>
                            <div className="text-xl font-bold text-success mt-1">
                                {stats.inventaris_tersedia}
                            </div>
                        </div>
                        <Icon icon="solar:check-circle-bold-duotone" className="w-8 h-8 text-success" />
                    </div>
                </div>

                <div className="panel">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-500">Total Pengiriman</div>
                            <div className="text-xl font-bold text-primary mt-1">
                                {stats.total_pengiriman}
                            </div>
                        </div>
                        <Icon icon="solar:delivery-bold-duotone" className="w-8 h-8 text-primary" />
                    </div>
                </div>

                <div className="panel">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-500">Pengiriman Selesai</div>
                            <div className="text-xl font-bold text-info mt-1">
                                {stats.pengiriman_selesai}
                            </div>
                        </div>
                        <Icon icon="solar:box-bold-duotone" className="w-8 h-8 text-info" />
                    </div>
                </div>
            </div>

            {/* Charts and Recent Data */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                {/* Inventaris Chart */}
                <div className="panel">
                    <div className="mb-5 flex items-center justify-between">
                        <h5 className="text-lg font-semibold">Status Inventaris</h5>
                    </div>
                    <div className="mb-5">
                        {stats.total_inventaris > 0 ? (
                            <ReactApexChart 
                                series={inventarisChart.series} 
                                options={inventarisChart.options} 
                                type="donut" 
                                height={300} 
                            />
                        ) : (
                            <div className="flex items-center justify-center h-[300px] text-gray-500">
                                <div className="text-center">
                                    <Icon icon="solar:box-bold-duotone" className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p>Belum ada data inventaris</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Produksi */}
                <div className="panel">
                    <div className="mb-5 flex items-center justify-between">
                        <h5 className="text-lg font-semibold">Produksi Terbaru</h5>
                        <Link 
                            to="/apps/produksi"
                            className="text-primary hover:text-primary-dark text-sm font-medium"
                        >
                            Lihat Semua
                        </Link>
                    </div>
                    <div className="space-y-4">
                        {recentProduksi.length > 0 ? (
                            recentProduksi.map((produksi) => (
                                <div key={produksi.id} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="font-semibold text-primary">
                                            {produksi.no_produksi}
                                        </div>
                                        <span className={`badge ${getStatusBadge(produksi.status)} text-xs`}>
                                            {produksi.status}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600 mb-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Icon icon="solar:calendar-bold-duotone" className="w-4 h-4" />
                                            {formatDate(produksi.tanggal_produksi)}
                                        </div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Icon icon="solar:box-bold-duotone" className="w-4 h-4" />
                                            Total: {produksi.total_kuantitas} unit
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Icon icon="solar:user-bold-duotone" className="w-4 h-4" />
                                            {produksi.karyawan?.nama || 'Tidak diketahui'}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Icon icon="solar:settings-bold-duotone" className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p>Belum ada data produksi</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Inventaris */}
            <div className="panel mb-6">
                <div className="mb-5 flex items-center justify-between">
                    <h5 className="text-lg font-semibold">Inventaris Terbaru</h5>
                    <Link 
                        to="/apps/inventaris"
                        className="text-primary hover:text-primary-dark text-sm font-medium"
                    >
                        Lihat Semua
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentInventaris.length > 0 ? (
                        recentInventaris.map((item) => (
                            <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="font-semibold text-primary">
                                        {item.kode_barang}
                                    </div>
                                    <span className={`badge ${getStatusBadge(item.status)} text-xs`}>
                                        {item.status}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-600">
                                    <div className="mb-1">
                                        <strong>Nama:</strong> {item.namaBarang}
                                    </div>
                                    <div className="mb-1">
                                        <strong>Lokasi:</strong> {item.lokasi}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {formatDate(item.created_at)}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-8 text-gray-500">
                            <Icon icon="solar:box-bold-duotone" className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p>Belum ada data inventaris</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KaryawanDashboard;