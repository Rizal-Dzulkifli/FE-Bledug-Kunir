import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../../contexts/AuthContext';
import { KeuanganEksternalService, KeuanganEksternal } from '../../services/KeuanganEksternalService';
import IconSave from '../../components/Icon/IconSave';
import IconX from '../../components/Icon/IconX';

const KeuanganForm = () => {
    const { state: authState } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    // Form state
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        tanggal: new Date().toISOString().split('T')[0],
        deskripsi: '',
        biaya: '',
        status: 'keluar' as 'keluar' | 'masuk',
        kategori: 'operasional' as 'operasional' | 'investasi' | 'penjualan' | 'pembelian' | 'lainnya',
        referensi: '',
    });

    // Validation errors
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Load data for edit
    useEffect(() => {
        if (isEdit && id) {
            loadTransaction(parseInt(id));
        }
    }, [id, isEdit]);

    const loadTransaction = async (transactionId: number) => {
        try {
            setLoading(true);
            const response = await KeuanganEksternalService.getTransaksiById(transactionId);
            
            if (response.data) {
                const data = response.data;
                setFormData({
                    tanggal: data.tanggal.split('T')[0], // Convert to date input format
                    deskripsi: data.deskripsi,
                    biaya: data.biaya.toString(),
                    status: data.status,
                    kategori: data.kategori,
                    referensi: data.referensi || '',
                });
            }
        } catch (error) {
            console.error('Error loading transaction:', error);
            Swal.fire('Error', 'Gagal memuat data transaksi', 'error');
            navigate('/keuangan/transaksi');
        } finally {
            setLoading(false);
        }
    };

    // Handle form input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.tanggal) {
            newErrors.tanggal = 'Tanggal harus diisi';
        }

        if (!formData.deskripsi.trim()) {
            newErrors.deskripsi = 'Deskripsi harus diisi';
        }

        if (!formData.biaya || parseFloat(formData.biaya) <= 0) {
            newErrors.biaya = 'Biaya harus diisi dan lebih dari 0';
        }

        if (!formData.status) {
            newErrors.status = 'Status harus dipilih';
        }

        if (!formData.kategori) {
            newErrors.kategori = 'Kategori harus dipilih';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            
            const submitData = {
                ...formData,
                biaya: parseFloat(formData.biaya),
                user_id: authState.user?.user_id || 1, // Default to admin if no user
                referensi: formData.referensi || undefined,
            };

            if (isEdit && id) {
                await KeuanganEksternalService.updateTransaksi(parseInt(id), submitData);
                Swal.fire('Berhasil', 'Transaksi berhasil diperbarui', 'success');
            } else {
                await KeuanganEksternalService.createTransaksi(submitData);
                Swal.fire('Berhasil', 'Transaksi berhasil ditambahkan', 'success');
            }

            navigate('/keuangan/transaksi');
        } catch (error) {
            console.error('Error saving transaction:', error);
            Swal.fire('Error', 'Gagal menyimpan transaksi', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Format currency display
    const formatCurrency = (value: string) => {
        const numValue = parseFloat(value.replace(/[^\d]/g, ''));
        if (isNaN(numValue)) return '';
        return new Intl.NumberFormat('id-ID').format(numValue);
    };

    return (
        <div className="panel">
            <div className="flex items-center justify-between mb-5">
                <h5 className="font-semibold text-lg dark:text-white-light">
                    {isEdit ? 'Edit Transaksi' : 'Tambah Transaksi'} Keuangan Eksternal
                </h5>
                <Link 
                    to="/keuangan/transaksi" 
                    className="btn btn-outline-danger gap-2"
                >
                    <IconX className="w-4 h-4" />
                    Batal
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Tanggal */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Tanggal <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                name="tanggal"
                                value={formData.tanggal}
                                onChange={handleChange}
                                className={`form-input ${errors.tanggal ? 'border-red-500' : ''}`}
                                required
                            />
                            {errors.tanggal && (
                                <p className="text-red-500 text-sm mt-1">{errors.tanggal}</p>
                            )}
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Status <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className={`form-select ${errors.status ? 'border-red-500' : ''}`}
                                required
                            >
                                <option value="masuk">Masuk (Pemasukan)</option>
                                <option value="keluar">Keluar (Pengeluaran)</option>
                            </select>
                            {errors.status && (
                                <p className="text-red-500 text-sm mt-1">{errors.status}</p>
                            )}
                        </div>

                        {/* Kategori */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Kategori <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="kategori"
                                value={formData.kategori}
                                onChange={handleChange}
                                className={`form-select ${errors.kategori ? 'border-red-500' : ''}`}
                                required
                            >
                                <option value="operasional">Operasional</option>
                                <option value="investasi">Investasi</option>
                                <option value="penjualan">Penjualan</option>
                                <option value="pembelian">Pembelian</option>
                                <option value="lainnya">Lainnya</option>
                            </select>
                            {errors.kategori && (
                                <p className="text-red-500 text-sm mt-1">{errors.kategori}</p>
                            )}
                        </div>

                        {/* Biaya */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Biaya <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                    Rp
                                </span>
                                <input
                                    type="number"
                                    name="biaya"
                                    value={formData.biaya}
                                    onChange={handleChange}
                                    placeholder="0"
                                    className={`form-input pl-12 ${errors.biaya ? 'border-red-500' : ''}`}
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                            {formData.biaya && (
                                <p className="text-sm text-gray-600 mt-1">
                                    {formatCurrency(formData.biaya)}
                                </p>
                            )}
                            {errors.biaya && (
                                <p className="text-red-500 text-sm mt-1">{errors.biaya}</p>
                            )}
                        </div>

                        {/* Referensi */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-2">
                                Referensi
                            </label>
                            <input
                                type="text"
                                name="referensi"
                                value={formData.referensi}
                                onChange={handleChange}
                                placeholder="Nomor referensi, kode transaksi, dll (opsional)"
                                className="form-input"
                            />
                        </div>
                    </div>

                    {/* Deskripsi */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Deskripsi <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            name="deskripsi"
                            value={formData.deskripsi}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Jelaskan detail transaksi..."
                            className={`form-textarea ${errors.deskripsi ? 'border-red-500' : ''}`}
                            required
                        />
                        {errors.deskripsi && (
                            <p className="text-red-500 text-sm mt-1">{errors.deskripsi}</p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-4 pt-6 border-t">
                        <Link 
                            to="/keuangan/transaksi" 
                            className="btn btn-outline-secondary"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary gap-2"
                        >
                            <IconSave className="w-4 h-4" />
                            {loading ? 'Menyimpan...' : (isEdit ? 'Update' : 'Simpan')}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default KeuanganForm;