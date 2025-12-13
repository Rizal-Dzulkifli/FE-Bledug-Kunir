import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import { Icon } from '@iconify-icon/react';
import { useAuth } from '../../../contexts/AuthContext';
import PengirimanService, { Pengiriman, GajiDriverReport, Driver } from '../../../services/PengirimanService';

const GajiDriverPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { state } = useAuth();

    const [pengirimanBelumBayar, setPengirimanBelumBayar] = useState<Pengiriman[]>([]);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [driverList, setDriverList] = useState<Driver[]>([]);
    const [selectedDriver, setSelectedDriver] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [payingLoading, setPayingLoading] = useState(false);
    const [totalGaji, setTotalGaji] = useState(0);
    const [totalPengiriman, setTotalPengiriman] = useState(0);

    useEffect(() => {
        dispatch(setPageTitle('Kelola Gaji Driver'));
        if (state.user?.role !== 'admin' && state.user?.role !== 'karyawan') {
            navigate('/apps/pengiriman');
            return;
        }
        fetchInitialData();
    }, [dispatch, navigate, state.user?.role]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [driversResponse, gajiResponse] = await Promise.all([
                PengirimanService.getDrivers(),
                PengirimanService.getGajiBelumDibayar()
            ]);

            setDriverList(driversResponse.data);
            
            if (gajiResponse.data.transaksi) {
                // Fetch detail pengiriman yang belum dibayar
                const pengirimanResponse = await PengirimanService.getAllPengiriman({
                    page: 1,
                    limit: 100, // Ambil semua data yang belum dibayar
                });

                const belumBayar = pengirimanResponse.data.data.filter(item => 
                    !item.gaji_dibayar && item.status_pengiriman === 'Selesai'
                );

                setPengirimanBelumBayar(belumBayar);
                setTotalGaji(gajiResponse.data.totalGaji);
                setTotalPengiriman(gajiResponse.data.totalPengiriman);
            }
        } catch (error: any) {
            console.error('Error fetching data:', error);
            Swal.fire('Error', error.message || 'Gagal memuat data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const filteredIds = getFilteredPengiriman().map(item => item.id);
            setSelectedItems(filteredIds);
        } else {
            setSelectedItems([]);
        }
    };

    const handleSelectItem = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedItems(prev => [...prev, id]);
        } else {
            setSelectedItems(prev => prev.filter(item => item !== id));
        }
    };

    const getFilteredPengiriman = () => {
        if (!selectedDriver) return pengirimanBelumBayar;
        return pengirimanBelumBayar.filter(item => item.driver_id === selectedDriver);
    };

    const getSelectedTotal = () => {
        const filtered = getFilteredPengiriman().filter(item => selectedItems.includes(item.id));
        return filtered.reduce((sum, item) => sum + item.gaji_driver, 0);
    };

    const handleBayarGaji = async () => {
        if (selectedItems.length === 0) {
            Swal.fire('Peringatan', 'Pilih minimal satu pengiriman untuk dibayar', 'warning');
            return;
        }

        const result = await Swal.fire({
            title: 'Konfirmasi Pembayaran Gaji',
            html: `
                <div class="text-left">
                    <p><strong>Jumlah Pengiriman:</strong> ${selectedItems.length} pengiriman</p>
                    <p><strong>Total Gaji:</strong> ${formatCurrency(getSelectedTotal())}</p>
                    <div class="mt-4">
                        <label for="catatan-gaji" class="block text-sm font-medium text-gray-700 mb-2">Catatan (opsional):</label>
                        <textarea id="catatan-gaji" class="form-textarea w-full" rows="3" placeholder="Catatan pembayaran..."></textarea>
                    </div>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, Bayar Sekarang',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#3085d6',
            preConfirm: () => {
                const catatanElement = document.getElementById('catatan-gaji') as HTMLTextAreaElement;
                return {
                    catatan: catatanElement?.value || ''
                };
            }
        });

        if (result.isConfirmed) {
            try {
                setPayingLoading(true);
                
                await PengirimanService.bayarGajiDriver(
                    selectedItems,
                    result.value?.catatan || 'Pembayaran gaji driver'
                );

                Swal.fire({
                    title: 'Berhasil!',
                    text: `Gaji untuk ${selectedItems.length} pengiriman berhasil dibayar`,
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });

                // Reset dan refresh data
                setSelectedItems([]);
                fetchInitialData();

            } catch (error: any) {
                console.error('Error paying salary:', error);
                Swal.fire('Error', error.message || 'Gagal membayar gaji driver', 'error');
            } finally {
                setPayingLoading(false);
            }
        }
    };

    const filteredPengiriman = getFilteredPengiriman();
    const isAllSelected = filteredPengiriman.length > 0 && 
        filteredPengiriman.every(item => selectedItems.includes(item.id));

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Icon icon="eos-icons:loading" width="3rem" height="3rem" className="animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Memuat data gaji driver...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <h2 className="text-xl font-semibold">Kelola Gaji Driver</h2>
                <button 
                    onClick={() => navigate('/apps/pengiriman')}
                    className="btn btn-outline-primary"
                >
                    <Icon icon="solar:arrow-left-bold" className="w-4 h-4 mr-2" />
                    Kembali
                </button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="panel">
                    <div className="flex items-center">
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-primary">Total Gaji Belum Dibayar</h3>
                            <p className="text-2xl font-bold">{formatCurrency(totalGaji)}</p>
                        </div>
                        <Icon icon="solar:wallet-money-bold-duotone" className="text-4xl text-primary" />
                    </div>
                </div>

                <div className="panel">
                    <div className="flex items-center">
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-success">Total Pengiriman Selesai</h3>
                            <p className="text-2xl font-bold">{totalPengiriman}</p>
                        </div>
                        <Icon icon="solar:delivery-bold-duotone" className="text-4xl text-success" />
                    </div>
                </div>

                <div className="panel">
                    <div className="flex items-center">
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-warning">Gaji Terpilih</h3>
                            <p className="text-2xl font-bold">{formatCurrency(getSelectedTotal())}</p>
                        </div>
                        <Icon icon="solar:check-square-bold-duotone" className="text-4xl text-warning" />
                    </div>
                </div>
            </div>

            {/* Filter & Actions */}
            <div className="panel mb-6">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div>
                            <label className="form-label">Filter Driver:</label>
                            <select
                                value={selectedDriver || ''}
                                onChange={(e) => {
                                    setSelectedDriver(e.target.value ? parseInt(e.target.value) : null);
                                    setSelectedItems([]); // Reset selection when filtering
                                }}
                                className="form-select w-48"
                            >
                                <option value="">Semua Driver</option>
                                {driverList.map(driver => (
                                    <option key={driver.user_id} value={driver.user_id}>
                                        {driver.nama}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleBayarGaji}
                            disabled={selectedItems.length === 0 || payingLoading}
                            className="btn btn-success"
                        >
                            {payingLoading ? (
                                <>
                                    <Icon icon="eos-icons:loading" className="animate-spin mr-2" width="16" />
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    <Icon icon="solar:wallet-money-bold" className="mr-2" width="16" />
                                    Bayar Gaji ({selectedItems.length})
                                </>
                            )}
                        </button>
                        <button
                            onClick={fetchInitialData}
                            className="btn btn-outline-info"
                        >
                            <Icon icon="solar:refresh-bold" className="mr-2" width="16" />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="panel p-0 border-0 overflow-hidden">
                <div className="table-responsive">
                    <table className="table-striped table-hover">
                        <thead>
                            <tr>
                                <th className="w-12">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                        className="form-checkbox"
                                        disabled={filteredPengiriman.length === 0}
                                    />
                                </th>
                                <th>No. Pesanan</th>
                                <th>Driver</th>
                                <th>Pelanggan</th>
                                <th>Tanggal Pengiriman</th>
                                <th>Gaji Driver</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPengiriman.length > 0 ? (
                                filteredPengiriman.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.includes(item.id)}
                                                onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                                                className="form-checkbox"
                                            />
                                        </td>
                                        <td>
                                            <div className="font-medium">{item.pesanan.no_pesanan}</div>
                                            <div className="text-xs text-gray-500">
                                                #{item.id.toString().padStart(4, '0')}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="font-medium">{item.driver.nama}</div>
                                            <div className="text-xs text-gray-500">{item.driver.email}</div>
                                        </td>
                                        <td>
                                            <div className="font-medium">{item.pesanan.pelanggan.nama}</div>
                                            {item.pesanan.pelanggan.no_telp && (
                                                <div className="text-xs text-gray-500">{item.pesanan.pelanggan.no_telp}</div>
                                            )}
                                        </td>
                                        <td>{formatDate(item.tanggal_pengiriman)}</td>
                                        <td>
                                            <div className="font-semibold text-primary">
                                                {formatCurrency(item.gaji_driver)}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                                Selesai
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="text-center py-8">
                                        <Icon icon="solar:wallet-money-bold-duotone" className="text-6xl text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500">
                                            {selectedDriver 
                                                ? 'Tidak ada gaji yang belum dibayar untuk driver ini'
                                                : 'Semua gaji driver sudah dibayar'
                                            }
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default GajiDriverPage;