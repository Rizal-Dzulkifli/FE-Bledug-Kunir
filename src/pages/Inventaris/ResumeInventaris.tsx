import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Swal from 'sweetalert2';

const EditResume = () => {
  const { id } = useParams();
  const [refresh, setRefresh] = useState(false);
  // ID inventaris dari URL parameter
  const [dataBarang, setDataBarang] = useState({
    nama_barang: '',
    kode_barang: '',
    kategori_barang: '',
  });
  const [resume, setResume] = useState({
    kondisi_barang: '',
    keterangan: '',
    petugas: '',
    created_at: '',
  });
  const [newResume, setNewResume] = useState({
    kondisi_barang: '',
    keterangan: '',
  });

  // Fetch detail data barang dan resume sebelumnya
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          Swal.fire('Error', 'Token login tidak ditemukan', 'error');
          return;
        }

        const response = await fetch(`http://localhost:3333/api/resumes/${id}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();

        if (response.ok) {
          setDataBarang({
            nama_barang: result.inventaris.nama_barang || 'Tidak ditemukan',
            kode_barang: result.inventaris.kode_barang || 'Tidak ditemukan',
            kategori_barang: result.inventaris.kategori_barang || 'Tidak ditemukan',
          });

          if (result.resume) {
            // Jika resume ditemukan
            setResume({
              kondisi_barang: result.resume.kondisi_barang,
              keterangan: result.resume.keterangan,
              petugas: result.resume.petugas,
              created_at: result.resume.created_at,
            });
          } else {
            // Jika resume tidak ditemukan
            setResume({
              kondisi_barang: '',
              keterangan: '',
              petugas: 'Belum ada data',
              created_at: 'Belum ada data',
            });
          }
        } else {
          Swal.fire('Error', 'Gagal mengambil data inventaris', 'error');
        }
      } catch (error) {
        Swal.fire('Error', 'Terjadi kesalahan saat mengambil data', 'error');
      }
    };

    fetchData();
  }, [id, refresh]); // Tambahkan refresh sebagai dependensi



  // Simpan resume baru
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
    try {
      const token = localStorage.getItem('token');
  
      if (!token) {
        Swal.fire('Error', 'Token login tidak ditemukan', 'error');
        return;
      }
  
      // Periksa apakah data resume sudah ada
      const checkResponse = await fetch(`http://localhost:3333/api/resumes/${id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      const checkResult = await checkResponse.json();
  
      if (checkResponse.ok && checkResult.resume) {
        // Resume sudah ada, lakukan PUT (update)
        const response = await fetch(`http://localhost:3333/api/resumes/${id}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newResume),
        });
  
        const result = await response.json();
  
        if (response.ok) {
          Swal.fire('Success', 'Resume berhasil diperbarui', 'success');
          setResume({
            kondisi_barang: newResume.kondisi_barang,
            keterangan: newResume.keterangan,
            petugas: result.petugas, // Ambil petugas dari response
            created_at: result.created_at,
          });
          setNewResume({
            kondisi_barang: '',
            keterangan: '',
          });
        } else {
          Swal.fire('Error', result.message || 'Gagal memperbarui resume', 'error');
        }
      } else if (checkResponse.status === 404 || !checkResult.resume) {
        // Resume belum ada, lakukan POST (create)
        const response = await fetch(`http://localhost:3333/api/resumes`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...newResume,
            inventaris_id: id, // Sertakan inventaris_id
          }),
        });
  
        const result = await response.json();
  
        if (response.ok) {
          Swal.fire('Success', 'Resume berhasil disimpan', 'success');
          setResume({
            kondisi_barang: newResume.kondisi_barang,
            keterangan: newResume.keterangan,
            petugas: result.petugas, // Ambil petugas dari response
            created_at: result.created_at,
          });
          setNewResume({
            kondisi_barang: '',
            keterangan: '',
          });
          setRefresh((prev) => !prev); // Refresh data
        } else {
          Swal.fire('Error', result.message || 'Gagal menyimpan resume', 'error');
        }
      } else {
        Swal.fire('Error', 'Gagal memeriksa keberadaan data resume', 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Terjadi kesalahan saat menyimpan data', 'error');
    }
  };
  
  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl">Pengisian Resume Inventaris</h2>
      </div>
      <div className="mt-5 panel p-0 border-0 overflow-hidden">
        <div className="m-5">
          {/* Data Barang */}
          <div className="flex items-center justify-between mb-5">
            <h5 className="font-semibold text-lg dark:text-white-light">Data Barang</h5>
          </div>
          <hr className="border-white-light dark:border-[#1b2e4b] my-3" />
          <div className="mb-5 p-2">
            <div className="space-y-5">
              <div>
                <label className="mb-0">Nama Barang</label>
                <input className="form-input flex-1" value={dataBarang.nama_barang} readOnly />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-0">Kode Barang</label>
                  <input className="form-input flex-1" value={dataBarang.kode_barang} readOnly />
                </div>
                <div>
                  <label className="mb-0">Kategori Barang</label>
                  <input className="form-input flex-1" value={dataBarang.kategori_barang} readOnly />
                </div>
              </div>
            </div>
          </div>
          <hr className="border-white-light dark:border-[#1b2e4b] my-6" />
          {/* Data Resume Sebelumnya */}
          <div className="flex items-center justify-between mb-5">
            <h5 className="font-semibold text-lg dark:text-white-light">Resume Sebelumnya</h5>
          </div>
          <div className="mb-5 p-2 space-y-3">
            <div>
              <label>Kondisi Barang</label>
              <input
                className="form-input flex-1"
                value={resume.kondisi_barang || 'Belum ada data'}
                readOnly
              />
            </div>
            <div>
              <label>Keterangan</label>
              <textarea
                className="form-input flex-1"
                value={resume.keterangan || 'Belum ada data'}
                readOnly
              ></textarea>
            </div>
            <div>
              <label>Petugas</label>
              <input
                className="form-input flex-1"
                value={resume.petugas || 'Belum ada data'}
                readOnly
              />
            </div>
            <div>
              <label>Tanggal Dibuat</label>
              <input
                className="form-input flex-1"
                value={resume.created_at || 'Belum ada data'}
                readOnly
              />
            </div>
          </div>
          <hr className="border-white-light dark:border-[#1b2e4b] my-6" />
          {/* Form Resume Baru */}
          <div className="flex items-center justify-between mb-5">
            <h5 className="font-semibold text-lg dark:text-white-light">Tambah Resume Baru</h5>
          </div>
          <div className="mb-5 p-2">
            <form className="space-y-5" onSubmit={handleSave}>
              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2">Kondisi Barang</label>
                <select
                  className="form-input flex-1"
                  value={newResume.kondisi_barang}
                  onChange={(e) => setNewResume({ ...newResume, kondisi_barang: e.target.value })}
                  required
                >
                  <option value="">Pilih Kondisi</option>
                  <option value="Baru">Baru</option>
                  <option value="Seken">Seken</option>
                  <option value="Rusak">Rusak</option>
                </select>
              </div>
              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2">Keterangan</label>
                <textarea
                  className="form-input flex-1"
                  rows={4}
                  value={newResume.keterangan}
                  onChange={(e) => setNewResume({ ...newResume, keterangan: e.target.value })}
                  required
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary !mt-6 ">
                Simpan Resume
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditResume;
