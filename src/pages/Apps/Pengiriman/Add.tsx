import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import IconX from '../../../components/Icon/IconX';
import IconSave from '../../../components/Icon/IconSave';
import IconArrowLeft from '../../../components/Icon/IconArrowLeft';
import { Icon } from '@iconify-icon/react';
import PengirimanService, { Pesanan, Driver, CreatePengirimanData } from '../../../services/PengirimanService';

interface PengirimanForm {
  pesanan_id: number | null;
  driver_id: number | null;
  tanggal_pengiriman: string;
  catatan: string;
}

const AddPengiriman = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [pesananList, setPesananList] = useState<Pesanan[]>([]);
  const [driverList, setDriverList] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  const [formData, setFormData] = useState<PengirimanForm>({
    pesanan_id: null,
    driver_id: null,
    tanggal_pengiriman: new Date().toISOString().split('T')[0],
    catatan: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    dispatch(setPageTitle('Tambah Pengiriman'));
    fetchInitialData();
  }, [dispatch]);

  const fetchInitialData = async () => {
    try {
      setLoadingData(true);
      console.log('=== Fetching Initial Data ===');
      
      // Fetch pesanan siap kirim dan drivers secara parallel
      const [pesananResponse, driverResponse] = await Promise.all([
        PengirimanService.getPesananSiapKirim({ limit: 100 }),
        PengirimanService.getDrivers()
      ]);

      console.log('Pesanan response:', pesananResponse);
      console.log('Driver response:', driverResponse);

      if (pesananResponse.success) {
        setPesananList(pesananResponse.data.data);
        console.log('✅ Pesanan loaded:', pesananResponse.data.data.length);
      }

      if (driverResponse.success) {
        setDriverList(driverResponse.data);
        console.log('✅ Drivers loaded:', driverResponse.data.length);
      }
    } catch (error: any) {
      console.error('❌ Error fetching initial data:', error);
      Swal.fire({
        title: 'Error!',
        text: error.message || 'Gagal memuat data awal',
        icon: 'error'
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'pesanan_id' || name === 'driver_id' ? 
        (value ? parseInt(value) : null) : value
    }));

    // Clear error ketika user mulai mengetik
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.pesanan_id) {
      newErrors.pesanan_id = 'Pesanan harus dipilih';
    } else {
      // Validasi tambahan untuk pesanan yang dipilih
      const selectedPesanan = getSelectedPesanan();
      if (selectedPesanan) {
        // Cek status pemesanan
        if (!['Diproses', 'Menunggu Pengiriman'].includes(selectedPesanan.status_pemesanan)) {
          newErrors.pesanan_id = 'Pesanan harus dalam status "Diproses" atau "Menunggu Pengiriman"';
        }
        
        // Cek mode pengiriman
        if (selectedPesanan.mode_pengiriman !== 'Dikirim') {
          newErrors.pesanan_id = 'Pesanan harus memiliki mode pengiriman "Dikirim"';
        }
      }
    }

    if (!formData.driver_id) {
      newErrors.driver_id = 'Driver harus dipilih';
    }

    if (!formData.tanggal_pengiriman) {
      newErrors.tanggal_pengiriman = 'Tanggal pengiriman harus diisi';
    } else {
      const today = new Date().toISOString().split('T')[0];
      if (formData.tanggal_pengiriman < today) {
        newErrors.tanggal_pengiriman = 'Tanggal pengiriman tidak boleh di masa lalu';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const pengirimanData: CreatePengirimanData = {
        pesanan_id: formData.pesanan_id!,
        driver_id: formData.driver_id!,
        tanggal_pengiriman: formData.tanggal_pengiriman, // Format YYYY-MM-DD sudah sesuai dengan backend
        catatan: formData.catatan?.trim() || undefined // Trim whitespace dan handle empty string
      };

      console.log('=== Creating Pengiriman ===');
      console.log('Data:', pengirimanData);

      const response = await PengirimanService.createPengiriman(pengirimanData);
      
      console.log('✅ Pengiriman created:', response);

      Swal.fire({
        title: 'Berhasil!',
        text: 'Pengiriman berhasil dibuat',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        navigate('/apps/pengiriman');
      });

    } catch (error: any) {
      console.error('❌ Error creating pengiriman:', error);
      
      // Penanganan error yang lebih spesifik
      let errorMessage = 'Gagal membuat pengiriman';
      
      if (error.message) {
        if (error.message.includes('Pesanan sudah memiliki pengiriman')) {
          errorMessage = 'Pesanan yang dipilih sudah memiliki pengiriman aktif';
        } else if (error.message.includes('status "Diproses" atau "Menunggu Pengiriman"')) {
          errorMessage = 'Pesanan harus dalam status "Diproses" atau "Menunggu Pengiriman"';
        } else if (error.message.includes('mode pengiriman "Dikirim"')) {
          errorMessage = 'Pesanan harus memiliki mode pengiriman "Dikirim"';
        } else if (error.message.includes('role "driver"')) {
          errorMessage = 'User yang dipilih harus memiliki role "driver"';
        } else if (error.message.includes('tidak ditemukan')) {
          errorMessage = 'Data yang dipilih tidak ditemukan';
        } else {
          errorMessage = error.message;
        }
      }
      
      Swal.fire({
        title: 'Gagal!',
        text: errorMessage,
        icon: 'error',
        showCancelButton: true,
        confirmButtonText: 'Refresh Data',
        cancelButtonText: 'OK'
      }).then((result) => {
        if (result.isConfirmed) {
          // Refresh data jika user mau
          fetchInitialData();
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const getSelectedPesanan = (): Pesanan | null => {
    return pesananList.find(p => p.id_pesanan === formData.pesanan_id) || null;
  };

  const getSelectedDriver = (): Driver | null => {
    return driverList.find(d => d.user_id === formData.driver_id) || null;
  };

  const isPesananValidForShipping = (pesanan: Pesanan | null): boolean => {
    if (!pesanan) return false;
    return ['Diproses', 'Menunggu Pengiriman'].includes(pesanan.status_pemesanan) && 
           pesanan.mode_pengiriman === 'Dikirim';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Icon icon="eos-icons:loading" width="3rem" height="3rem" className="animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h2 className="text-xl">Tambah Pengiriman</h2>
        <div className="flex sm:flex-row flex-col sm:items-center sm:gap-3 gap-4 w-full sm:w-auto">
          <div className="flex gap-3">
            <Link to="/apps/pengiriman" className="btn btn-outline-primary">
              <IconArrowLeft className="ltr:mr-2 rtl:ml-2" />
              Kembali
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Form Section */}
        <div className="panel">
          <div className="mb-5">
            <h5 className="font-semibold text-lg mb-4">Informasi Pengiriman</h5>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-start">
                <Icon icon="solar:info-circle-bold" className="text-blue-500 mr-2 mt-0.5" width="16" height="16" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Syarat Membuat Pengiriman:</p>
                  <ul className="text-xs space-y-1">
                    <li>• Pesanan harus dalam status "Diproses" atau "Menunggu Pengiriman"</li>
                    <li>• Mode pengiriman harus "Dikirim"</li>
                    <li>• Pesanan belum memiliki pengiriman sebelumnya</li>
                    <li>• Driver harus aktif dan memiliki role "driver"</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Pilih Pesanan */}
            <div>
              <label htmlFor="pesanan_id" className="block text-sm font-medium text-gray-700 mb-2">
                Pesanan <span className="text-red-500">*</span>
              </label>
              <select
                id="pesanan_id"
                name="pesanan_id"
                value={formData.pesanan_id || ''}
                onChange={handleInputChange}
                className={`form-select ${errors.pesanan_id ? 'border-red-500' : ''}`}
                required
              >
                <option value="">Pilih Pesanan</option>
                {pesananList.map((pesanan) => {
                  const isValidForShipping = 
                    ['Diproses', 'Menunggu Pengiriman'].includes(pesanan.status_pemesanan) && 
                    pesanan.mode_pengiriman === 'Dikirim';
                  
                  return (
                    <option 
                      key={pesanan.id_pesanan} 
                      value={pesanan.id_pesanan}
                      style={!isValidForShipping ? { color: '#ef4444', fontStyle: 'italic' } : {}}
                    >
                      {pesanan.no_pesanan} - {pesanan.pelanggan.nama} 
                      ({new Date(pesanan.tgl_pesanan).toLocaleDateString('id-ID')})
                      {!isValidForShipping && ' ❌ Tidak Valid'}
                    </option>
                  );
                })}
              </select>
              {errors.pesanan_id && <p className="text-red-500 text-sm mt-1">{errors.pesanan_id}</p>}
              {pesananList.length === 0 && (
                <p className="text-amber-600 text-sm mt-1">
                  <Icon icon="solar:warning-bold-duotone" className="inline mr-1" width="16" height="16" />
                  Tidak ada pesanan yang siap untuk dikirim
                </p>
              )}
              <div className="text-xs text-gray-500 mt-1">
                <Icon icon="solar:info-circle-bold" className="inline mr-1" width="12" height="12" />
                Hanya pesanan dengan status "Diproses" atau "Menunggu Pengiriman" dan mode pengiriman "Dikirim" yang dapat dipilih
              </div>
            </div>

            {/* Pilih Driver */}
            <div>
              <label htmlFor="driver_id" className="block text-sm font-medium text-gray-700 mb-2">
                Driver <span className="text-red-500">*</span>
              </label>
              <select
                id="driver_id"
                name="driver_id"
                value={formData.driver_id || ''}
                onChange={handleInputChange}
                className={`form-select ${errors.driver_id ? 'border-red-500' : ''}`}
                required
              >
                <option value="">Pilih Driver</option>
                {driverList.map((driver) => (
                  <option key={driver.user_id} value={driver.user_id}>
                    {driver.nama} - {driver.email}
                  </option>
                ))}
              </select>
              {errors.driver_id && <p className="text-red-500 text-sm mt-1">{errors.driver_id}</p>}
              {driverList.length === 0 && (
                <p className="text-amber-600 text-sm mt-1">
                  <Icon icon="solar:warning-bold-duotone" className="inline mr-1" width="16" height="16" />
                  Tidak ada driver yang tersedia
                </p>
              )}
            </div>

            {/* Tanggal Pengiriman */}
            <div>
              <label htmlFor="tanggal_pengiriman" className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Pengiriman <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="tanggal_pengiriman"
                name="tanggal_pengiriman"
                value={formData.tanggal_pengiriman}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                className={`form-input ${errors.tanggal_pengiriman ? 'border-red-500' : ''}`}
                required
              />
              {errors.tanggal_pengiriman && <p className="text-red-500 text-sm mt-1">{errors.tanggal_pengiriman}</p>}
            </div>

            {/* Catatan */}
            <div>
              <label htmlFor="catatan" className="block text-sm font-medium text-gray-700 mb-2">
                Catatan
              </label>
              <textarea
                id="catatan"
                name="catatan"
                rows={4}
                value={formData.catatan}
                onChange={handleInputChange}
                className="form-textarea"
                placeholder="Catatan tambahan untuk pengiriman (opsional)..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-5">
              <button
                type="submit"
                className="btn btn-success"
                disabled={
                  loading || 
                  pesananList.length === 0 || 
                  driverList.length === 0 || 
                  !isPesananValidForShipping(getSelectedPesanan())
                }
              >
                {loading ? (
                  <>
                    <Icon icon="eos-icons:loading" width="16" height="16" className="animate-spin mr-2" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <IconSave className="ltr:mr-2 rtl:ml-2" />
                    Simpan Pengiriman
                  </>
                )}
              </button>
              <Link to="/apps/pengiriman" className="btn btn-outline-danger">
                <IconX className="ltr:mr-2 rtl:ml-2" />
                Batal
              </Link>
            </div>
          </form>
        </div>

        {/* Preview Section */}
        <div className="panel">
          <div className="mb-5">
            <h5 className="font-semibold text-lg mb-4">Preview</h5>
          </div>

          {/* Preview Pesanan */}
          {getSelectedPesanan() && (
            <div className="space-y-4">
              {/* Warning jika pesanan tidak valid */}
              {!isPesananValidForShipping(getSelectedPesanan()) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Icon icon="solar:danger-triangle-bold" className="text-red-500 mr-2" width="20" height="20" />
                    <div>
                      <p className="font-semibold text-red-800">Pesanan Tidak Valid</p>
                      <p className="text-red-600 text-sm">
                        Pesanan ini tidak dapat dikirim karena status atau mode pengiriman tidak sesuai.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h6 className="font-semibold text-primary mb-3">Informasi Pesanan</h6>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">No. Pesanan:</span>
                    <span className="font-medium">{getSelectedPesanan()?.no_pesanan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tanggal Pesanan:</span>
                    <span className="font-medium">
                      {new Date(getSelectedPesanan()!.tgl_pesanan).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status Pemesanan:</span>
                    <span className={`font-medium px-2 py-1 rounded text-xs ${
                      ['Diproses', 'Menunggu Pengiriman'].includes(getSelectedPesanan()!.status_pemesanan) 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {getSelectedPesanan()?.status_pemesanan}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mode Pengiriman:</span>
                    <span className={`font-medium px-2 py-1 rounded text-xs ${
                      getSelectedPesanan()?.mode_pengiriman === 'Dikirim' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {getSelectedPesanan()?.mode_pengiriman}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status Pembayaran:</span>
                    <span className={`font-medium px-2 py-1 rounded text-xs ${
                      getSelectedPesanan()?.status_pembayaran === 'Lunas' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {getSelectedPesanan()?.status_pembayaran}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Harga:</span>
                    <span className="font-semibold text-primary">
                      {formatCurrency(getSelectedPesanan()!.total_harga)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h6 className="font-semibold text-info mb-3">Informasi Pelanggan</h6>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-600">Nama:</span>
                    <p className="font-medium">{getSelectedPesanan()?.pelanggan.nama}</p>
                  </div>
                  {getSelectedPesanan()?.pelanggan.no_telp && (
                    <div>
                      <span className="text-gray-600">No. Telepon:</span>
                      <p className="font-medium">{getSelectedPesanan()?.pelanggan.no_telp}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Alamat:</span>
                    <p className="font-medium">{getSelectedPesanan()?.pelanggan.alamat}</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h6 className="font-semibold text-success mb-3">Items Pesanan</h6>
                <div className="space-y-2">
                  {getSelectedPesanan()?.detailPesanan?.map((detail, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                      <div>
                        <p className="font-medium">
                          {detail.jenis_barang === 'barang_mentah' 
                            ? detail.barangMentah?.namaBarangMentah?.nama_barang_mentah 
                            : detail.produk?.namaProduk?.nama_produk
                          }
                        </p>
                        <p className="text-sm text-gray-600">
                          {detail.jenis_barang === 'barang_mentah' 
                            ? detail.barangMentah?.kode 
                            : detail.produk?.kode
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">Qty: {detail.kuantitas}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Preview Driver */}
          {getSelectedDriver() && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mt-4">
              <h6 className="font-semibold text-warning mb-3">Driver Terpilih</h6>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nama:</span>
                  <span className="font-medium">{getSelectedDriver()?.nama}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{getSelectedDriver()?.email}</span>
                </div>
              </div>
            </div>
          )}

          {!getSelectedPesanan() && !getSelectedDriver() && (
            <div className="text-center text-gray-500 py-8">
              <Icon icon="solar:delivery-bold-duotone" width="64" height="64" className="mx-auto mb-4 opacity-50" />
              <p>Pilih pesanan dan driver untuk melihat preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddPengiriman;