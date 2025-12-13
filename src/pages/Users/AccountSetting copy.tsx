import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import IconHome from '../../components/Icon/IconHome';
import Swal from 'sweetalert2';
import { buildApiUrl, getAuthHeaders } from '../../config/api';

interface User {
    user_id: number;
    nama: string;
    email: string;
    role: string;
    status: string;
    jurusan?: {
        jurusan_id: string;
        ruangan?: string; // Ruangan menjadi opsional
    };
}

interface UserProfile {
    name: string;
    email: string;
    initials: string;
}

const AccountSetting = () => {
    const dispatch = useDispatch();
    const [tabs, setTabs] = useState<string>('home');
    const [params, setParams] = useState<User>({
        user_id: 0,
        nama: '',
        email: '',
        role: '',
        status: '',
    });
    const [jurusanList, setJurusanList] = useState<{ jurusan_id: string; ruangan: string }[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [user, setUser] = useState<UserProfile | null>(null);

    useEffect(() => {
        dispatch(setPageTitle('Account Setting'));
        fetchUserProfile();
        fetchJurusanList();
    }, [dispatch]);

    const fetchJurusanList = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            Swal.fire('Error', 'Authentication token is missing', 'error');
            return;
        }

        try {
            const response = await fetch(buildApiUrl('jurusans'), {
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch jurusan list');
            }

            const data = await response.json();
            const jurusanData = data.data || data;
            setJurusanList(jurusanData);
        } catch (error) {
            console.error('Error fetching jurusan list:', error);
            Swal.fire('Error', 'Unable to fetch jurusan list', 'error');
        }
    };

    const fetchUserProfile = async () => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('user_id');
        if (!token || !userId) return;
    
        try {
            const response = await fetch(buildApiUrl(`users/${userId}`), {
                headers: getAuthHeaders(),
            });
    
            if (response.ok) {
                const data = await response.json();
                // Set state params untuk mengisi form
                setParams({
                    user_id: data.data.user_id,
                    nama: data.data.nama,
                    email: data.data.email,
                    role: data.data.role,
                    status: data.data.status,
                    jurusan: data.data.jurusan
                        ? {
                              jurusan_id: data.data.jurusan_id || '',
                              ruangan: data.data.jurusan?.ruangan || '',
                          }
                        : undefined,
                });
    
                // Mengambil inisial (opsional untuk header atau avatar)
                const fullName = data.data.nama;
                const initials = fullName
                    .split(' ')
                    .map((word: string) => word[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();
                setUser({ name: fullName, email: data.data.email, initials });
            } else {
                console.error('Failed to fetch user profile');
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    };
    


    const toggleTabs = (name: string) => {
        setTabs(name);
    };

    const saveUser = () => {
        // Implementasi simpan data pengguna
        Swal.fire('Success', 'Data berhasil disimpan', 'success');
    };

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li>
                    <Link to="#" className="text-primary hover:underline">
                        Account Settings
                    </Link>
                </li>
            </ul>
            <div className="pt-5">
                <div className="flex items-center justify-between mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">Settings</h5>
                </div>
                <div>
                    <ul className="sm:flex font-semibold border-b border-[#ebedf2] dark:border-[#191e3a] mb-5 whitespace-nowrap overflow-y-auto">
                        <li className="inline-block">
                            <button
                                onClick={() => toggleTabs('home')}
                                className={`flex gap-2 p-4 border-b border-transparent hover:border-primary hover:text-primary ${tabs === 'home' ? '!border-primary text-primary' : ''}`}
                            >
                                <IconHome />
                                Profil
                            </button>
                        </li>
                    </ul>
                </div>
                {tabs === 'home' ? (
                    <div>
                        <form>
                            <div className="mb-5">
                                <label htmlFor="name">Nama</label>
                                <input
                                    id="name"
                                    type="text"
                                    placeholder="Masukkan Nama"
                                    className="form-input"
                                    value={params.nama}
                                    onChange={(e) => setParams({ ...params, nama: e.target.value })}
                                />
                                {errors.nama && <p className="text-red-500 text-sm mt-1">{errors.nama}</p>}
                            </div>

                            <div className="mb-5">
                                <label htmlFor="email">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="Masukkan Email"
                                    className="form-input"
                                    value={params.email}
                                    onChange={(e) => setParams({ ...params, email: e.target.value })}
                                />
                                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                            </div>

                            <div className="mb-5">
                                <label htmlFor="jurusan_id">Jurusan</label>
                                <select
                                    id="jurusan_id"
                                    className="form-select"
                                    value={params.jurusan?.jurusan_id || ''}
                                    onChange={(e) => setParams({ ...params, jurusan: { ...params.jurusan, jurusan_id: e.target.value || '' } })}
                                >
                                    <option value="">Pilih Jurusan</option>
                                    {jurusanList.map((jurusan) => (
                                        <option key={jurusan.jurusan_id} value={jurusan.jurusan_id}>
                                            {jurusan.ruangan}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-5">
                                <label htmlFor="role">Peran</label>
                                <div className="flex items-center space-x-4 mt-3">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="checkbox"
                                            className="form-checkbox outline-primary"
                                            checked={params.role === 'admin'}
                                            onChange={(e) => setParams({ ...params, role: e.target.checked ? 'admin' : '' })}
                                        />
                                        <span className="ml-2">Admin</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="checkbox"
                                            className="form-checkbox outline-primary"
                                            checked={params.role === 'guru'}
                                            onChange={(e) => setParams({ ...params, role: e.target.checked ? 'guru' : '' })}
                                        />
                                        <span className="ml-2">Guru</span>
                                    </label>
                                </div>
                                {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
                            </div>

                            <div className="flex justify-end items-center mt-8">
                                <button type="button" className="btn btn-outline-danger" onClick={() => setTabs('home')}>
                                    Batal
                                </button>
                                <button type="button" className="btn btn-primary ltr:ml-4 rtl:mr-4" onClick={saveUser}>
                                    {params.user_id ? 'Perbarui' : 'Tambah'}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    ''
                )}
            </div>
        </div>
    );
};

export default AccountSetting;
