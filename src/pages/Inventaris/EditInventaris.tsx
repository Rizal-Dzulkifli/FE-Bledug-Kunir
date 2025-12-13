import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
const EditInventaris = () => {
  const [showPcSpecificationForm, setShowPcSpecificationForm] = useState(false);
  const { id } = useParams();
  // Ambil `id` dari parameter URL
  const [dataBarang, setDataBarang] = useState({
    nama_barang: '',
    kode_barang: '',
    kategori_barang: '',
  });
  const [inventaris, setInventaris] = useState({
    inventaris_id: '',
    kode_inventaris: '',
    status_barang: '',
    lokasi_barang: '',
    tanggal_masuk: '',
    nomor_pengadaan: '',
    keterangan: '',
    harga: '',
    asal_barang: '',
    pcSpecification: '',
  });
  const [pcSpecification, setPcSpecification] = useState({
    id: '',
    processor: '',
    ram: '',
    storage: '',
    gpu: '',
    motherboard: '',
    psu: '',
    casing: '',
    os: '',
    cooling: '',
  });

  // Fetch detail inventaris dan data barang
  useEffect(() => {
    const fetchInventaris = async () => {
      try {
        const response = await fetch(`http://localhost:3333/api/inventaris/${id}`);
        const result = await response.json();

        if (response.ok) {
          setDataBarang({
            nama_barang: result.data.nama_barang,
            kode_barang: result.data.kode_barang,
            kategori_barang: result.data.kategori_barang,
          });
          setInventaris({
            inventaris_id: result.data.inventaris_id,
            kode_inventaris: result.data.kode_inventaris,
            status_barang: result.data.status_barang,
            lokasi_barang: result.data.lokasi_barang || 'Tidak Ditempatkan',
            tanggal_masuk: result.data.tanggal_masuk,
            nomor_pengadaan: result.data.nomor_pengadaan || 'Tidak Terkait',
            keterangan: result.data.keterangan,
            harga: result.data.harga || '',
            asal_barang: result.data.asal_barang || '',
            pcSpecification: result.data.pcSpecification,
          });
          setPcSpecification({
            id: result.data.pcSpecification?.id || '',
            processor: result.data.pcSpecification?.processor || '',
            ram: result.data.pcSpecification?.ram || '',
            storage: result.data.pcSpecification?.storage || '',
            gpu: result.data.pcSpecification?.gpu || '',
            motherboard: result.data.pcSpecification?.motherboard || '',
            psu: result.data.pcSpecification?.psu || '',
            casing: result.data.pcSpecification?.casing || '',
            os: result.data.pcSpecification?.os || '',
            cooling: result.data.pcSpecification?.cooling || '',
          });
        } else {
          alert('Gagal mengambil data');
        }
      } catch (error) {
        alert('Terjadi kesalahan saat mengambil data inventaris');
      }
    };

    fetchInventaris();
  }, [id]);
  useEffect(() => {
    if (inventaris.pcSpecification) {
      setShowPcSpecificationForm(true); // Aktifkan switch
    }
  }, [inventaris]);
  const handlePcSpecificationSwitch = async (checked: boolean) => {
    setShowPcSpecificationForm(checked);
  
    if (!checked && pcSpecification.id) {
      try {
        const response = await fetch(`http://localhost:3333/api/inventaris/spek/${pcSpecification.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        if (response.ok) {
          Swal.fire('Success', 'Spesifikasi PC berhasil dihapus', 'success');
          setPcSpecification({
            id: '',
            processor: '',
            ram: '',
            storage: '',
            gpu: '',
            motherboard: '',
            psu: '',
            casing: '',
            os: '',
            cooling: '',
          });
        } else {
          Swal.fire('Error', 'Gagal menghapus spesifikasi PC', 'error');
        }
      } catch (error) {
        Swal.fire('Error', 'Terjadi kesalahan saat menghapus spesifikasi PC', 'error');
      }
    }
  };
  
  const saveOrUpdatePcSpecification = async () => {
    try {
      const endpoint = pcSpecification.id
        ? `http://localhost:3333/api/inventaris/spek/${pcSpecification.id}`
        : `http://localhost:3333/api/inventaris/spek`;
  
      const method = pcSpecification.id ? 'PUT' : 'POST';
  
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inventaris_id: id,
          ...pcSpecification,
        }),
      });
  
      if (response.ok) {
        Swal.fire('Success', 'Spesifikasi PC berhasil disimpan', 'success');
      } else {
        Swal.fire('Error', 'Gagal menyimpan spesifikasi PC', 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Terjadi kesalahan saat menyimpan spesifikasi PC', 'error');
    }
  };
  
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Mencegah reload halaman
  
    try {
      // Update data inventaris
      const response = await fetch(`http://localhost:3333/api/inventaris/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keterangan: inventaris.keterangan,
          harga: inventaris.harga,
          asal_barang: inventaris.asal_barang,
        }),
      });
  
      const result = await response.json();
  
      if (response.ok) {
        Swal.fire('Success', 'Data inventaris berhasil diperbarui', 'success');
  
        // Hapus spesifikasi PC jika switch dimatikan
        if (!showPcSpecificationForm && pcSpecification.id) {
          await handlePcSpecificationSwitch(false);
        }
  
        // Simpan atau perbarui spesifikasi PC jika switch dihidupkan
        if (showPcSpecificationForm) {
          await saveOrUpdatePcSpecification();
        }
      } else {
        Swal.fire('Error', result.message || 'Gagal memperbarui data inventaris', 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Terjadi kesalahan saat menyimpan data', 'error');
    }
  };
  
  
  


  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl">Edit Inventaris Barang</h2>
      </div>
      <div className="mt-5 panel p-0 border-0 overflow-hidden">
        <div className="m-5">
          {/* Data Barang */}
          <div className="flex items-center justify-between mb-5">
            <h5 className="font-semibold text-lg dark:text-white-light">Data Barang</h5>
          </div>
          <hr className="border-white-light dark:border-[#1b2e4b] my-3" />
          <div className="mb-5 p-2">
            <form className="space-y-5">
              <div>
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 mb-3">Nama Barang</label>
                <input className="form-input flex-1" value={dataBarang.nama_barang} readOnly />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 mb-3">Kode Barang</label>
                  <input className="form-input flex-1" value={dataBarang.kode_barang} readOnly />
                </div>
                <div>
                  <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 mb-3">Kategori</label>
                  <input className="form-input flex-1" value={dataBarang.kategori_barang} readOnly />
                </div>
              </div>
            </form>
          </div>
          <hr className="border-white-light dark:border-[#1b2e4b] my-6" />
          {/* Data Inventaris */}
          <div className="flex items-center justify-between mb-5">
            <h5 className="font-semibold text-lg dark:text-white-light">Data Inventaris</h5>
          </div>
          <div className="mb-5 p-2">
            <form className="space-y-5" onSubmit={handleSave}>
              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2">Kode Inventaris</label>
                <input className="form-input flex-1" value={inventaris.kode_inventaris} readOnly />
              </div>
              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2">Status</label>
                <input className="form-input flex-1" value={inventaris.status_barang} readOnly />
              </div>
              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2">Ditempatkan Di</label>
                <input className="form-input flex-1" value={inventaris.lokasi_barang} readOnly />
              </div>
              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2">Tanggal Masuk</label>
                <input className="form-input flex-1" value={inventaris.tanggal_masuk} readOnly />
              </div>
              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2">Harga</label>
                <input
                  className="form-input flex-1"
                  type="number"
                  value={inventaris.harga}
                  onChange={(e) => setInventaris({ ...inventaris, harga: e.target.value })}
                />
              </div>
              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2">Asal Barang</label>
                <input
                  className="form-input flex-1"
                  type="text"
                  value={inventaris.nomor_pengadaan || 'Tidak Ditempatkan'}
                  onChange={(e) => setInventaris({ ...inventaris, asal_barang: e.target.value })}
                />
              </div>
              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2">Keterangan</label>
                <textarea
                  className="form-input flex-1"
                  rows={4}
                  value={inventaris.keterangan}
                  onChange={(e) => setInventaris({ ...inventaris, keterangan: e.target.value })}
                ></textarea>
              </div>
              <hr className="border-white-light dark:border-[#1b2e4b] my-6" />
              {dataBarang.kategori_barang === 'Elektronik' && (
                <div className="flex sm:flex-row flex-col items-center">
                  <label htmlFor="pcSpecificationSwitch" className="mr-2">
                    Tambahkan Spesifikasi PC
                  </label>
                  <label className="w-12 h-6 relative">
                    <input
                      type="checkbox"
                      className="custom_switch absolute w-full h-full opacity-0 z-10 cursor-pointer peer"
                      id="pcSpecificationSwitch"
                      checked={showPcSpecificationForm}
                      onChange={(e) => setShowPcSpecificationForm(e.target.checked)}
                    />
                    <span className="bg-[#ebedf2] dark:bg-dark block h-full rounded-full before:absolute before:left-1 before:bg-white dark:before:bg-white-dark dark:peer-checked:before:bg-white before:bottom-1 before:w-4 before:h-4 before:rounded-full peer-checked:before:left-7 peer-checked:bg-primary before:transition-all before:duration-300"></span>
                  </label>
                </div>
              )}

              {showPcSpecificationForm && (
                <div>
                  <h5 className="font-semibold text-lg dark:text-white-light">Spesifikasi PC</h5>
                  <div className="mb-5 p-2">
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 mb-3">Processor</label>
                          <input
                            className="form-input flex-1"
                            value={pcSpecification.processor || ''}
                            onChange={(e) => setPcSpecification({ ...pcSpecification, processor: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 mb-3">RAM</label>
                          <input
                            className="form-input flex-1"
                            value={pcSpecification.ram || ''}
                            onChange={(e) => setPcSpecification({ ...pcSpecification, ram: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 mb-3">Storage</label>
                          <input
                            className="form-input flex-1"
                            value={pcSpecification.storage || ''}
                            onChange={(e) => setPcSpecification({ ...pcSpecification, storage: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 mb-3">GPU</label>
                          <input
                            className="form-input flex-1"
                            value={pcSpecification.gpu || ''}
                            onChange={(e) => setPcSpecification({ ...pcSpecification, gpu: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 mb-3">Motherboard</label>
                          <input
                            className="form-input flex-1"
                            value={pcSpecification.motherboard || ''}
                            onChange={(e) => setPcSpecification({ ...pcSpecification, motherboard: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 mb-3">PSU</label>
                          <input
                            className="form-input flex-1"
                            value={pcSpecification.psu || ''}
                            onChange={(e) => setPcSpecification({ ...pcSpecification, psu: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 mb-3">Casing</label>
                          <input
                            className="form-input flex-1"
                            value={pcSpecification.casing || ''}
                            onChange={(e) => setPcSpecification({ ...pcSpecification, casing: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 mb-3">OS</label>
                          <input
                            className="form-input flex-1"
                            value={pcSpecification.os || ''}
                            onChange={(e) => setPcSpecification({ ...pcSpecification, os: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 mb-3">Cooling System</label>
                        <input
                          className="form-input flex-1"
                          value={pcSpecification.cooling || ''}
                          onChange={(e) => setPcSpecification({ ...pcSpecification, cooling: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-primary !mt-6 ">
                Save Changes
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditInventaris;
