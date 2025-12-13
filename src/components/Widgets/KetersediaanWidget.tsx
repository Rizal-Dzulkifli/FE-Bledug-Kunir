import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify-icon/react';
import PengadaanBarangMentahService, { RingkasanKetersediaan, BeratTersedia } from '../../services/PengadaanBarangMentahService';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

interface KetersediaanWidgetProps {
  className?: string;
  showDetailButton?: boolean;
  onDetailClick?: () => void;
}

const KetersediaanWidget: React.FC<KetersediaanWidgetProps> = ({ 
  className = '', 
  showDetailButton = true, 
  onDetailClick 
}) => {
  const [ringkasan, setRingkasan] = useState<RingkasanKetersediaan | null>(null);
  const [barangKritis, setBarangKritis] = useState<BeratTersedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    // Refresh data setiap 5 menit
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch ringkasan ketersediaan
      const ringkasanResponse = await PengadaanBarangMentahService.getRingkasanKetersediaan();
      setRingkasan(ringkasanResponse.data);

      // Fetch barang dengan ketersediaan rendah
      const ketersediaanResponse = await PengadaanBarangMentahService.getKetersediaanBerat();
      const barangKritisData = ketersediaanResponse.data.filter(item => item.berat_tersedia <= 10);
      setBarangKritis(barangKritisData);

    } catch (error) {
      console.error('Error fetching ketersediaan data:', error);
      setError('Gagal memuat data ketersediaan');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (count: number) => {
    if (count === 0) return { icon: 'heroicons:check-circle', color: 'text-success' };
    if (count <= 3) return { icon: 'heroicons:exclamation-triangle', color: 'text-warning' };
    return { icon: 'heroicons:x-circle', color: 'text-danger' };
  };

  if (loading) {
    return (
      <div className={`panel h-full ${className}`}>
        <div className="flex items-center justify-between mb-5">
          <h5 className="font-semibold text-lg dark:text-white-light">Ketersediaan Barang Mentah</h5>
          <div className="animate-spin w-5 h-5 border-2 border-primary border-l-transparent rounded-full"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`panel h-full ${className}`}>
        <div className="flex items-center justify-between mb-5">
          <h5 className="font-semibold text-lg dark:text-white-light">Ketersediaan Barang Mentah</h5>
          <button
            onClick={fetchData}
            className="btn btn-sm btn-outline-primary"
            type="button"
          >
            <Icon icon="heroicons:arrow-path" className="w-4 h-4" />
          </button>
        </div>
        <div className="text-center py-8">
          <Icon icon="heroicons:exclamation-triangle" className="w-12 h-12 text-warning mx-auto mb-3" />
          <p className="text-gray-500 mb-3">{error}</p>
          <button
            onClick={fetchData}
            className="btn btn-primary btn-sm"
            type="button"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (!ringkasan) {
    return (
      <div className={`panel h-full ${className}`}>
        <div className="text-center py-8">
          <Icon icon="heroicons:inbox" className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">Tidak ada data ketersediaan</p>
        </div>
      </div>
    );
  }

  const kritisIcon = getStatusIcon(ringkasan.barang_hampir_habis);

  return (
    <div className={`panel h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h5 className="font-semibold text-lg dark:text-white-light">
          Ketersediaan Barang Mentah
        </h5>
        <div className="flex items-center gap-2">
          <Tippy content="Refresh data">
            <button
              onClick={fetchData}
              className="btn btn-sm btn-outline-secondary hover:btn-secondary"
              type="button"
            >
              <Icon icon="heroicons:arrow-path" className="w-4 h-4" />
            </button>
          </Tippy>
          {showDetailButton && (
            <button
              onClick={onDetailClick}
              className="btn btn-sm btn-primary"
              type="button"
            >
              <Icon icon="heroicons:eye" className="w-4 h-4 mr-1" />
              Detail
            </button>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Total Jenis */}
        <div className="bg-primary-light/10 dark:bg-primary-dark-light/10 rounded-lg p-4">
          <div className="flex items-center">
            <div className="bg-primary/20 rounded-lg p-2 mr-3">
              <Icon icon="heroicons:cube" className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{ringkasan.total_jenis_barang}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Jenis</div>
            </div>
          </div>
        </div>

        {/* Status Kritis */}
        <div className={`${ringkasan.barang_hampir_habis > 0 ? 'bg-danger-light/10' : 'bg-success-light/10'} rounded-lg p-4`}>
          <div className="flex items-center">
            <div className={`${ringkasan.barang_hampir_habis > 0 ? 'bg-danger/20' : 'bg-success/20'} rounded-lg p-2 mr-3`}>
              <Icon 
                icon={kritisIcon.icon} 
                className={`w-6 h-6 ${ringkasan.barang_hampir_habis > 0 ? 'text-danger' : 'text-success'}`} 
              />
            </div>
            <div>
              <div className={`text-2xl font-bold ${ringkasan.barang_hampir_habis > 0 ? 'text-danger' : 'text-success'}`}>
                {ringkasan.barang_hampir_habis}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Hampir Habis</div>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Status */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-success rounded-full mr-2"></div>
            <span className="text-sm font-medium">Stok Aman</span>
          </div>
          <span className="font-semibold text-success">{ringkasan.barang_stok_aman}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-danger rounded-full mr-2"></div>
            <span className="text-sm font-medium">Hampir Habis</span>
          </div>
          <span className="font-semibold text-danger">{ringkasan.barang_hampir_habis}</span>
        </div>
      </div>

      {/* Total Nilai Stok
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Nilai Stok</span>
          <span className="font-bold text-lg">
            {PengadaanBarangMentahService.formatCurrency(ringkasan.total_nilai_stok)}
          </span>
        </div>
      </div> */}

      {/* Alert Barang Kritis */}
      {barangKritis.length > 0 && (
        <div className="border-t pt-4">
          <div className="flex items-center mb-3">
            <Icon icon="heroicons:exclamation-triangle" className="w-5 h-5 text-warning mr-2" />
            <span className="font-medium text-warning">Perlu Perhatian</span>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {barangKritis.slice(0, 3).map((item) => (
              <div key={item.id_barangmentah} className="flex items-center justify-between py-1 px-2 bg-warning-light/10 rounded">
                <div>
                  <div className="text-sm font-medium">{item.nama_barang}</div>
                  <div className="text-xs text-gray-500">{item.kode}</div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${item.berat_tersedia <= 5 ? 'text-danger' : 'text-warning'}`}>
                    {PengadaanBarangMentahService.formatWeight(item.berat_tersedia)}
                  </div>
                  <div className="text-xs text-gray-500">tersisa</div>
                </div>
              </div>
            ))}
            {barangKritis.length > 3 && (
              <div className="text-center py-1">
                <span className="text-xs text-gray-500">
                  +{barangKritis.length - 3} barang lainnya
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t pt-3 mt-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Terakhir diperbarui</span>
          <span>{new Date().toLocaleTimeString('id-ID')}</span>
        </div>
      </div>
    </div>
  );
};

export default KetersediaanWidget;