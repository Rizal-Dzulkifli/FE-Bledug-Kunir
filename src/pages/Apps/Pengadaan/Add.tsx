import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import IconX from '../../../components/Icon/IconX';
import IconSave from '../../../components/Icon/IconSave';
import IconPlus from '../../../components/Icon/IconPlus';
import IconArrowLeft from '../../../components/Icon/IconArrowLeft';
import { Icon } from '@iconify-icon/react';
import { buildApiUrl, getAuthHeaders } from '../../../config/api';

interface Supplier {
  id_kontak: number;
  nama: string;
  no_telp: string | null;
  alamat: string | null;
}

interface BarangMentah {
  id_barangmentah: number;
  id_bm: number;
  kode: string;
  berat_mentah: number;
  harga_beli: number;
  harga_jual: number;
  namaBarangMentah?: {
    id_bm: number;
    nama_barang_mentah: string;
    kode_barang: string;
  };
}

interface DetailBarang {
  id_barangmentah: number;
  berat: number;
  harga_beli?: number;
  subtotal?: number;
  nama_barang?: string;
}

interface PengadaanForm {
  id_kontak: number | null;
  tgl_transaksi: string;
  status: 'selesai' | 'belum di bayar' | 'dibatalkan' | 'proses';
  deskripsi: string;
  detail_barang: DetailBarang[];
}

const AddPengadaan = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [barangMentahList, setBarangMentahList] = useState<BarangMentah[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<PengadaanForm>({
    id_kontak: null,
    tgl_transaksi: new Date().toISOString().split('T')[0],
    status: 'proses',
    deskripsi: '',
    detail_barang: []
  });

  useEffect(() => {
    dispatch(setPageTitle('Tambah Pengadaan Barang Mentah'));
    fetchSuppliers();
    fetchBarangMentah();
  }, [dispatch]);

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(buildApiUrl('pengadaan-barang-mentah/suppliers'), {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const result = await response.json();
        setSuppliers(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchBarangMentah = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(buildApiUrl('pengadaan-barang-mentah/barang-mentah'), {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const result = await response.json();
        setBarangMentahList(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching barang mentah:', error);
    }
  };

  const handleFormChange = (field: keyof PengadaanForm, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addDetailBarang = () => {
    setFormData(prev => ({
      ...prev,
      detail_barang: [...prev.detail_barang, {
        id_barangmentah: 0,
        berat: 0
      }]
    }));
  };

  const updateDetailBarang = (index: number, field: keyof DetailBarang, value: any) => {
    setFormData(prev => ({
      ...prev,
      detail_barang: prev.detail_barang.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          
          // Auto-calculate subtotal when barang or berat changes
          if (field === 'id_barangmentah' || field === 'berat') {
            const barang = barangMentahList.find(b => b.id_barangmentah === (field === 'id_barangmentah' ? value : item.id_barangmentah));
            if (barang && (field === 'berat' ? value : item.berat) > 0) {
              updatedItem.harga_beli = barang.harga_beli;
              updatedItem.subtotal = barang.harga_beli * (field === 'berat' ? value : item.berat);
              updatedItem.nama_barang = barang.namaBarangMentah?.nama_barang_mentah;
            }
          }
          
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const removeDetailBarang = (index: number) => {
    setFormData(prev => ({
      ...prev,
      detail_barang: prev.detail_barang.filter((_, i) => i !== index)
    }));
  };

  const getTotalHarga = () => {
    return formData.detail_barang.reduce((total, item) => total + (item.subtotal || 0), 0);
  };

  // Konsisten dengan format currency di seluruh aplikasi
  const formatCurrency = (amount: number) => {
    const cleanValue = amount % 1 === 0 ? Math.floor(amount) : amount;
    return `Rp ${cleanValue.toLocaleString('id-ID')}`;
  };

  const getAvailableBarangMentah = (currentIndex: number) => {
    const selectedIds = formData.detail_barang
      .map((item, index) => index !== currentIndex ? item.id_barangmentah : null)
      .filter(id => id !== null && id !== 0);
    
    return barangMentahList.filter(barang => 
      !selectedIds.includes(barang.id_barangmentah)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.id_kontak) {
      Swal.fire('Error', 'Pilih supplier terlebih dahulu', 'error');
      return;
    }
    
    if (formData.detail_barang.length === 0) {
      Swal.fire('Error', 'Tambahkan minimal satu barang mentah', 'error');
      return;
    }
    
    // Check for duplicate barang mentah
    const barangMentahIds = formData.detail_barang.map(item => item.id_barangmentah);
    const uniqueIds = [...new Set(barangMentahIds)];
    if (uniqueIds.length !== barangMentahIds.length) {
      Swal.fire('Error', 'Tidak boleh ada barang mentah yang sama dalam satu pengadaan', 'error');
      return;
    }
    
    // Validate detail barang
    for (let i = 0; i < formData.detail_barang.length; i++) {
      const detail = formData.detail_barang[i];
      if (!detail.id_barangmentah || detail.berat <= 0) {
        Swal.fire('Error', `Detail barang ke-${i + 1} tidak valid`, 'error');
        return;
      }
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        Swal.fire('Error', 'Token authentication tidak ditemukan', 'error');
        return;
      }

      const payload = {
        id_kontak: formData.id_kontak,
        tgl_transaksi: formData.tgl_transaksi,
        status: formData.status,
        deskripsi: formData.deskripsi,
        detail_barang: formData.detail_barang.map(item => ({
          id_barangmentah: item.id_barangmentah,
          berat: item.berat
        }))
      };

      const response = await fetch(buildApiUrl('pengadaan-barang-mentah'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        Swal.fire('Berhasil', 'Pengadaan berhasil dibuat', 'success').then(() => {
          navigate('/apps/pengadaan');
        });
      } else {
        throw new Error(result.message || 'Gagal membuat pengadaan');
      }
    } catch (error: any) {
      console.error('Error creating pengadaan:', error);
      Swal.fire('Error', error.message || 'Terjadi kesalahan saat membuat pengadaan', 'error');
    } finally {
      setLoading(false);
    }
  };
   

  return (
    <div className="flex xl:flex-row flex-col gap-2.5">
      <div className="panel px-0 flex-1 py-6 ltr:xl:mr-6 rtl:xl:ml-6">
        {/* Header */}
        <div className="flex justify-between flex-wrap px-4">
          <div className="mb-6 lg:w-1/2 w-full">
            <div className="flex items-center text-black dark:text-white shrink-0">
              <h2 className="text-xl font-semibold">Tambah Pengadaan Barang Mentah</h2>
            </div>
          </div>
          <div className="lg:w-1/2 w-full lg:max-w-fit">
            <Link to="/apps/pengadaan" className="btn btn-outline-primary">
              <IconArrowLeft className="ltr:mr-2 rtl:ml-2" />
              Kembali ke List
            </Link>
          </div>
        </div>

        <hr className="border-white-light dark:border-[#1b2e4b] my-6" />

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="flex justify-between flex-wrap px-4 mb-8">
            <div className="mb-8 lg:w-1/2 w-full">
              <div className="flex items-center mt-4">
                <label htmlFor="supplier" className="flex-1 ltr:mr-2 rtl:ml-2 mb-0">
                  Supplier *
                </label>
                <select
                  id="supplier"
                  className="form-select lg:w-[300px] w-2/3"
                  value={formData.id_kontak || ''}
                  onChange={(e) => handleFormChange('id_kontak', Number(e.target.value))}
                  required
                >
                  <option value="">Pilih Supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id_kontak} value={supplier.id_kontak}>
                      {supplier.nama}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center mt-4">
                <label htmlFor="status" className="flex-1 ltr:mr-2 rtl:ml-2 mb-0">
                  Status *
                </label>
                <select
                  id="status"
                  className="form-select lg:w-[300px] w-2/3"
                  value={formData.status}
                  onChange={(e) => handleFormChange('status', e.target.value as any)}
                >
                  <option value="proses">Proses</option>
                  <option value="selesai">Selesai</option>
                  <option value="belum di bayar">Belum Dibayar</option>
                  <option value="dibatalkan">Dibatalkan</option>
                </select>
              </div>
            </div>

            <div className="lg:w-1/2 w-full lg:max-w-fit">
              <div className="flex items-center mt-4">
                <label htmlFor="tgl_transaksi" className="flex-1 ltr:mr-2 rtl:ml-2 mb-0">
                  Tanggal Transaksi *
                </label>
                <input
                  id="tgl_transaksi"
                  type="date"
                  className="form-input lg:w-[250px] w-2/3"
                  value={formData.tgl_transaksi}
                  onChange={(e) => handleFormChange('tgl_transaksi', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-8 px-4">
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">Deskripsi</label>
              <textarea
                id="deskripsi"
                className="form-textarea"
                placeholder="Masukkan deskripsi pengadaan..."
                value={formData.deskripsi}
                onChange={(e) => handleFormChange('deskripsi', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Detail Barang Section */}
          <div className="mt-8">
            <div className="flex justify-between items-center px-4 mb-4">
              <h3 className="text-lg font-semibold">Detail Barang Mentah</h3>
            </div>

            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th className="w-64">Barang Mentah *</th>
                    <th className="w-32">Berat (kg) *</th>
                    <th className="w-32">Harga/kg</th>
                    <th className="w-32">Subtotal</th>
                    <th className="w-16">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.detail_barang.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">
                        Belum ada barang yang ditambahkan. Klik tombol "Tambah Barang" untuk menambahkan.
                      </td>
                    </tr>
                  ) : (
                    formData.detail_barang.map((item, index) => (
                      <tr key={index} className="align-top">
                        <td>
                          <select
                            className="form-select"
                            value={item.id_barangmentah || ''}
                            onChange={(e) =>
                              updateDetailBarang(index, 'id_barangmentah', Number(e.target.value))
                            }
                            required
                          >
                            <option value="">Pilih Barang Mentah</option>
                            {getAvailableBarangMentah(index).map((barang) => (
                              <option key={barang.id_barangmentah} value={barang.id_barangmentah}>
                                {barang.namaBarangMentah?.nama_barang_mentah} ({barang.kode}) - {barang.berat_mentah}kg tersedia
                              </option>
                            ))}
                            {/* Show currently selected item even if it would be filtered out */}
                            {item.id_barangmentah && !getAvailableBarangMentah(index).find(b => b.id_barangmentah === item.id_barangmentah) && (
                              barangMentahList.filter(b => b.id_barangmentah === item.id_barangmentah).map((barang) => (
                                <option key={barang.id_barangmentah} value={barang.id_barangmentah}>
                                  {barang.namaBarangMentah?.nama_barang_mentah} ({barang.kode}) - {barang.berat_mentah}kg tersedia
                                </option>
                              ))
                            )}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-input"
                            placeholder="0"
                            min={0.1}
                            step={0.1}
                            value={item.berat || ''}
                            onChange={(e) =>
                              updateDetailBarang(index, 'berat', parseFloat(e.target.value))
                            }
                            required
                          />
                        </td>
                        <td>
                          <span className="text-sm">
                            {item.harga_beli ? formatCurrency(item.harga_beli) : '-'}
                          </span>
                        </td>
                        <td>
                          <span className="font-semibold text-primary">
                            {item.subtotal ? formatCurrency(item.subtotal) : '-'}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => removeDetailBarang(index)}
                          >
                            <IconX className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              
              <div className="flex justify-between sm:flex-row flex-col mt-6 px-4">
                <button 
                  type="button" 
                  className="btn btn-primary btn-sm" 
                  onClick={addDetailBarang}
                >
                  <IconPlus className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                  Tambah Barang
                </button>
              </div>

              {/* Total Perhitungan */}
              <div className="mt-4 p-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Total Harga Pengadaan:</h3>
                  <h3 className="text-xl font-bold text-primary">
                    {formatCurrency(getTotalHarga())}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-white-light dark:border-[#1b2e4b] my-6" />

          {/* Submit Button */}
          <div className="px-4 flex justify-end gap-3">
            <Link to="/apps/pengadaan" className="btn btn-outline-danger">
              Batal
            </Link>
            <button
              type="submit"
              className="btn btn-success"
              disabled={loading}
            >
              <IconSave className="ltr:mr-2 rtl:ml-2" />
              {loading ? 'Menyimpan...' : 'Simpan Pengadaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPengadaan;
                           
