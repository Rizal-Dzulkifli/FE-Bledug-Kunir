import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import { buildApiUrl, getAuthHeaders } from '../../../config/api';
import IconX from '../../../components/Icon/IconX';
import IconSave from '../../../components/Icon/IconSave';
import IconPlus from '../../../components/Icon/IconPlus';

const Add = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isEdit, setIsEdit] = useState(false);
    const dispatch = useDispatch();

    // Form state
    const [formData, setFormData] = useState({
        mode_produksi: 'existing_product',
        id_produk_detail: null,
        id_produk: null, // untuk mode new_product
        berat_produk: 0,
        harga_jual: 0,
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
        dispatch(setPageTitle(id ? 'Edit Produksi' : 'Tambah Produksi'));
        setIsEdit(!!id);

        // Load data untuk dropdown
        loadProdukExistingList(); // untuk mode existing_product
        loadNamaBarangList(); // untuk mode new_product
        loadBarangMentahList();
        loadKaryawanList();
        loadAssetList();

        if (id) {
            // Load detail produksi untuk edit mode
            // loadProduksiDetail(id);
        }
    }, [id]);

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
            Swal.fire('Error', 'Gagal memuat data produk existing', 'error');
        }
    };

    const loadNamaBarangList = async () => {
        try {
            // API call untuk mendapatkan list nama barang dari table nama_produks
            const token = localStorage.getItem('token');
            if (!token) {
                Swal.fire('Error', 'Authentication token is missing', 'error');
                return;
            }

            const response = await fetch(buildApiUrl('nama-produk?limit=1000'), {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                const data = await response.json();
                const namaBarangData = data.data || data;
                console.log('Nama Barang Data:', namaBarangData);
                setNamaBarangList(namaBarangData);
            } else {
                throw new Error('Failed to fetch nama barang list');
            }
        } catch (error) {
            console.error('Error loading nama barang list:', error);
            Swal.fire('Error', 'Gagal memuat data nama produk', 'error');
        }
    };

    const loadBarangMentahList = async () => {
        try {
            // API call untuk mendapatkan barang mentah dengan harga dan informasi lengkap
            const token = localStorage.getItem('token');
            if (!token) {
                Swal.fire('Error', 'Authentication token is missing', 'error');
                return;
            }

            const response = await fetch(buildApiUrl('barang-mentah?limit=1000'), {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                const data = await response.json();
                const barangMentahData = data.data?.data || data.data || data;

                console.log('Barang Mentah Raw Data:', data);
                console.log('Barang Mentah Processed Data:', barangMentahData);

                // Transform data untuk menambahkan harga_jual_per_kg jika diperlukan
                const transformedData = barangMentahData.map((item: any) => ({
                    ...item,
                    // Gunakan harga_jual sebagai harga_jual_per_kg jika belum ada
                    harga_jual_per_kg: item.harga_jual_per_kg || item.harga_jual,
                    nama_barang_mentah: item.namaBarangMentah?.nama_barang_mentah || item.nama_barang_mentah,
                }));

                console.log('Barang Mentah Transformed Data:', transformedData);
                setBarangMentahList(transformedData);
            } else {
                throw new Error('Failed to fetch barang mentah list');
            }
        } catch (error) {
            console.error('Error loading barang mentah list:', error);
            Swal.fire('Error', 'Gagal memuat data barang mentah', 'error');
        }
    };

    const loadKaryawanList = async () => {
        try {
            // API call untuk mendapatkan user dengan role karyawan
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
            Swal.fire('Error', 'Gagal memuat data karyawan', 'error');
        }
    };

    const loadAssetList = async () => {
        try {
            // API call untuk mendapatkan asset/mesin
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
            Swal.fire('Error', 'Gagal memuat data asset', 'error');
        }
    };

    // Handle form input changes
    const handleFormChange = (key: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    // Detail Bahan functions
    const addDetailBahan = () => {
        const maxId = detailBahan.length ? Math.max(...detailBahan.map((item: any) => item.id)) : 0;
        setDetailBahan([
            ...detailBahan,
            {
                id: maxId + 1,
                id_barangmentah: null,
                berat: 0,
            },
        ]);
    };

    const removeDetailBahan = (id: number) => {
        setDetailBahan(detailBahan.filter((item) => item.id !== id));
    };

    const updateDetailBahan = (id: number, key: string, value: any) => {
        setDetailBahan(detailBahan.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
    };

    // Detail Produksi functions
    const addDetailProduksi = () => {
        const maxId = detailProduksi.length ? Math.max(...detailProduksi.map((item: any) => item.id)) : 0;
        setDetailProduksi([
            ...detailProduksi,
            {
                id: maxId + 1,
                id_user: null,
                id_asset: null,
            },
        ]);
    };

    const removeDetailProduksi = (id: number) => {
        setDetailProduksi(detailProduksi.filter((item) => item.id !== id));
    };

    const updateDetailProduksi = (id: number, key: string, value: any) => {
        setDetailProduksi(detailProduksi.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
    };

    // Handle submit
    const handleSubmit = async () => {
        try {
            // Validasi form
            if (!formData.tgl_tenggat) {
                Swal.fire('Error', 'Tanggal tenggat wajib diisi', 'error');
                return;
            }

            if (formData.mode_produksi === 'existing_product' && !formData.id_produk_detail) {
                Swal.fire('Error', 'Produk wajib dipilih untuk mode existing product', 'error');
                return;
            }

            if (formData.mode_produksi === 'new_product' && (!formData.id_produk || !formData.berat_produk || !formData.harga_jual)) {
                Swal.fire('Error', 'Nama produk, berat produk, dan harga jual wajib diisi untuk mode new product', 'error');
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

            // Prepare data untuk API
            const submitData = {
                mode_produksi: formData.mode_produksi,
                ...(formData.mode_produksi === 'existing_product'
                    ? { id_produk_detail: formData.id_produk_detail }
                    : {
                          id_produk: formData.id_produk,
                          berat_produk: formData.berat_produk,
                          harga_jual: formData.harga_jual,
                          deskripsi_produk: formData.deskripsi_produk,
                      }),
                tgl_tenggat: formData.tgl_tenggat,
                deskripsi: formData.deskripsi || undefined,
                detail_bahan: detailBahan.map((item) => ({
                    id_barangmentah: item.id_barangmentah,
                    berat: item.berat,
                })),
                detail_produksi: detailProduksi.map((item) => ({
                    id_user: item.id_user,
                    id_asset: item.id_asset,
                })),
            };

            console.log('Data to submit:', submitData);

            // API call untuk submit produksi
            const token = localStorage.getItem('token');
            if (!token) {
                Swal.fire('Error', 'Authentication token is missing', 'error');
                return;
            }

            const response = await fetch(buildApiUrl('produksi'), {
                method: isEdit ? 'PUT' : 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(submitData),
            });

            if (response.ok) {
                const result = await response.json();
                Swal.fire('Success', result.message || 'Produksi berhasil ditambahkan', 'success');
                navigate('/apps/produksi');
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save produksi');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            Swal.fire('Error', 'Terjadi kesalahan saat menyimpan data', 'error');
        }
    };

    return (
        <div className="flex xl:flex-row flex-col gap-2.5">
            <div className="panel px-0 flex-1 py-6 ltr:xl:mr-6 rtl:xl:ml-6">
                {/* Header */}
                <div className="flex justify-between flex-wrap px-4">
                    <div className="mb-6 lg:w-1/2 w-full">
                        <div className="flex items-center text-black dark:text-white shrink-0">
                            <h2 className="text-xl font-semibold">{isEdit ? 'Edit Produksi' : 'Tambah Produksi'}</h2>
                        </div>
                    </div>
                    <div className="lg:w-1/2 w-full lg:max-w-fit"></div>
                </div>

                <hr className="border-white-light dark:border-[#1b2e4b] my-6" />
                <div className="flex justify-between flex-wrap px-4 mb-8">
                    <div className="mb-8 lg:w-1/2 w-full"></div>    
                    <div className="lg:w-1/2 w-full lg:max-w-fit">
                        <div className="flex items-center mt-4">
                            <label htmlFor="tgl_tenggat" className="flex-1 ltr:mr-2 rtl:ml-2 mb-0">
                                Tanggal Tenggat *
                            </label>
                            <input
                                id="tgl_tenggat"
                                type="date"
                                className="form-input lg:w-[250px] w-2/3"
                                value={formData.tgl_tenggat}
                                onChange={(e) => handleFormChange('tgl_tenggat', e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </div>
                {/* Mode Produksi & Produk Selection */}
                <div className="mt-8 px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">Mode Produksi *</label>
                            <select className="form-select" value={formData.mode_produksi} onChange={(e) => handleFormChange('mode_produksi', e.target.value)}>
                                <option value="existing_product">Produk Existing</option>
                                <option value="new_product">Produk Baru</option>
                            </select>
                        </div>

                        {formData.mode_produksi === 'existing_product' && (
                            <div>
                                <label className="block text-sm font-medium mb-2">Pilih Produk Existing *</label>
                                <select className="form-select" value={formData.id_produk_detail || ''} onChange={(e) => handleFormChange('id_produk_detail', Number(e.target.value))}>
                                    <option value="">Pilih Produk Existing</option>
                                    {produkExistingList.map((produk: any) => (
                                        <option key={produk.id_produk_detail} value={produk.id_produk_detail}>
                                            {produk.namaProduk?.nama_produk || produk.nama_produk} - {produk.berat_produk}kg - Rp {produk.harga_jual.toLocaleString()}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {formData.mode_produksi === 'new_product' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Nama Produk Baru *</label>
                                    <select className="form-select" value={formData.id_produk || ''} onChange={(e) => handleFormChange('id_produk', Number(e.target.value))}>
                                        <option value="">Pilih Nama Produk</option>
                                        {namaBarangList.map((produk: any) => (
                                            <option key={produk.id_produk} value={produk.id_produk}>
                                                {produk.nama_produk}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Berat Produk (kg) *</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="0"
                                            min={0}
                                            step={0.1}
                                            value={formData.berat_produk}
                                            onChange={(e) => handleFormChange('berat_produk', Number(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Harga Jual (Rp) *</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="0"
                                            min={0}
                                            value={formData.harga_jual}
                                            onChange={(e) => handleFormChange('harga_jual', Number(e.target.value))}
                                        />
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="block text-sm font-medium mb-2">Deskripsi Produk</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Deskripsi produk baru"
                                        value={formData.deskripsi_produk}
                                        onChange={(e) => handleFormChange('deskripsi_produk', e.target.value)}
                                        rows={2}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="mt-6">
                        <label className="block text-sm font-medium mb-2">Deskripsi</label>
                        <textarea
                            className="form-textarea"
                            placeholder="Masukkan deskripsi produksi"
                            value={formData.deskripsi}
                            onChange={(e) => handleFormChange('deskripsi', e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                {/* Detail Bahan Section */}
                <div className="mt-8">
                    <div className="flex justify-between items-center px-4 mb-4">
                        <h3 className="text-lg font-semibold">Detail Bahan</h3>
                    </div>

                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th className="w-64">Barang Mentah *</th>
                                    <th className="w-8">Berat (kg) *</th>
                                    <th className="w-32">Harga/kg</th>
                                    <th className="w-32">Total Harga</th>
                                    <th className="w-16">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {detailBahan.map((item: any) => {
                                    const selectedBarang = barangMentahList.find((b) => b.id_barangmentah === item.id_barangmentah);
                                    const hargaPerKg = selectedBarang ? selectedBarang.harga_jual_per_kg : 0;
                                    const totalHarga = item.berat * hargaPerKg;

                                    return (
                                        <tr key={item.id} className="align-top">
                                            <td>
                                                <select
                                                    className="form-select"
                                                    value={item.id_barangmentah || ''}
                                                    onChange={(e) => updateDetailBahan(item.id, 'id_barangmentah', Number(e.target.value))}
                                                >
                                                    <option value="">Pilih Barang Mentah</option>
                                                    {barangMentahList.map((barang: any) => (
                                                        <option key={barang.id_barangmentah} value={barang.id_barangmentah}>
                                                            {barang.nama_barang_mentah} - Stok: {barang.berat_mentah}kg
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    placeholder="0"
                                                    min={0}
                                                    step={0.1}
                                                    value={item.berat}
                                                    onChange={(e) => updateDetailBahan(item.id, 'berat', Number(e.target.value))}
                                                />
                                            </td>
                                            <td>
                                                <span className="text-sm">Rp {hargaPerKg.toLocaleString()}</span>
                                            </td>
                                            <td>
                                                <span className="font-semibold text-primary">Rp {totalHarga.toLocaleString()}</span>
                                            </td>
                                            <td>
                                                <button type="button" onClick={() => removeDetailBahan(item.id)} className="btn btn-danger btn-sm" disabled={detailBahan.length === 1}>
                                                    <IconX className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div className="flex justify-between sm:flex-row flex-col mt-6 px-4">
                            <button type="button" className="btn btn-primary btn-sm" onClick={addDetailBahan}>
                                <IconPlus className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                                Tambah Bahan
                            </button>
                        </div>

                        {/* Total Perhitungan */}
                        <div className="mt-4 p-4  ">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold">Total Biaya Bahan:</h3>
                                <h3 className="text-xl font-bold text-primary">
                                    Rp{' '}
                                    {detailBahan
                                        .reduce((total, item) => {
                                            const selectedBarang = barangMentahList.find((b) => b.id_barangmentah === item.id_barangmentah);
                                            const hargaPerKg = selectedBarang ? selectedBarang.harga_jual_per_kg : 0;
                                            return total + item.berat * hargaPerKg;
                                        }, 0)
                                        .toLocaleString()}
                                </h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detail Produksi Section */}
                <div className="mt-8">
                    <div className="flex justify-between items-center px-4 mb-4">
                        <h3 className="text-lg font-semibold">Detail Produksi</h3>
                    </div>

                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Karyawan *</th>
                                    <th>Asset/Mesin *</th>
                                    <th className="w-16">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {detailProduksi.map((item: any) => (
                                    <tr key={item.id} className="align-top">
                                        <td>
                                            <select className="form-select" value={item.id_user || ''} onChange={(e) => updateDetailProduksi(item.id, 'id_user', Number(e.target.value))}>
                                                <option value="">Pilih Karyawan</option>
                                                {karyawanList.map((karyawan: any) => (
                                                    <option key={karyawan.user_id} value={karyawan.user_id}>
                                                        {karyawan.nama}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <select className="form-select" value={item.id_asset || ''} onChange={(e) => updateDetailProduksi(item.id, 'id_asset', Number(e.target.value))}>
                                                <option value="">Pilih Asset/Mesin</option>
                                                {assetList.map((asset: any) => (
                                                    <option key={asset.id_asset} value={asset.id_asset}>
                                                        {asset.nama_asset}
                                                    </option>
                                                ))}
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
                        {isEdit ? 'Update' : 'Simpan'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Add;
