import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl, getAuthHeaders } from '../../config/api';

interface Kategori {
  kategori_id: number;
  kategori: string;
}

interface Barang {
  id: number;
  kode_barang: string;
  nama_barang: string;
  jumlah: number;
  kategori?: Kategori;
}

const CetakLabel = () => {
  const navigate = useNavigate();
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [filteredItems, setFilteredItems] = useState<Barang[]>([]);

  useEffect(() => {
    fetchBarangs(); // Memuat data barang saat komponen dimuat
  }, []);

  const fetchBarangs = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      Swal.fire('Error', 'Authentication token is missing', 'error');
      return;
    }

    try {
      const response = await fetch(buildApiUrl('barang'), {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch barangs');
      }

      const data = await response.json();
      setBarangList(data.data || []);
      setFilteredItems(data.data || []);
    } catch (error) {
      console.error('Error fetching barangs:', error);
      Swal.fire('Error', 'Unable to fetch barangs', 'error');
    }
  };

  const navigateToPreview = (barang_id: number) => {
    navigate(`/apps/cetak-label/list-data-barang/${barang_id}`);
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl">Inventaris Barang</h2>
      </div>

      <div className="mt-5 panel p-0 border-0 overflow-hidden">
        <div className="table-responsive">
          <table className="table-striped table-hover w-full">
            <thead>
              <tr>
                <th>Kode Barang</th>
                <th>Nama Barang</th>
                <th>Kategori</th>
                <th className="p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? (
                filteredItems.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <td className="p-2">{record.kode_barang}</td>
                    <td className="p-2">{record.nama_barang}</td>
                    <td className="p-2">{record.kategori?.kategori || '-'}</td>
                    <td className="p-2 text-center align-middle">
                      <button
                        className="btn btn-sm btn-outline-primary mx-auto"
                        onClick={() => navigateToPreview(record.id)}
                      >
                        Lihat Inventaris
                      </button>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center p-4 text-gray-500 dark:text-gray-400"
                  >
                    Tidak ada data tersedia
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

export default CetakLabel;
