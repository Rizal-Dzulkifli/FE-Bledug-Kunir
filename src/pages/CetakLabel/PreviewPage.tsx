import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Barcode from 'react-barcode';

interface Inventaris {
    id: number;
    kode_inventaris: string;
    nama_barang?: string;
    lokasi?: string;
}

const PreviewPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const selectedItems: Inventaris[] = location.state?.selectedItems || [];

    const handleBack = () => {
        navigate(-1); // Kembali ke halaman sebelumnya
    };

    if (selectedItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <p>Tidak ada data untuk ditampilkan.</p>
                <button onClick={handleBack} className="btn btn-primary mt-4">
                    Kembali
                </button>
            </div>
        );
    }

    return (
        <div className="p-4">

            <div
                className="print-container"
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)", // Tiga kolom
                    gap: "0", // Hilangkan jarak antar elemen
                    width: "29.7cm", // Lebar A4 landscape
                    height: "21cm", // Tinggi A4 landscape
                    margin: "0 auto",
                }}
            >
                {selectedItems.map((item, index) => (
                    <div key={index} className="barcode-item">
                        <BarcodeItem item={item} />
                    </div>
                ))}
            </div>
        </div>
    );
};


// Komponen untuk menampilkan barcode dan informasi dalam satu elemen
const BarcodeItem: React.FC<{ item: Inventaris }> = ({ item }) => (
    <div className="bg-white border border-black text">
        <div className="flex items-center justify-center text-xs">
            <b>{item.nama_barang}</b>
        </div>

        <hr className="border-black" />
        <div className="pl-5 p-3 flex items-center flex-col sm:flex-row">
            <div className="w-[1.5cm] h-[1.5cm] rounded-full overflow-hidden">
                <img
                    src="/public/assets/images/auth/stmj.png"
                    alt="logo"
                    className="w-full h-full object-cover"
                />
            </div>
            <div className="flex-1 ltr:sm:pl-5 rtl:sm:pr-5 text-center sm:text-left">
                {/* Barcode dengan ukuran lebih kecil */}
                <Barcode
                    value={item.kode_inventaris}
                    width={1.5} // Lebar tiap bar
                    height={30} // Tinggi barcode
                    fontSize={20} // Ukuran font di bawah barcode
                />
            </div>
        </div>
        <hr className="border-black" />

        <div className="h-[20px] flex items-center justify-center">
            {item.lokasi !== "Tidak Ditempatkan" && item.lokasi && (
                <div className="flex items-center justify-center m-1 text-xs ">
                    {item.lokasi}
                </div>
            )}
        </div>
    </div>
);


export default PreviewPage;
