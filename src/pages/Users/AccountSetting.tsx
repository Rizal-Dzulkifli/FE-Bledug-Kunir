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


    const saveUser = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            Swal.fire('Error', 'Authentication token is missing', 'error');
            return;
        }

        const userData = { ...params, jurusan_id: params.jurusan?.jurusan_id || null };
        const url = buildApiUrl(`users/${params.user_id}`);

        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update user');
            }

            Swal.fire('Success', 'User data updated successfully', 'success');
        } catch (error) {
            console.error('Error updating user:', error);
            Swal.fire('Error', 'Unable to update user', 'error');
        }
    };
    return (
        <div>
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
                        <form className="border border-[#ebedf2] dark:border-[#191e3a] rounded-md p-4 mb-5 bg-white dark:bg-black">
                            <h6 className="text-lg font-bold mb-5">Information</h6>
                            <div className="flex flex-col sm:flex-row">

                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-1 gap-5">
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
                                            readOnly // Email hanya dapat dilihat
                                        />
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
                                        <p className="text-gray-700 dark:text-gray-300 mt-1">
                                            {params.role === 'admin' ? 'Admin' : params.role === 'guru' ? 'Guru' : 'User'}
                                        </p>
                                    </div>

                                    <div className="flex justify-end items-center mt-8">
                                        <button type="button" className="btn btn-primary ltr:ml-4 rtl:mr-4" onClick={saveUser}>
                                            Tambah
                                        </button>
                                    </div>
                                </div>
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
