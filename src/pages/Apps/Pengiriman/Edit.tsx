import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import IconArrowLeft from '../../../components/Icon/IconArrowLeft';
import IconSave from '../../../components/Icon/IconSave';
import { Icon } from '@iconify-icon/react';
import PengirimanService, { Pengiriman, Driver } from '../../../services/PengirimanService';

interface PengirimanForm {
    driver_id: number | null;
    tanggal_pengiriman: string;
    status_pengiriman: 'Dalam Perjalanan' | 'Selesai' | 'Gagal';
    catatan: string;
}

const EditPengiriman = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams();

    const [pengiriman, setPengiriman] = useState<Pengiriman | null>(null);
    const [driverList, setDriverList] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);

    const [formData, setFormData] = useState<PengirimanForm>({
        driver_id: null,
        tanggal_pengiriman: new Date().toISOString().split('T')[0],
        status_pengiriman: 'Dalam Perjalanan',
        catatan: ''
    });

    useEffect(() => {
        dispatch(setPageTitle('Edit Pengiriman'));
        loadInitialData();
        if (id) {
            fetchPengirimanDetail(id);
        }
    }, [dispatch, id]);

    const loadInitialData = async () => {
        try {
            const driverResponse = await PengirimanService.getDrivers();
            setDriverList(driverResponse.data);
        } catch (error: any) {
            console.error('Error loading drivers:', error);
            Swal.fire('Error', error.message || 'Gagal memuat data driver', 'error');
        }
    };

    const fetchPengirimanDetail = async (pengirimanId: string) => {
        try {
            setFetchLoading(true);
            const response = await PengirimanService.getPengirimanById(parseInt(pengirimanId));
            const pengirimanData = response.data;
            
            setPengiriman(pengirimanData);
            setFormData({
                driver_id: pengirimanData.driver_id,
                tanggal_pengiriman: pengirimanData.tanggal_pengiriman,
                status_pengiriman: pengirimanData.status_pengiriman,
                catatan: pengirimanData.catatan || ''
            });
        } catch (error: any) {
            console.error('Error fetching pengiriman detail:', error);
            Swal.fire('Error', error.message || 'Gagal memuat detail pengiriman', 'error');
            navigate('/apps/pengiriman');
        } finally {
            setFetchLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.driver_id) {
            Swal.fire('Error', 'Driver harus dipilih', 'error');
            return;
        }

        try {
            setLoading(true);
            
            await PengirimanService.updatePengiriman(parseInt(id!), {
                status_pengiriman: formData.status_pengiriman,
                catatan: formData.catatan || undefined
            });

            Swal.fire({
                title: 'Berhasil!',
                text: 'Pengiriman berhasil diperbarui',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            navigate('/apps/pengiriman');
        } catch (error: any) {
            console.error('Error updating pengiriman:', error);
            Swal.fire('Error', error.message || 'Gagal memperbarui pengiriman', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'driver_id' ? (value ? parseInt(value) : null) : value
        }));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    if (fetchLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Icon icon="eos-icons:loading" width="3rem" height="3rem" className="animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Memuat data pengiriman...</p>
                </div>
            </div>
        );
    }

    if (!pengiriman) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Icon icon="solar:close-circle-bold-duotone" width="4rem" height="4rem" className="mx-auto mb-4 text-danger" />
                    <p className="text-gray-600 text-lg">Pengiriman tidak ditemukan</p>
                    <Link to="/apps/pengiriman" className="btn btn-primary mt-4">
                        Kembali ke Daftar Pengiriman
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <Link to="/apps/pengiriman" className="btn btn-outline-primary">
                        <IconArrowLeft className="w-4 h-4" />
                        Kembali
                    </Link>
                    <h2 className="text-xl font-semibold">Edit Pengiriman</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Edit */}
                <div className="lg:col-span-2">
                    <div className="panel">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-2">Informasi Pengiriman</h3>
                            <p className="text-sm text-gray-600">Perbarui informasi pengiriman</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Status Pengiriman */}
                            <div>
                                <label className="form-label">Status Pengiriman <span className="text-danger">*</span></label>
                                <select
                                    name="status_pengiriman"
                                    value={formData.status_pengiriman}
                                    onChange={handleInputChange}
                                    className="form-select"
                                    required
                                >
                                    <option value="Dalam Perjalanan">Dalam Perjalanan</option>
                                    <option value="Selesai">Selesai</option>
                                    <option value="Gagal">Gagal</option>
                                </select>
                            </div>

                            {/* Catatan */}
                            <div>
                                <label className="form-label">Catatan</label>
                                <textarea
                                    name="catatan"
                                    value={formData.catatan}
                                    onChange={handleInputChange}
                                    className="form-textarea"
                                    rows={4}
                                    placeholder="Catatan tambahan untuk pengiriman..."
                                />
                            </div>

                            {/* Submit Button */}
                            <div className="flex gap-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-primary"
                                >
                                    {loading ? (
                                        <>
                                            <Icon icon="eos-icons:loading" width="16" height="16" className="animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <IconSave className="w-4 h-4" />
                                            Simpan Perubahan
                                        </>
                                    )}
                                </button>
                                <Link to="/apps/pengiriman" className="btn btn-outline-secondary">
                                    Batal
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Info Pengiriman */}
                <div className="lg:col-span-1">
                    <div className="panel">
                        <h3 className="text-lg font-semibold mb-4">Detail Pengiriman</h3>
                        <div className="space-y-4">
                            {/* Nomor Pesanan */}
                            <div>
                                <p className="text-sm text-gray-600">Nomor Pesanan</p>
                                <p className="font-semibold">{pengiriman.pesanan.no_pesanan}</p>
                            </div>

                            {/* Tanggal Pengiriman */}
                            <div>
                                <p className="text-sm text-gray-600">Tanggal Pengiriman</p>
                                <p className="font-semibold">{formatDate(pengiriman.tanggal_pengiriman)}</p>
                            </div>

                            {/* Pelanggan */}
                            <div>
                                <p className="text-sm text-gray-600">Pelanggan</p>
                                <p className="font-semibold">{pengiriman.pesanan.pelanggan.nama}</p>
                                <p className="text-sm text-gray-600 mt-1">{pengiriman.pesanan.pelanggan.alamat}</p>
                                {pengiriman.pesanan.pelanggan.no_telp && (
                                    <p className="text-sm text-gray-600">{pengiriman.pesanan.pelanggan.no_telp}</p>
                                )}
                            </div>

                            {/* Driver */}
                            <div>
                                <p className="text-sm text-gray-600">Driver</p>
                                <p className="font-semibold">{pengiriman.driver.nama}</p>
                                <p className="text-sm text-gray-600">{pengiriman.driver.email}</p>
                            </div>

                            {/* Total Harga Pesanan */}
                            <div>
                                <p className="text-sm text-gray-600">Total Harga</p>
                                <p className="font-semibold text-lg text-primary">
                                    {formatCurrency(pengiriman.pesanan.total_harga)}
                                </p>
                            </div>

                            {/* Gaji Driver */}
                            <div>
                                <p className="text-sm text-gray-600">Gaji Driver</p>
                                <p className="font-semibold text-lg text-green-600">
                                    {formatCurrency(pengiriman.gaji_driver)}
                                </p>
                                <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                                    pengiriman.gaji_dibayar 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {pengiriman.gaji_dibayar ? 'Sudah Dibayar' : 'Belum Dibayar'}
                                </span>
                            </div>

                            {/* Status Pesanan */}
                            <div>
                                <p className="text-sm text-gray-600">Status Pesanan</p>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    pengiriman.pesanan.status_pemesanan === 'Selesai' ? 'bg-success/20 text-success' :
                                    pengiriman.pesanan.status_pemesanan === 'Dikirim' ? 'bg-info/20 text-info' :
                                    pengiriman.pesanan.status_pemesanan === 'Diproses' ? 'bg-warning/20 text-warning' :
                                    'bg-gray-500/20 text-gray-600'
                                }`}>
                                    {pengiriman.pesanan.status_pemesanan}
                                </span>
                            </div>

                            {/* Items Pesanan */}
                            <div>
                                <p className="text-sm text-gray-600 mb-2">Items Pesanan</p>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {pengiriman.pesanan.detailPesanan?.map((detail, index) => (
                                        <div key={index} className="text-sm border-l-2 border-primary pl-3">
                                            <p className="font-medium">
                                                {detail.jenis_barang === 'barang_mentah' 
                                                    ? detail.barangMentah?.namaBarangMentah?.nama_barang_mentah 
                                                    : detail.produk?.namaProduk?.nama_produk
                                                }
                                            </p>
                                            <p className="text-gray-600">Qty: {detail.kuantitas}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditPengiriman;