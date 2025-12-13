import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { setPageTitle } from '../../../store/themeConfigSlice';
import { buildApiUrl, getAuthHeaders } from '../../../config/api';
import IconPrinter from '../../../components/Icon/IconPrinter';
import IconEdit from '../../../components/Icon/IconEdit';

interface Barang {
  id: number;
  nama_barang: string;
}

interface Inventaris {
  inventaris_id: number;
  kode_inventaris: string;
  barang: Barang | null;
}

interface Pemeliharaan {
  pemeliharaan_id: number;
  nomor_pemeliharaan: string;
  biaya: number;
  keterangan: string;
  created_at: string | null;
  user: {
    user_id: number;
    nama: string;
  };
  inventaris: Inventaris;
}

const PreviewPemeliharaan = () => {
  const dispatch = useDispatch();
  const { id } = useParams();
  const [data, setData] = useState<Pemeliharaan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(setPageTitle('Preview Pemeliharaan'));
  }, [dispatch]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          throw new Error('Token not found');
        }

        const response = await fetch(buildApiUrl(`pemeliharaan/${id}`), {
          method: 'GET',
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const exportTable = () => {
    window.print();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!data) {
    return <div>No data available</div>;
  }

  return (
    <div>
      <div className="flex items-center lg:justify-end justify-center flex-wrap gap-4 mb-6">
        <button type="button" className="btn btn-primary gap-2" onClick={exportTable}>
          <IconPrinter />
          Print
        </button>
        <Link to={`/pemeliharaan/edit/${id}`} className="btn btn-warning gap-2">
          <IconEdit />
          Edit
        </Link>
      </div>
      <div className="panel">
        <div className="flex justify-between flex-wrap gap-4 px-4">
          <div className="text-2xl font-semibold uppercase">Pemeliharaan</div>
          <div className="shrink-0">
            <img className="w-20 flex-none" src="/public/assets/images/auth/stmj.png" alt="logo" />
          </div>
        </div>
        <div className="ltr:text-right rtl:text-left px-4">
          <div className="space-y-1 mt-6 text-white-dark">
            <div>Jl. Niken Gandini No.98, Plampitan, Setono, Kec. Jenangan, Kabupaten Ponorogo, Jawa Timur 63492</div>
            <div>info@smkn1jenpo.sch.id</div>
            <div>(0352) 481236</div>
          </div>
        </div>

        <hr className="border-white-light dark:border-[#1b2e4b] my-6" />
        <div className="flex justify-between lg:flex-row flex-col gap-6 flex-wrap">
          <div className="flex-1">
            <div className="space-y-1 text-white-dark">
              <div>Nomor Pemeliharaan:</div>
              <div className="text-black dark:text-white font-semibold">{data.nomor_pemeliharaan}</div>
            </div>
          </div>
          <div className="flex justify-between sm:flex-row flex-col gap-6 lg:w-2/3">
            <div className="xl:1/3 lg:w-2/5 sm:w-1/2">
              <div>Dibuat oleh:</div>
              <div className="text-black dark:text-white font-semibold">{data.user.nama}</div>
            </div>
            <div className="xl:1/3 lg:w-2/5 sm:w-1/2">
              <div className="flex items-center w-full justify-between mb-2">
                <div>Tanggal Pemeliharaan:</div>
                <div className="text-black dark:text-white font-semibold">{data.created_at || 'Tidak Tersedia'}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-between lg:flex-row flex-col gap-6 mt-6 flex-wrap">
          <div className="flex-1">
            <div className="space-y-1 text-white-dark">
              <div>Keterangan:</div>
              <div className="text-black dark:text-white">{data.keterangan}</div>
            </div>
          </div>
          <div className="flex-1">
            <div className="space-y-1 text-white-dark">
              <div>Biaya:</div>
              <div className="text-black dark:text-white">{data.biaya}</div>
            </div>
          </div>
        </div>
        <div className="table-responsive mt-6">
          <table className="table-striped">
            <thead>
              <tr>
                <th>Kode Inventaris</th>
                <th>Nama Barang</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{data.inventaris.kode_inventaris}</td>
                <td>{data.inventaris.barang?.nama_barang || 'Tidak Tersedia'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PreviewPemeliharaan;
