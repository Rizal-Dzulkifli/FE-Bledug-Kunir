import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { KeuanganEksternalService } from '../../services/KeuanganEksternalService';
import IconCalendar from '../../components/Icon/IconCalendar';
import IconEye from '../../components/Icon/IconEye';

interface MonthlyData {
    month: number;
    monthName: string;
    total_pemasukan: number;
    total_pengeluaran: number;
    breakdown_pemasukan?: {
        keuangan_eksternal: number;
        penjualan: number;
    };
    breakdown_pengeluaran?: {
        keuangan_eksternal: number;
        pemeliharaan: number;
        pengadaan: number;
        produksi: number;
        gaji_produksi: number;
        gaji_driver: number;
    };
}

const LaporanBulanan = () => {
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
    const [availableYears, setAvailableYears] = useState<number[]>([]);

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Get month name in Indonesian
    const getMonthName = (month: number): string => {
        const months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        return months[month - 1];
    };

    // Generate available years (from 2020 to current year + 1)
    const generateAvailableYears = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let year = 2020; year <= currentYear + 1; year++) {
            years.push(year);
        }
        setAvailableYears(years.reverse()); // Latest year first
    };

    // Fetch monthly data for selected year
    const fetchMonthlyData = async () => {
        try {
            setLoading(true);
            
            const response = await KeuanganEksternalService.getRingkasanBulanan(selectedYear);
            
            console.log('📊 [Laporan Bulanan] Full Response:', response);
            console.log('📊 [Laporan Bulanan] Sample Month Data:', response.ringkasan_bulanan[0]);
            
            const monthsData: MonthlyData[] = response.ringkasan_bulanan.map((item: any) => {
                console.log(`📊 [Month ${item.monthName}]:`, {
                    total_pengeluaran: item.total_pengeluaran,
                    breakdown: item.breakdown_pengeluaran
                });
                
                return {
                    month: item.month,
                    monthName: item.monthName,
                    total_pemasukan: item.total_pemasukan || 0,
                    total_pengeluaran: item.total_pengeluaran || 0,
                    breakdown_pemasukan: item.breakdown_pemasukan || {
                        keuangan_eksternal: 0,
                        penjualan: 0
                    },
                    breakdown_pengeluaran: item.breakdown_pengeluaran || {
                        keuangan_eksternal: 0,
                        pemeliharaan: 0,
                        pengadaan: 0,
                        produksi: 0,
                        gaji_produksi: 0,
                        gaji_driver: 0
                    }
                };
            });
            
            setMonthlyData(monthsData);
        } catch (error) {
            console.error('Error fetching monthly data:', error);
            Swal.fire('Error', 'Gagal memuat data laporan bulanan', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Calculate yearly totals
    const calculateYearlyTotals = () => {
        return monthlyData.reduce(
            (totals, month) => ({
                total_pemasukan: totals.total_pemasukan + month.total_pemasukan,
                total_pengeluaran: totals.total_pengeluaran + month.total_pengeluaran,
                breakdown_pengeluaran: {
                    keuangan_eksternal: totals.breakdown_pengeluaran.keuangan_eksternal + (month.breakdown_pengeluaran?.keuangan_eksternal || 0),
                    pengadaan: totals.breakdown_pengeluaran.pengadaan + (month.breakdown_pengeluaran?.pengadaan || 0),
                    pemeliharaan: totals.breakdown_pengeluaran.pemeliharaan + (month.breakdown_pengeluaran?.pemeliharaan || 0),
                    produksi: totals.breakdown_pengeluaran.produksi + (month.breakdown_pengeluaran?.produksi || 0),
                    gaji_produksi: totals.breakdown_pengeluaran.gaji_produksi + (month.breakdown_pengeluaran?.gaji_produksi || 0),
                    gaji_driver: totals.breakdown_pengeluaran.gaji_driver + (month.breakdown_pengeluaran?.gaji_driver || 0),
                }
            }),
            { 
                total_pemasukan: 0, 
                total_pengeluaran: 0, 
                breakdown_pengeluaran: {
                    keuangan_eksternal: 0,
                    pengadaan: 0,
                    pemeliharaan: 0,
                    produksi: 0,
                    gaji_produksi: 0,
                    gaji_driver: 0
                }
            }
        );
    };

    useEffect(() => {
        generateAvailableYears();
    }, []);

    useEffect(() => {
        if (selectedYear) {
            fetchMonthlyData();
        }
    }, [selectedYear]);

    const yearlyTotals = calculateYearlyTotals();

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold dark:text-white-light flex items-center gap-2">
                    <IconCalendar className="w-6 h-6" />
                    Laporan Bulanan
                </h2>
            </div>

            {/* Year Selector & Summary */}
            <div className="panel">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <label className="font-semibold">Pilih Tahun:</label>
                        <select 
                            value={selectedYear} 
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="form-select w-32"
                        >
                            {availableYears.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-green-50 dark:bg-green-900 p-3 rounded-lg text-center">
                            <div className="text-sm text-green-600 dark:text-green-400 font-medium">Total Pemasukan</div>
                            <div className="text-lg font-bold text-green-700 dark:text-green-300">
                                {formatCurrency(yearlyTotals.total_pemasukan)}
                            </div>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900 p-3 rounded-lg">
                            <div className="text-sm text-red-600 dark:text-red-400 font-medium text-center mb-2">Total Pengeluaran</div>
                            <div className="text-lg font-bold text-red-700 dark:text-red-300 text-center mb-2">
                                {formatCurrency(yearlyTotals.total_pengeluaran)}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 border-t border-red-200 dark:border-red-700 pt-2">
                                <div className="flex justify-between">
                                    <span>• Keuangan:</span>
                                    <span>{formatCurrency(yearlyTotals.breakdown_pengeluaran.keuangan_eksternal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>• Pengadaan:</span>
                                    <span>{formatCurrency(yearlyTotals.breakdown_pengeluaran.pengadaan)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>• Pemeliharaan:</span>
                                    <span>{formatCurrency(yearlyTotals.breakdown_pengeluaran.pemeliharaan)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>• Produksi:</span>
                                    <span>{formatCurrency(yearlyTotals.breakdown_pengeluaran.produksi)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>• Gaji Karyawan:</span>
                                    <span>{formatCurrency(yearlyTotals.breakdown_pengeluaran.gaji_produksi)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>• Gaji Driver:</span>
                                    <span>{formatCurrency(yearlyTotals.breakdown_pengeluaran.gaji_driver)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Monthly Data Table */}
                <div className="overflow-x-auto">
                    <table className="table-hover">
                        <thead>
                            <tr>
                                <th>Bulan</th>
                                <th>
                                    <div className="flex items-center gap-1">
                                        Total Pemasukan
                                        <span className="text-xs text-gray-500" title="Hover untuk melihat rincian">ⓘ</span>
                                    </div>
                                </th>
                                <th>
                                    <div className="flex items-center gap-1">
                                        Total Pengeluaran
                                        <span className="text-xs text-gray-500" title="Hover untuk melihat rincian">ⓘ</span>
                                    </div>
                                </th>
                                <th className="text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlyData.map((month) => (
                                <tr key={month.month} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td>
                                        <div className="font-semibold">{month.monthName}</div>
                                        <div className="text-sm text-gray-500">{selectedYear}</div>
                                    </td>
                                    <td>
                                        <div className="group relative">
                                            <span className="font-bold text-green-600 cursor-help">
                                                {formatCurrency(month.total_pemasukan)}
                                            </span>
                                            {month.breakdown_pemasukan && (
                                                <div className="hidden group-hover:block absolute z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl p-4 min-w-[250px] left-0 top-full mt-2">
                                                    <div className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Rincian Pemasukan:</div>
                                                    <div className="space-y-1 text-xs">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600 dark:text-gray-400">• Keuangan Eksternal:</span>
                                                            <span className="font-medium">{formatCurrency(month.breakdown_pemasukan.keuangan_eksternal)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600 dark:text-gray-400">• Penjualan:</span>
                                                            <span className="font-medium">{formatCurrency(month.breakdown_pemasukan.penjualan)}</span>
                                                        </div>
                                                        <div className="border-t border-gray-300 dark:border-gray-600 mt-2 pt-2 flex justify-between font-bold">
                                                            <span>Total:</span>
                                                            <span className="text-green-600">{formatCurrency(month.total_pemasukan)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="group relative">
                                            <span className="font-bold text-red-600 cursor-help">
                                                {formatCurrency(month.total_pengeluaran)}
                                            </span>
                                            {month.breakdown_pengeluaran && (
                                                <div className="hidden group-hover:block absolute z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl p-4 min-w-[280px] left-0 top-full mt-2">
                                                    <div className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Rincian Pengeluaran:</div>
                                                    <div className="space-y-1 text-xs">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600 dark:text-gray-400">• Keuangan Eksternal:</span>
                                                            <span className="font-medium">{formatCurrency(month.breakdown_pengeluaran.keuangan_eksternal)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600 dark:text-gray-400">• Pengadaan Bahan:</span>
                                                            <span className="font-medium">{formatCurrency(month.breakdown_pengeluaran.pengadaan)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600 dark:text-gray-400">• Pemeliharaan:</span>
                                                            <span className="font-medium">{formatCurrency(month.breakdown_pengeluaran.pemeliharaan)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600 dark:text-gray-400">• Biaya Produksi:</span>
                                                            <span className="font-medium">{formatCurrency(month.breakdown_pengeluaran.produksi)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600 dark:text-gray-400">• Gaji Produksi:</span>
                                                            <span className="font-medium">{formatCurrency(month.breakdown_pengeluaran.gaji_produksi || 0)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600 dark:text-gray-400">• Gaji Driver:</span>
                                                            <span className="font-medium">{formatCurrency(month.breakdown_pengeluaran.gaji_driver || 0)}</span>
                                                        </div>
                                                        <div className="border-t border-gray-300 dark:border-gray-600 mt-2 pt-2 flex justify-between font-bold">
                                                            <span>Total:</span>
                                                            <span className="text-red-600">{formatCurrency(month.total_pengeluaran)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="text-center">
                                        <div className="flex justify-center gap-2">
                                            <Link
                                                to={`/keuangan/laporan/detail/${selectedYear}/${month.month}`}
                                                className="btn btn-sm btn-outline-warning gap-1"
                                            >
                                                <IconEye className="w-4 h-4" />
                                                Eksternal
                                            </Link>
                                            <Link
                                                to={`/keuangan/laporan-terpadu/detail/${selectedYear}/${month.month}`}
                                                className="btn btn-sm btn-outline-success gap-1"
                                            >
                                                <IconEye className="w-4 h-4" />
                                                Terpadu
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Empty State */}
                {monthlyData.length === 0 && (
                    <div className="text-center py-8">
                        <IconCalendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">Tidak ada data transaksi untuk tahun {selectedYear}</p>
                        <p className="text-gray-400">Pilih tahun lain atau mulai tambahkan transaksi</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LaporanBulanan;