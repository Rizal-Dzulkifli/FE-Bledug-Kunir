import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import IconX from '../../../components/Icon/IconX';
import IconSave from '../../../components/Icon/IconSave';
import IconPlus from '../../../components/Icon/IconPlus';
import IconArrowLeft from '../../../components/Icon/IconArrowLeft';
import IconEdit from '../../../components/Icon/IconEdit';
import { buildApiUrl, getAuthHeaders } from '../../../config/api';

const Edit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);

    // Form state
    const [formData, setFormData] = useState({
        mode_produksi: 'existing_product',
        id_produk_detail: null, // untuk mode existing_product
        id_nama_produk: null, // untuk mode new_product
        harga_jual_target: 0,
        deskripsi_produk: '',
        tgl_tenggat: '',
        deskripsi: '',
    });

    // Data sources
    const [produkExistingList, setProdukExistingList] = useState<any[]>([]); // table produks
    const [namaBarangList, setNamaBarangList] = useState<any[]>([]); // table nama_produks
    const [barangMentahList, setBarangMentahList] = useState<any[]>([]);
    const [karyawanList, setKaryawanList] = useState<any[]>([]);
    const [assetList, setAssetList] = useState<any[]>([]);

    // Detail arrays
    const [detailBahan, setDetailBahan] = useState<any[]>([
        {
            id: 1,
            id_barangmentah: null,
            berat: 0,
        },
    ]);

    const [detailProduksi, setDetailProduksi] = useState<any[]>([
        {
            id: 1,
            id_user: null,
            id_asset: null,
        },
    ]);

    useEffect(() => {
        dispatch(setPageTitle('Edit Produksi'));

        if (!id) {
            Swal.fire('Error', 'ID Produksi tidak ditemukan', 'error');
            navigate('/apps/produksi');
            return;
        }

        const loadAllData = async () => {
            setLoading(true);
            try {
                // Load all data simultaneously
                await Promise.all([
                    loadProdukExistingList(),
                    loadNamaBarangList(),
                    loadBarangMentahList(),
                    loadKaryawanList(),
                    loadAssetList(),
                    loadProduksiDetail(id)
                ]);
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadAllData();
    }, [id]);

    const loadProduksiDetail = async (produksiId: string) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                Swal.fire('Error', 'Authentication token is missing', 'error');
                return;
            }

            const response = await fetch(buildApiUrl(`produksi/${produksiId}`), {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                const result = await response.json();
                const data = result.data;
                
                console.log('Loaded produksi data for edit:', data);
                
                // Set form data
                setFormData({
                    mode_produksi: data.mode_produksi,
                    id_produk_detail: data.mode_produksi === 'existing_product' ? data.id_produk_detail : null,
                    id_nama_produk: data.mode_produksi === 'new_product' ? data.id_nama_produk : null,
                    harga_jual_target: data.harga_jual_target ? parseFloat(data.harga_jual_target) : 0,
                    deskripsi_produk: data.deskripsi_produk || '',
                    tgl_tenggat: data.tgl_tenggat ? data.tgl_tenggat.split('T')[0] : '',
                    deskripsi: data.deskripsi || '',
                });

                // Set detail bahan
                if (data.detailBahan && data.detailBahan.length > 0) {
                    setDetailBahan(data.detailBahan.map((item: any, index: number) => ({
                        id: index + 1,
                        id_barangmentah: item.id_barangmentah,
                        berat: item.berat,
                    })));
                }

                // Set detail produksi
                if (data.detailProduksi && data.detailProduksi.length > 0) {
                    setDetailProduksi(data.detailProduksi.map((item: any, index: number) => ({
                        id: index + 1,
                        id_user: item.id_user,
                        id_asset: item.id_asset,
                    })));
                }
            } else {
                throw new Error('Failed to fetch produksi detail');
            }
        } catch (error) {
            console.error('Error loading produksi detail:', error);
            Swal.fire('Error', 'Gagal memuat detail produksi untuk edit', 'error');
            navigate('/apps/produksi');
            throw error; // Re-throw to be caught by Promise.all
        }
    };

    const loadProdukExistingList = async () => {
        try {
            // API call untuk mendapatkan list produk existing dari table produks
            const token = localStorage.getItem('token');
            if (!token) {
                Swal.fire('Error', 'Authentication token is missing', 'error');
                return;
            }

            const response = await fetch(buildApiUrl('produk'), {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                const data = await response.json();
                const produkData = data.data?.data || data.data || data;
                console.log('Produk Existing Data:', produkData);
                setProdukExistingList(produkData);
            } else {
                throw new Error('Failed to fetch produk existing list');
            }
        } catch (error) {
            console.error('Error loading produk existing list:', error);
            setProdukExistingList([]);
            // Don't show error popup for dropdown data loading
        }
    };

    const loadNamaBarangList = async () => {
        try {
            // API call untuk mendapatkan list nama produk dari table nama_produks
            const token = localStorage.getItem('token');
            if (!token) {
                Swal.fire('Error', 'Authentication token is missing', 'error');
                return;
            }

            const response = await fetch(buildApiUrl('nama-produk'), {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Nama Barang Data:', data);
                setNamaBarangList(data.data || []);
            } else {
                throw new Error('Failed to fetch nama barang list');
            }
        } catch (error) {
            console.error('Error loading nama barang list:', error);
            setNamaBarangList([]);
            // Don't show error popup for dropdown data loading
        }
    };

    const loadBarangMentahList = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                Swal.fire('Error', 'Authentication token is missing', 'error');
                return;
            }

            const response = await fetch(buildApiUrl('barang-mentah'), {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Barang Mentah Data:', data);
                // Handle nested data structure: data.data.data
                const barangMentahData = data.data?.data || data.data || [];
                setBarangMentahList(barangMentahData);
            } else {
                throw new Error('Failed to fetch barang mentah list');
            }
        } catch (error) {
            console.error('Error loading barang mentah list:', error);
            setBarangMentahList([]);
            // Don't show error popup for dropdown data loading
        }
    };

    const loadKaryawanList = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                Swal.fire('Error', 'Authentication token is missing', 'error');
                return;
            }

            const response = await fetch(buildApiUrl('users'), {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                const data = await response.json();
                const userData = data.data || data;
                console.log('User Data:', userData);

                // Filter hanya user dengan role karyawan
                const karyawanData = userData.filter((user: any) => user.role === 'karyawan');
                console.log('Karyawan Data:', karyawanData);
                setKaryawanList(karyawanData);
            } else {
                throw new Error('Failed to fetch karyawan list');
            }
        } catch (error) {
            console.error('Error loading karyawan list:', error);
            setKaryawanList([]);
            // Don't show error popup for dropdown data loading
        }
    };

    const loadAssetList = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                Swal.fire('Error', 'Authentication token is missing', 'error');
                return;
            }

            const response = await fetch(buildApiUrl('assets?limit=1000'), {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                const data = await response.json();
                const assetData = data.data?.data || data.data || data;

                console.log('Asset Raw Data:', data);
                console.log('Asset Processed Data:', assetData);

                // Transform data untuk konsistensi nama field
                const transformedData = assetData.map((item: any) => ({
                    ...item,
                    nama_asset: item.asset || item.nama_asset, // Gunakan field 'asset' dari API
                    id_asset: item.id_asset || item.id,
                }));

                console.log('Asset Transformed Data:', transformedData);
                setAssetList(transformedData);
            } else {
                throw new Error('Failed to fetch asset list');
            }
        } catch (error) {
            console.error('Error loading asset list:', error);
            setAssetList([]);
            // Don't show error popup for dropdown data loading
        }
    };

    const handleFormChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Reset related fields when mode changes
        if (field === 'mode_produksi') {
            if (value === 'existing_product') {
                setFormData(prev => ({
                    ...prev,
                    mode_produksi: value,
                    id_nama_produk: null,
                    harga_jual_target: 0,
                    deskripsi_produk: '',
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    mode_produksi: value,
                    id_produk_detail: null,
                }));
            }
        }
    };

    const addDetailBahan = () => {
        const newId = Math.max(...detailBahan.map(item => item.id), 0) + 1;
        setDetailBahan(prev => [...prev, {
            id: newId,
            id_barangmentah: null,
            berat: 0,
        }]);
    };

    const removeDetailBahan = (id: number) => {
        if (detailBahan.length > 1) {
            setDetailBahan(prev => prev.filter(item => item.id !== id));
        }
    };

    const updateDetailBahan = (id: number, field: string, value: any) => {
        setDetailBahan(prev => prev.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const addDetailProduksi = () => {
        const newId = Math.max(...detailProduksi.map(item => item.id), 0) + 1;
        setDetailProduksi(prev => [...prev, {
            id: newId,
            id_user: null,
            id_asset: null,
        }]);
    };

    const removeDetailProduksi = (id: number) => {
        if (detailProduksi.length > 1) {
            setDetailProduksi(prev => prev.filter(item => item.id !== id));
        }
    };

    const updateDetailProduksi = (id: number, field: string, value: any) => {
        setDetailProduksi(prev => prev.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    // Function untuk mendapatkan karyawan yang tersedia (belum dipilih di baris lain)
    const getAvailableKaryawan = (currentRowIndex: number) => {
        const selectedKaryawanIds = detailProduksi
            .map((item, index) => index !== currentRowIndex ? item.id_user : null)
            .filter(id => id !== null);
        
        return karyawanList.filter(
            (karyawan: any) => !selectedKaryawanIds.includes(karyawan.user_id)
        );
    };

    // Function untuk mendapatkan asset/mesin yang tersedia (belum dipilih di baris lain)
    const getAvailableAssets = (currentRowIndex: number) => {
        const selectedAssetIds = detailProduksi
            .map((item, index) => index !== currentRowIndex ? item.id_asset : null)
            .filter(id => id !== null);
        
        return assetList.filter(
            (asset: any) => !selectedAssetIds.includes(asset.id_asset)
        );
    };

    const handleSubmit = async () => {
        try {
            // Validasi form data
            if (formData.mode_produksi === 'existing_product' && !formData.id_produk_detail) {
                Swal.fire('Error', 'Pilih produk existing terlebih dahulu', 'error');
                return;
            }

            if (formData.mode_produksi === 'new_product') {
                if (!formData.id_nama_produk || !formData.harga_jual_target || formData.harga_jual_target <= 0) {
                    Swal.fire('Error', 'Nama produk dan harga jual target harus diisi untuk produk baru', 'error');
                    return;
                }
            }

            if (!formData.tgl_tenggat) {
                Swal.fire('Error', 'Tanggal tenggat harus diisi', 'error');
                return;
            }

            // Validasi detail bahan
            const invalidBahan = detailBahan.find((item) => !item.id_barangmentah || item.berat <= 0);
            if (invalidBahan) {
                Swal.fire('Error', 'Semua detail bahan harus diisi dengan lengkap', 'error');
                return;
            }

            // Validasi detail produksi
            const invalidProduksi = detailProduksi.find((item) => !item.id_user || !item.id_asset);
            if (invalidProduksi) {
                Swal.fire('Error', 'Semua detail produksi (karyawan dan asset) harus diisi', 'error');
                return;
            }

            // Prepare data untuk API (menggunakan format yang sesuai dengan backend baru)
            const submitData = {
                mode_produksi: formData.mode_produksi,
                ...(formData.mode_produksi === 'existing_product'
                    ? { id_produk_detail: formData.id_produk_detail }
                    : {
                          id_nama_produk: formData.id_nama_produk,
                          harga_jual_target: formData.harga_jual_target,
                          deskripsi_produk: formData.deskripsi_produk,
                      }),
                tgl_tenggat: formData.tgl_tenggat,
                deskripsi: formData.deskripsi || undefined,
                detailBahan: detailBahan.map((item) => ({
                    id_barangmentah: item.id_barangmentah,
                    berat: item.berat,
                })),
                detailProduksi: detailProduksi.map((item) => ({
                    id_user: item.id_user,
                    id_asset: item.id_asset,
                })),
            };

            console.log('Data to update:', submitData);

            // API call untuk update produksi
            const token = localStorage.getItem('token');
            if (!token) {
                Swal.fire('Error', 'Authentication token is missing', 'error');
                return;
            }

            const response = await fetch(buildApiUrl(`produksi/${id}`), {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(submitData),
            });

            if (response.ok) {
                const result = await response.json();
                Swal.fire({
                    title: 'Success!',
                    text: result.message || 'Produksi berhasil diperbarui dengan rollback mechanism',
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
                navigate('/apps/produksi');
            } else {
                const errorData = await response.json();
                // Handle specific error cases
                if (errorData.message && errorData.message.includes('tidak cukup')) {
                    Swal.fire({
                        title: 'Stok Tidak Cukup!',
                        text: errorData.message,
                        icon: 'warning',
                        confirmButtonText: 'OK'
                    });
                } else {
                    throw new Error(errorData.message || 'Failed to update produksi');
                }
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat memperbarui produksi';
            Swal.fire('Error', errorMessage, 'error');
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <IconEdit className="w-5 h-5" />
                    <h2 className="text-xl font-semibold">Edit Produksi</h2>
                </div>
                <Link to="/apps/produksi" className="btn btn-outline-primary">
                    <IconArrowLeft className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                    Kembali
                </Link>
            </div>

            {/* Debug Information */}
 

            <div className="panel">
                {/* Mode Produksi */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Mode Produksi</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="mode_produksi"
                                    value="existing_product"
                                    checked={formData.mode_produksi === 'existing_product'}
                                    onChange={(e) => handleFormChange('mode_produksi', e.target.value)}
                                    className="form-radio"
                                />
                                <span className="text-white-dark ml-2">Produk Existing</span>
                            </label>
                        </div>
                        <div>
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="mode_produksi"
                                    value="new_product"
                                    checked={formData.mode_produksi === 'new_product'}
                                    onChange={(e) => handleFormChange('mode_produksi', e.target.value)}
                                    className="form-radio"
                                />
                                <span className="text-white-dark ml-2">Produk Baru</span>
                            </label>
                        </div>
                    </div>
                </div>

                <hr className="border-white-light dark:border-[#1b2e4b] my-6" />

                {/* Form Produk */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Informasi Produk</h3>
                    
                    {formData.mode_produksi === 'existing_product' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="id_produk_detail">Pilih Produk Existing *</label>
                                <select
                                    id="id_produk_detail"
                                    value={formData.id_produk_detail || ''}
                                    onChange={(e) => handleFormChange('id_produk_detail', parseInt(e.target.value) || null)}
                                    className="form-select"
                                    required
                                >
                                    <option value="">Pilih Produk...</option>
                                    {Array.isArray(produkExistingList) && produkExistingList.map((produk) => (
                                        <option key={produk.id_produk_detail} value={produk.id_produk_detail}>
                                            {produk.namaProduk?.nama_produk} - {produk.kode} ({produk.berat_produk}kg)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="id_nama_produk">Nama Produk *</label>
                                <select
                                    id="id_nama_produk"
                                    value={formData.id_nama_produk || ''}
                                    onChange={(e) => handleFormChange('id_nama_produk', parseInt(e.target.value) || null)}
                                    className="form-select"
                                    required
                                >
                                    <option value="">Pilih Nama Produk...</option>
                                    {Array.isArray(namaBarangList) && namaBarangList.map((nama) => (
                                        <option key={nama.id_produk} value={nama.id_produk}>
                                            {nama.nama_produk} ({nama.kode_produk})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="harga_jual_target">Harga Jual Target *</label>
                                <input
                                    id="harga_jual_target"
                                    type="number"
                                    value={formData.harga_jual_target}
                                    onChange={(e) => handleFormChange('harga_jual_target', parseFloat(e.target.value) || 0)}
                                    className="form-input"
                                    placeholder="0"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="deskripsi_produk">Deskripsi Produk</label>
                                <textarea
                                    id="deskripsi_produk"
                                    value={formData.deskripsi_produk}
                                    onChange={(e) => handleFormChange('deskripsi_produk', e.target.value)}
                                    className="form-textarea"
                                    rows={3}
                                    placeholder="Deskripsi produk..."
                                />
                            </div>
                        </div>
                    )}
                </div>

                <hr className="border-white-light dark:border-[#1b2e4b] my-6" />

                {/* Form General */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Informasi Umum</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="tgl_tenggat">Tanggal Tenggat *</label>
                            <input
                                id="tgl_tenggat"
                                type="date"
                                value={formData.tgl_tenggat}
                                onChange={(e) => handleFormChange('tgl_tenggat', e.target.value)}
                                className="form-input"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="deskripsi">Deskripsi</label>
                            <textarea
                                id="deskripsi"
                                value={formData.deskripsi}
                                onChange={(e) => handleFormChange('deskripsi', e.target.value)}
                                className="form-textarea"
                                rows={3}
                                placeholder="Deskripsi produksi..."
                            />
                        </div>
                    </div>
                </div>

                <hr className="border-white-light dark:border-[#1b2e4b] my-6" />

                {/* Detail Bahan */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Detail Bahan Baku</h3>
                    <div className="table-responsive">
                        <table className="table-striped">
                            <thead>
                                <tr>
                                    <th>Barang Mentah</th>
                                    <th>Berat (kg)</th>
                                    <th className="w-20">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {detailBahan.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <select
                                                value={item.id_barangmentah || ''}
                                                onChange={(e) => updateDetailBahan(item.id, 'id_barangmentah', parseInt(e.target.value) || null)}
                                                className="form-select"
                                                required
                                            >
                                                <option value="">Pilih Barang Mentah...</option>
                                                {Array.isArray(barangMentahList) && barangMentahList.map((barang) => (
                                                    <option key={barang.id_barangmentah} value={barang.id_barangmentah}>
                                                        {barang.namaBarangMentah?.nama_barang_mentah} ({barang.kode}) - {barang.berat_mentah}kg tersedia
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                value={item.berat}
                                                onChange={(e) => updateDetailBahan(item.id, 'berat', parseFloat(e.target.value) || 0)}
                                                className="form-input"
                                                placeholder="0"
                                                min="0"
                                                step="0.1"
                                                required
                                            />
                                        </td>
                                        <td>
                                            <button type="button" onClick={() => removeDetailBahan(item.id)} className="btn btn-danger btn-sm" disabled={detailBahan.length === 1}>
                                                <IconX className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-between sm:flex-row flex-col mt-6 px-4">
                        <button type="button" className="btn btn-primary btn-sm" onClick={addDetailBahan}>
                            <IconPlus className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                            Tambah Bahan
                        </button>
                    </div>
                </div>

                <hr className="border-white-light dark:border-[#1b2e4b] my-6" />

                {/* Detail Produksi */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Detail Produksi (Karyawan & Asset)</h3>
                    <div className="table-responsive">
                        <table className="table-striped">
                            <thead>
                                <tr>
                                    <th>Karyawan</th>
                                    <th>Asset/Mesin</th>
                                    <th className="w-20">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {detailProduksi.map((item, index) => (
                                    <tr key={item.id}>
                                        <td>
                                            <select
                                                value={item.id_user || ''}
                                                onChange={(e) => updateDetailProduksi(item.id, 'id_user', parseInt(e.target.value) || null)}
                                                className="form-select"
                                                required
                                            >
                                                <option value="">Pilih Karyawan...</option>
                                                {Array.isArray(karyawanList) && getAvailableKaryawan(index).map((karyawan) => (
                                                    <option key={karyawan.user_id} value={karyawan.user_id}>
                                                        {karyawan.nama} ({karyawan.role})
                                                    </option>
                                                ))}
                                                {/* Show currently selected item even if it would be filtered out */}
                                                {item.id_user && !getAvailableKaryawan(index).find((k: any) => k.user_id === item.id_user) && (
                                                    karyawanList.filter((k: any) => k.user_id === item.id_user).map((karyawan: any) => (
                                                        <option key={karyawan.user_id} value={karyawan.user_id}>
                                                            {karyawan.nama} ({karyawan.role})
                                                        </option>
                                                    ))
                                                )}
                                            </select>
                                        </td>
                                        <td>
                                            <select
                                                value={item.id_asset || ''}
                                                onChange={(e) => updateDetailProduksi(item.id, 'id_asset', parseInt(e.target.value) || null)}
                                                className="form-select"
                                                required
                                            >
                                                <option value="">Pilih Asset...</option>
                                                {Array.isArray(assetList) && getAvailableAssets(index).map((asset) => (
                                                    <option key={asset.id_asset} value={asset.id_asset}>
                                                        {asset.asset}
                                                    </option>
                                                ))}
                                                {/* Show currently selected item even if it would be filtered out */}
                                                {item.id_asset && !getAvailableAssets(index).find((a: any) => a.id_asset === item.id_asset) && (
                                                    assetList.filter((a: any) => a.id_asset === item.id_asset).map((asset: any) => (
                                                        <option key={asset.id_asset} value={asset.id_asset}>
                                                            {asset.asset}
                                                        </option>
                                                    ))
                                                )}
                                            </select>
                                        </td>
                                        <td>
                                            <button type="button" onClick={() => removeDetailProduksi(item.id)} className="btn btn-danger btn-sm" disabled={detailProduksi.length === 1}>
                                                <IconX className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-between sm:flex-row flex-col mt-6 px-4">
                        <button type="button" className="btn btn-primary btn-sm" onClick={addDetailProduksi}>
                            <IconPlus className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                            Tambah Karyawan
                        </button>
                    </div>
                </div>

                <hr className="border-white-light dark:border-[#1b2e4b] my-6" />

                {/* Submit Button */}
                <div className="flex justify-between flex-wrap px-4">
                    <button type="button" className="btn btn-success w-full gap-2" onClick={handleSubmit}>
                        <IconSave className="ltr:mr-2 rtl:ml-2 shrink-0" />
                        Update Produksi
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Edit;