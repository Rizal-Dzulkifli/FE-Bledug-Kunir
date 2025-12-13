import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { KeuanganEksternalService, ProyeksiKeuangan } from '../../services/KeuanganEksternalService';
import IconSearch from '../../components/Icon/IconSearch';
import IconTrendingUp from '../../components/Icon/IconTrendingUp';
import IconInfoCircle from '../../components/Icon/IconInfoCircle';

const KeuanganProyeksi = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<ProyeksiKeuangan | null>(null);
    const [periode, setPeriode] = useState('6'); // Default 6 months

    // Fetch projection data
    const fetchProyeksi = async () => {
        try {
            setLoading(true);
            
            const response = await KeuanganEksternalService.getProyeksi(parseInt(periode));
            
            if (response) {
                setData(response);
            }
        } catch (error) {
            console.error('Error fetching projection:', error);
            Swal.fire('Error', 'Gagal memuat proyeksi keuangan', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchProyeksi();
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

    // Get trend indicator
    const getTrendIndicator = (current: number, previous: number) => {
        if (previous === 0) return { trend: 'stable', color: 'text-gray-500', icon: '→' };
        
        const change = ((current - previous) / Math.abs(previous)) * 100;
        
        if (change > 5) return { trend: 'up', color: 'text-success', icon: '↗' };
        if (change < -5) return { trend: 'down', color: 'text-danger', icon: '↘' };
        return { trend: 'stable', color: 'text-gray-500', icon: '→' };
    };

    // Get month name
    const getMonthName = (monthString: string) => {
        try {
            const date = new Date(monthString + '-01');
            return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });
        } catch {
            return monthString;
        }
    };

    useEffect(() => {
        fetchProyeksi();
    }, []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold dark:text-white-light">
                    Proyeksi Keuangan
                </h2>
            </div>

            {/* Control Panel */}
            <div className="panel">
                <form onSubmit={handleSubmit} className="flex items-center gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Periode Proyeksi</label>
                        <select
                            value={periode}
                            onChange={(e) => setPeriode(e.target.value)}
                            className="form-select w-48"
                        >
                            <option value="3">3 Bulan ke Depan</option>
                            <option value="6">6 Bulan ke Depan</option>
                            <option value="12">12 Bulan ke Depan</option>
                        </select>
                    </div>
                    
                    <div className="mt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary gap-2"
                        >
                            <IconSearch className="w-4 h-4" />
                            {loading ? 'Memuat...' : 'Generate Proyeksi'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Projection Content */}
            {loading ? (
                <div className="panel">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                </div>
            ) : data ? (
                <div className="space-y-6">
                    {/* Projection Chart/Table */}
                    <div className="panel">
                        <div className="flex items-center justify-between mb-5">
                            <h5 className="font-semibold text-lg dark:text-white-light">
                                Proyeksi Keuangan {periode} Bulan ke Depan
                            </h5>
                            <IconTrendingUp className="w-5 h-5 text-primary" />
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="table-hover">
                                <thead>
                                    <tr>
                                        <th>Bulan</th>
                                        <th>Proyeksi Pemasukan</th>
                                        <th>Proyeksi Pengeluaran</th>
                                        <th>Proyeksi Saldo</th>
                                        <th>Tren</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.proyeksi.map((item, index) => {
                                        const prevItem = index > 0 ? data.proyeksi[index - 1] : null;
                                        const trendPemasukan = prevItem ? getTrendIndicator(item.proyeksi_pemasukan, prevItem.proyeksi_pemasukan) : { trend: 'stable', color: 'text-gray-500', icon: '→' };
                                        const trendPengeluaran = prevItem ? getTrendIndicator(item.proyeksi_pengeluaran, prevItem.proyeksi_pengeluaran) : { trend: 'stable', color: 'text-gray-500', icon: '→' };
                                        const trendSaldo = prevItem ? getTrendIndicator(item.proyeksi_saldo, prevItem.proyeksi_saldo) : { trend: 'stable', color: 'text-gray-500', icon: '→' };
                                        
                                        return (
                                            <tr key={index}>
                                                <td className="font-medium">{getMonthName(item.bulan)}</td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-success font-semibold">
                                                            {formatCurrency(item.proyeksi_pemasukan)}
                                                        </span>
                                                        <span className={`text-sm ${trendPemasukan.color}`}>
                                                            {trendPemasukan.icon}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-danger font-semibold">
                                                            {formatCurrency(item.proyeksi_pengeluaran)}
                                                        </span>
                                                        <span className={`text-sm ${trendPengeluaran.color}`}>
                                                            {trendPengeluaran.icon}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-semibold ${item.proyeksi_saldo >= 0 ? 'text-primary' : 'text-warning'}`}>
                                                            {formatCurrency(item.proyeksi_saldo)}
                                                        </span>
                                                        <span className={`text-sm ${trendSaldo.color}`}>
                                                            {trendSaldo.icon}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-1">
                                                        {item.proyeksi_saldo >= 0 ? (
                                                            <span className="badge bg-success text-white text-xs">Surplus</span>
                                                        ) : (
                                                            <span className="badge bg-danger text-white text-xs">Defisit</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="panel bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900 dark:to-green-800">
                            <div className="text-success font-semibold mb-2">Rata-rata Proyeksi Pemasukan</div>
                            <div className="text-2xl font-bold text-success">
                                {formatCurrency(data.proyeksi.reduce((sum, item) => sum + item.proyeksi_pemasukan, 0) / data.proyeksi.length)}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Per bulan untuk {periode} bulan ke depan
                            </div>
                        </div>
                        
                        <div className="panel bg-gradient-to-r from-red-100 to-red-50 dark:from-red-900 dark:to-red-800">
                            <div className="text-danger font-semibold mb-2">Rata-rata Proyeksi Pengeluaran</div>
                            <div className="text-2xl font-bold text-danger">
                                {formatCurrency(data.proyeksi.reduce((sum, item) => sum + item.proyeksi_pengeluaran, 0) / data.proyeksi.length)}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Per bulan untuk {periode} bulan ke depan
                            </div>
                        </div>
                        
                        <div className="panel bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900 dark:to-blue-800">
                            <div className="text-primary font-semibold mb-2">Total Proyeksi Saldo</div>
                            <div className="text-2xl font-bold text-primary">
                                {formatCurrency(data.proyeksi.reduce((sum, item) => sum + item.proyeksi_saldo, 0))}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Akumulasi {periode} bulan ke depan
                            </div>
                        </div>
                    </div>

                    {/* AI Recommendations */}
                    <div className="panel">
                        <div className="flex items-center gap-2 mb-5">
                            <IconInfoCircle className="w-5 h-5 text-warning" />
                            <h5 className="font-semibold text-lg dark:text-white-light">
                                Rekomendasi Strategis
                            </h5>
                        </div>
                        
                        <div className="space-y-4">
                            {data.rekomendasi && data.rekomendasi.length > 0 ? (
                                data.rekomendasi.map((rekomendasi, index) => (
                                    <div key={index} className="bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-500 p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-gray-700 dark:text-gray-300">{rekomendasi}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">Tidak ada rekomendasi khusus untuk periode ini</p>
                                    <p className="text-sm text-gray-400 mt-2">
                                        Lanjutkan monitoring kinerja keuangan secara berkala
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Risk Assessment */}
                    <div className="panel">
                        <h5 className="font-semibold text-lg dark:text-white-light mb-5">
                            Penilaian Risiko Keuangan
                        </h5>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Liquidity Risk */}
                            <div className="text-center p-4 border rounded-lg">
                                <div className="text-lg font-bold text-info mb-1">
                                    {data.proyeksi.filter(item => item.proyeksi_saldo >= 0).length}/{data.proyeksi.length}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Bulan dengan Saldo Positif
                                </div>
                                <div className="text-xs mt-1">
                                    <span className={`badge ${data.proyeksi.filter(item => item.proyeksi_saldo >= 0).length / data.proyeksi.length >= 0.8 ? 'bg-success' : data.proyeksi.filter(item => item.proyeksi_saldo >= 0).length / data.proyeksi.length >= 0.5 ? 'bg-warning' : 'bg-danger'} text-white`}>
                                        {data.proyeksi.filter(item => item.proyeksi_saldo >= 0).length / data.proyeksi.length >= 0.8 ? 'Rendah' : data.proyeksi.filter(item => item.proyeksi_saldo >= 0).length / data.proyeksi.length >= 0.5 ? 'Sedang' : 'Tinggi'}
                                    </span>
                                </div>
                            </div>

                            {/* Volatility */}
                            <div className="text-center p-4 border rounded-lg">
                                <div className="text-lg font-bold text-warning mb-1">
                                    {Math.round(data.proyeksi.reduce((acc, item, index) => {
                                        if (index === 0) return acc;
                                        const prev = data.proyeksi[index - 1];
                                        return acc + Math.abs((item.proyeksi_saldo - prev.proyeksi_saldo) / (prev.proyeksi_saldo || 1)) * 100;
                                    }, 0) / (data.proyeksi.length - 1))}%
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Volatilitas Rata-rata
                                </div>
                                <div className="text-xs mt-1">
                                    <span className="badge bg-info text-white">Fluktuasi Saldo</span>
                                </div>
                            </div>

                            {/* Growth Trend */}
                            <div className="text-center p-4 border rounded-lg">
                                <div className="text-lg font-bold text-success mb-1">
                                    {data.proyeksi.length > 1 ? (
                                        ((data.proyeksi[data.proyeksi.length - 1].proyeksi_saldo - data.proyeksi[0].proyeksi_saldo) / Math.abs(data.proyeksi[0].proyeksi_saldo || 1) * 100).toFixed(1)
                                    ) : 0}%
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Tren Pertumbuhan
                                </div>
                                <div className="text-xs mt-1">
                                    <span className={`badge ${((data.proyeksi[data.proyeksi.length - 1]?.proyeksi_saldo || 0) - (data.proyeksi[0]?.proyeksi_saldo || 0)) >= 0 ? 'bg-success' : 'bg-danger'} text-white`}>
                                        {((data.proyeksi[data.proyeksi.length - 1]?.proyeksi_saldo || 0) - (data.proyeksi[0]?.proyeksi_saldo || 0)) >= 0 ? 'Positif' : 'Negatif'}
                                    </span>
                                </div>
                            </div>

                            {/* Cash Flow Health */}
                            <div className="text-center p-4 border rounded-lg">
                                <div className="text-lg font-bold text-primary mb-1">
                                    {Math.round((data.proyeksi.reduce((sum, item) => sum + item.proyeksi_pemasukan, 0) / data.proyeksi.reduce((sum, item) => sum + item.proyeksi_pengeluaran, 0)) * 100)}%
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Rasio Pemasukan/Pengeluaran
                                </div>
                                <div className="text-xs mt-1">
                                    <span className={`badge ${(data.proyeksi.reduce((sum, item) => sum + item.proyeksi_pemasukan, 0) / data.proyeksi.reduce((sum, item) => sum + item.proyeksi_pengeluaran, 0)) >= 1.1 ? 'bg-success' : (data.proyeksi.reduce((sum, item) => sum + item.proyeksi_pemasukan, 0) / data.proyeksi.reduce((sum, item) => sum + item.proyeksi_pengeluaran, 0)) >= 0.9 ? 'bg-warning' : 'bg-danger'} text-white`}>
                                        {(data.proyeksi.reduce((sum, item) => sum + item.proyeksi_pemasukan, 0) / data.proyeksi.reduce((sum, item) => sum + item.proyeksi_pengeluaran, 0)) >= 1.1 ? 'Sehat' : (data.proyeksi.reduce((sum, item) => sum + item.proyeksi_pemasukan, 0) / data.proyeksi.reduce((sum, item) => sum + item.proyeksi_pengeluaran, 0)) >= 0.9 ? 'Stabil' : 'Berisiko'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="panel">
                    <div className="text-center py-12">
                        <p className="text-gray-500 mb-4">Pilih periode proyeksi dan klik "Generate Proyeksi" untuk melihat prediksi keuangan</p>
                        <div className="text-sm text-gray-400">
                            <p>• Proyeksi berdasarkan data historis dan tren keuangan</p>
                            <p>• Rekomendasi disesuaikan dengan kondisi bisnis</p>
                            <p>• Analisis risiko membantu perencanaan strategis</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KeuanganProyeksi;