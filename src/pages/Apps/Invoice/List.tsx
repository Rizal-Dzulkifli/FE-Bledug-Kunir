import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

interface PengadaanItem {
  id: number;
  nomor_surat_permohonan: string | null;
  nomor_surat_pengadaan: string | null;
  tanggal_pengadaan: string;
  user_id: number;
  keterangan: string | null;
  status: string;
}

interface Props {
  status: 'permintaan' | 'pengajuan' | 'pengadaan';
}

const PengadaanList: React.FC<Props> = ({ status }) => {
  const [pengadaan, setPengadaan] = useState<PengadaanItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPengadaanData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3333/api/pengadaan?status=${status}`);
      const result = await response.json();
  
      // Debugging respons API
      console.log('Full API Response:', result);
  
      if (response.ok) {
        // Jika data ada dalam result.data
        if (Array.isArray(result.data)) {
          setPengadaan(result.data);
        } else {
          console.error('Unexpected data format:', result.data);
          Swal.fire('Error', 'Format data tidak sesuai', 'error');
        }
      } else {
        Swal.fire('Error', result.message || 'Gagal mengambil data pengadaan', 'error');
      }
    } catch (error) {
      console.error('Error fetching pengadaan data:', error);
      Swal.fire('Error', 'Terjadi kesalahan saat mengambil data pengadaan', 'error');
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    fetchPengadaanData();
  }, []);

  return (
    <div>
      <h2 className="text-xl">
        Pengadaan - {status.charAt(0).toUpperCase() + status.slice(1)}
      </h2>

      <div className="mt-5 panel p-0 border-0 overflow-hidden">
        <div className="table-responsive">
          <table className="table-striped table-hover">
            <thead>
              <tr>
                <th>No</th>
                <th>Nomor Surat</th>
                <th>Dari Nomor Permohonanssss</th>
                <th>Keterangan</th>
                
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center">
                    Loading...
                  </td>
                </tr>
              ) : pengadaan.length > 0 ? (
                pengadaan.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>
                      {
                        item.nomor_surat_pengadaan ||
                        'Tidak Diketahui'}
                    </td>
                    <td>
                      {
                        item.nomor_surat_permohonan ||
                        'Tidak Diketahui'}
                    </td>
                    <td>{item.keterangan || 'Tidak Ada Keterangan'}</td>
                    
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center">
                    Data tidak ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PengadaanList;
