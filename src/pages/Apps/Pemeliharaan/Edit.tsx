import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import IconSave from '../../../components/Icon/IconSave';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import { buildApiUrl, getAuthHeaders } from '../../../config/api';

interface ParamsState {
  biaya: number;
  keterangan: string;
}

interface Inventaris {
  kode_inventaris: string;
  nama_barang: string;
  keterangan: string;
}

interface PemeliharaanData {
  nomor_pemeliharaan: string;
  biaya: number;
  keterangan: string;
  inventaris: Inventaris;
}

const PemeliharaanEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [params, setParams] = useState<ParamsState>({
    biaya: 0,
    keterangan: '',
  });

  const [pemeliharaanData, setPemeliharaanData] = useState<PemeliharaanData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPemeliharaanData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      Swal.fire('Error', 'Authentication token is missing', 'error');
      return;
    }

    try {
      const response = await fetch(buildApiUrl(`pemeliharaan/${id}`), {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Gagal mengambil data pemeliharaan');

      const data = await response.json();
      setPemeliharaanData(data);
      setParams({
        biaya: data.biaya,
        keterangan: data.keterangan,
      });
    } catch (error) {
      Swal.fire('Error', 'Gagal mengambil data pemeliharaan', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem('token');
    if (!token) return Swal.fire('Error', 'Authentication token is missing', 'error');

    if (params.biaya <= 0 || !params.keterangan.trim()) {
      Swal.fire('Error', 'Biaya dan keterangan harus diisi.', 'error');
      return;
    }

    const payload = {
      biaya: params.biaya,
      keterangan: params.keterangan,
    };

    try {
      const response = await fetch(buildApiUrl(`pemeliharaan/${id}`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Gagal mengupdate data');

      Swal.fire('Sukses', 'Data berhasil diupdate', 'success').then(() => {
        navigate('/pemeliharaan'); // Navigasi kembali ke halaman daftar pemeliharaan
      });
    } catch (error) {
      Swal.fire('Error', (error as Error).message, 'error');
    }
  };

  useEffect(() => {
    dispatch(setPageTitle('Edit Pemeliharaan'));

    if (id) {
      fetchPemeliharaanData();
    }
  }, [id]);

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div className="flex xl:flex-row flex-col gap-2.5">
      <div className="panel px-0 flex-1 py-6 ltr:xl:mr-6 rtl:xl:ml-6">
        <div className="flex justify-between flex-wrap px-4">
          <div className="mb-6 lg:w-1/2 w-full">
            <div className="flex items-center text-black dark:text-white shrink-0">
              <img className="w-20 flex-none" src="/public/assets/images/auth/stmj.png" alt="logo" />
            </div>
            <div className="space-y-1 mt-6 text-gray-500 dark:text-gray-400">
              <div>Jl. Niken Gandini No.98, Plampitan, Setono, Kec. Jenangan, Kabupaten Ponorogo, Jawa Timur 63492</div>
              <div>info@smkn1jenpo.sch.id</div>
              <div>(0352) 481236</div>
            </div>
          </div>
        </div>
        <hr className="border-white-light dark:border-[#1b2e4b] my-6" />
        <div className="mt-8 px-4">
          <div className="flex">
            <div className="w-full ltr:lg:mr-6 rtl:lg:ml-6 mb-6">
              <div className="mt-4">
                <h2 className="text-lg font-semibold mb-4">Nomor Pemeliharaan: {pemeliharaanData?.nomor_pemeliharaan}</h2>
              </div>
              <div className="mt-4 flex items-center">
                <label htmlFor="biaya" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">Nominal</label>
                <input
                  type="number"
                  id="biaya"
                  name="biaya"
                  className="form-input"
                  value={params.biaya}
                  onChange={(e) => setParams({ ...params, biaya: Number(e.target.value) })}
                />
              </div>
              <div className="mt-4">
                <label className="block mb-2">Keterangan</label>
                <textarea
                  className="form-textarea"
                  value={params.keterangan}
                  onChange={(e) => setParams({ ...params, keterangan: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 px-4">
          <h3 className="text-lg font-semibold mb-4">Barang yang Diperbaiki</h3>
          <div className="table-responsive">
            <table className="table table-striped table-hover w-full">
              <thead>
                <tr>
                  <th>Kode Inventaris</th>
                  <th>Nama Barang</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {pemeliharaanData && (
                  <tr>
                    <td>{pemeliharaanData.inventaris.kode_inventaris}</td>
                    <td>{pemeliharaanData.inventaris.nama_barang}</td>
                    <td>{pemeliharaanData.inventaris.keterangan || 'Tidak Ada Keterangan'}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <hr className="border-white-light dark:border-[#1b2e4b] my-6" />
        <div className="flex justify-between flex-wrap px-4">
          <button type="button" className="btn btn-success w-full gap-2" onClick={handleSubmit}>
            <IconSave className="ltr:mr-2 rtl:ml-2 shrink-0" /> Simpan
          </button>
        </div>
      </div>
    </div>
  );
};

export default PemeliharaanEdit;
