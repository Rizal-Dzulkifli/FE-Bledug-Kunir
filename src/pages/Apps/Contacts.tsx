import { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconUser from '../../components/Icon/IconUser';
import IconX from '../../components/Icon/IconX';
import { Icon } from '@iconify-icon/react';
import { buildApiUrl, getAuthHeaders } from '../../config/api';

const Users = () => {
    interface User {
        user_id: number;
        nama: string;
        email: string;
        role: string;
        status: string;
    }
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Users'));
        fetchUsers();
    }, []);

    const [addUserModal, setAddUserModal] = useState<any>(false);
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    const handleFilterChange = () => {
        let filtered = userList;

        // Filter berdasarkan role jika role dipilih
        if (selectedRole) {
            filtered = filtered.filter((user: User) => user.role === selectedRole);
        }

        setFilteredItems(filtered); // Perbarui daftar yang difilter
    };

    // Reset filter saat semua pilihan dikosongkan
    useEffect(() => {
        handleFilterChange();
    }, [selectedRole]);

    const [viewType, setViewType] = useState<any>('grid');
    const [defaultParams] = useState({
        user_id: null,
        nama: '',
        role: '',
        email: '',
    });
    const [params, setParams] = useState<any>(JSON.parse(JSON.stringify(defaultParams)));
    const [userList, setUserList] = useState<any>([]);
    const [filteredItems, setFilteredItems] = useState<any>([]);
    const [search, setSearch] = useState<any>('');
    // Fungsi untuk mengambil data pengguna dari API
    const fetchUsers = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            Swal.fire('Error', 'Authentication token is missing', 'error');
            return;
        }

        try {
            const response = await fetch(buildApiUrl('users'), {
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const data = await response.json();
            setUserList(data.data || []);
            setFilteredItems(data.data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            Swal.fire('Error', 'Unable to fetch users', 'error');
        }
    };
    
    const fetchUserById = async (userId: any, callback: Function) => {
        const token = localStorage.getItem('token');
        if (!token) {
            Swal.fire('Error', 'Authentication token is missing', 'error');
            return;
        }

        try {

            const response = await fetch(buildApiUrl(`users/${userId}`), {
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user details');
            }

            const data = await response.json();


            setParams(data.data);
            callback(); // Panggil callback setelah params di-update

        } catch (error) {
            console.error('Error fetching user details:', error);
            Swal.fire('Error', 'Unable to fetch user details', 'error');
        }
    };

    const editUser = (user: any = null) => {
        if (user && user.user_id) {

            fetchUserById(user.user_id, () => {
                setAddUserModal(true); // Buka modal setelah params di-update
                // Pastikan params sudah terisi
            });
        } else {
            setParams({ ...defaultParams });
            setAddUserModal(true);

        }
    };

    const [errors, setErrors] = useState<any>({}); // State untuk pesan kesalahan

    const validateForm = () => {
        let formErrors: any = {};

        // Validasi nama
        if (!params.nama) {
            formErrors.nama = "Nama tidak boleh kosong.";
        }

        // Validasi email
        if (!params.email) {
            formErrors.email = "Email tidak boleh kosong.";
        } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(params.email)) {
            formErrors.email = "Email tidak valid.";
        }


        // Validasi role
        if (!params.role) {
            formErrors.role = "Silakan pilih peran (role).";
        }

        setErrors(formErrors);
        return Object.keys(formErrors).length === 0; // Jika tidak ada error, kembalikan true
    };

    const showMessage = (msg = '', type = 'success', isRtl = false) => {
        const toast: any = Swal.mixin({
            toast: true,
            position: isRtl ? 'bottom-start' : 'bottom-end', // posisi toast dinamis
            showConfirmButton: false,
            timer: 3000,
            customClass: { container: 'toast' },
        });
        toast.fire({
            icon: type,
            title: msg,
            padding: '10px 20px',
        });
    };
    const saveUser = async () => {
        if (!validateForm()) return; // Jika ada error, hentikan proses penyimpanan

        const token = localStorage.getItem('token');
        if (!token) {
            Swal.fire('Error', 'Authentication token is missing', 'error');
            return;
        }

        const isAddingUser = !params.user_id; // Cek apakah menambah user baru
        const userData = { ...params };
        const url = isAddingUser ? buildApiUrl('users') : buildApiUrl(`users/${params.user_id}`);
        const method = isAddingUser ? 'POST' : 'PUT';

        // Tampilkan loading spinner hanya jika menambah user baru
        if (isAddingUser) {
            Swal.fire({
                title: 'Menambah Users...',
                html: '<span class="animate-spin border-4 border-[#EF6823] border-l-transparent rounded-full w-10 h-10 inline-block align-middle m-auto mb-10 mt-5"></span>',
                showConfirmButton: false,
                allowOutsideClick: false,
            });
        }

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (isAddingUser) Swal.close(); // Tutup loading spinner jika ada error
                throw new Error('Failed to save user');
            }

            if (isAddingUser) Swal.close(); // Tutup loading spinner setelah sukses menambah user
            showMessage(params.user_id ? 'Pengguna berhasil diperbarui!' : 'Pengguna berhasil ditambahkan!', 'success', false);
            setAddUserModal(false);
            fetchUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            if (isAddingUser) Swal.close(); // Tutup loading spinner jika ada error
            Swal.fire('Error', 'Unable to save user', 'error');
        }
    };

    const showAlert = async (type: number, onConfirm: () => void) => {
        if (type === 11) {
            const swalWithBootstrapButtons = Swal.mixin({
                customClass: {
                    confirmButton: 'btn btn-danger',
                    cancelButton: 'btn btn-dark ltr:mr-3 rtl:ml-3',
                    popup: 'sweet-alerts',
                },
                buttonsStyling: false,
            });
            swalWithBootstrapButtons
                .fire({
                    title: 'Apakah Anda yakin?',
                    text: "Data ini akan dihapus dan tidak bisa dikembalikan!",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Ya, hapus!',
                    cancelButtonText: 'Tidak, batalkan!',
                    reverseButtons: true,
                    padding: '2em',
                })
                .then((result) => {
                    if (result.isConfirmed) {
                        onConfirm();
                        swalWithBootstrapButtons.fire('Terhapus!', 'Data pengguna berhasil dihapus.', 'success');
                    } else if (result.dismiss === Swal.DismissReason.cancel) {
                        swalWithBootstrapButtons.fire('Dibatalkan', 'Data pengguna aman :)', 'error');
                    }
                });
        }
    };
    const deleteUser = async (userId: any) => {
        const token = localStorage.getItem('token');
        if (!token) {
            Swal.fire('Error', 'Token autentikasi tidak ditemukan', 'error');
            return;
        }

        try {
            // Gunakan showAlert untuk konfirmasi sebelum penghapusan
            await showAlert(11, async () => {
                const response = await fetch(buildApiUrl(`users/${userId}`), {
                    method: 'DELETE',
                    headers: getAuthHeaders(),
                });

                if (!response.ok) {
                    throw new Error('Gagal menghapus pengguna');
                }

                fetchUsers(); // Refresh daftar pengguna setelah penghapusan
            });
        } catch (error) {
            console.error('Error deleting user:', error);
            Swal.fire('Error', 'Tidak dapat menghapus pengguna', 'error');
        }
    };



    const handleSearch = (query: string) => {
        setSearch(query); // Update nilai search dengan query yang baru

        const searchQuery = query.toLowerCase();
        const filtered = userList.filter((user: User) =>
            user.nama.toLowerCase().includes(searchQuery) ||
            user.email.toLowerCase().includes(searchQuery)
        );

        setFilteredItems(filtered); // Update daftar pengguna yang difilter
    };

    // Panggil handleSearch saat nilai search berubah


    return (
        <div>
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-xl">Pengguna</h2>
                <div className="flex sm:flex-row flex-col sm:items-center sm:gap-3 gap-4 w-full sm:w-auto">
                    <div className="flex gap-3">
                        <button type="button" className="btn bg-primary text-white btn-outline-primary" onClick={() => editUser()}>
                            <Icon icon="solar:user-plus-line-duotone" className="ltr:mr-2 rtl:ml-2" width="1.3rem" />
                            Tambah Pengguna
                        </button>
                        <button type="button" className={`btn btn-outline-primary p-2 ${viewType === 'grid' && 'bg-primary text-white'}`} onClick={() => setViewType('grid')}>
                            <Icon icon="solar:widget-line-duotone" width="1.3rem" />
                        </button>
                        <button type="button" className={`btn btn-outline-primary p-2 ${viewType === 'list' && 'bg-primary text-white'}`} onClick={() => setViewType('list')}>
                            <Icon icon="solar:checklist-line-duotone" width="1.3rem" />
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-primary p-2"
                            onClick={() => setIsFilterModalOpen(true)}
                        >
                            Filter
                        </button>
                    </div>
                    <Transition appear show={isFilterModalOpen} as={Fragment}>
                        <Dialog as="div" open={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} className="relative z-[51]">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0"
                                enterTo="opacity-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                            >
                                <div className="fixed inset-0 bg-[black]/60" />
                            </Transition.Child>
                            <div className="fixed inset-0 overflow-y-auto">
                                <div className="flex min-h-full items-center justify-center px-4 py-8">
                                    <Transition.Child
                                        as={Fragment}
                                        enter="ease-out duration-300"
                                        enterFrom="opacity-0 scale-95"
                                        enterTo="opacity-100 scale-100"
                                        leave="ease-in duration-200"
                                        leaveFrom="opacity-100 scale-100"
                                        leaveTo="opacity-0 scale-95"
                                    >
                                        <Dialog.Panel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg text-black dark:text-white-dark">
                                            <button
                                                type="button"
                                                onClick={() => setIsFilterModalOpen(false)}
                                                className="absolute top-4 ltr:right-4 rtl:left-4 text-gray-400 hover:text-gray-800 dark:hover:text-gray-600 outline-none"
                                            >
                                                <IconX />
                                            </button>
                                            <div className="text-lg font-medium bg-[#fbfbfb] dark:bg-[#121c2c] ltr:pl-5 rtl:pr-5 py-3 ltr:pr-[50px] rtl:pl-[50px]">
                                                Filter Pengguna
                                            </div>
                                            <div className="p-5">
                                                {/* Filter Berdasarkan Role */}
                                                <div className="mb-4">
                                                    <h3 className="font-semibold mb-2">Filter Berdasarkan Role</h3>
                                                    <label className="flex items-center space-x-2 mb-1">
                                                        <input
                                                            type="radio"
                                                            name="role"
                                                            value="admin"
                                                            checked={selectedRole === 'admin'}
                                                            onChange={() => setSelectedRole('admin')}
                                                            className="form-radio outline-warning peer"
                                                        />
                                                        <span>Admin</span>
                                                    </label>
                                                    <label className="flex items-center space-x-2 mb-1">
                                                        <input
                                                            type="radio"
                                                            name="role"
                                                            value="karyawan"
                                                            checked={selectedRole === 'karyawan'}
                                                            onChange={() => setSelectedRole('karyawan')}
                                                            className="form-radio outline-warning peer"
                                                        />
                                                        <span>Karyawan</span>
                                                    </label>
                                                    <label className="flex items-center space-x-2 mb-1">
                                                        <input
                                                            type="radio"
                                                            name="role"
                                                            value="driver"
                                                            checked={selectedRole === 'driver'}
                                                            onChange={() => setSelectedRole('driver')}
                                                            className="form-radio outline-warning peer"
                                                        />
                                                        <span>Driver</span>
                                                    </label>
                                                    <label className="flex items-center space-x-2 mb-1">
                                                        <input
                                                            type="radio"
                                                            name="role"
                                                            value=""
                                                            checked={selectedRole === null}
                                                            onChange={() => setSelectedRole(null)}
                                                            className="form-radio outline-warning peer"
                                                        />
                                                        <span>Semua Role</span>
                                                    </label>
                                                </div>

                                                <div className="flex justify-end items-center mt-8">
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-danger"
                                                        onClick={() => setIsFilterModalOpen(false)}
                                                    >
                                                        Tutup
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary ltr:ml-4 rtl:mr-4"
                                                        onClick={() => {
                                                            handleFilterChange();
                                                            setIsFilterModalOpen(false);
                                                        }}
                                                    >
                                                        Terapkan
                                                    </button>
                                                </div>
                                            </div>
                                        </Dialog.Panel>
                                    </Transition.Child>
                                </div>
                            </div>
                        </Dialog>
                    </Transition>

                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Cari Pengguna"
                            className="form-input py-2 ltr:pr-11 rtl:pl-11"
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                        <button type="button" className="absolute ltr:right-[11px] rtl:left-[11px] mt-2 ">
                            <Icon icon="solar:rounded-magnifer-line-duotone" width="1.3rem" />
                        </button>
                    </div>

                </div>
            </div>

            {/* Tampilan Grid */}
            {viewType === 'grid' && (
                <div className="grid 2xl:grid-cols-4 xl:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-6 mt-5 w-full">
                    {filteredItems.map((user: any) => (
                        <div className="bg-white dark:bg-[#1c232f] rounded-md overflow-hidden text-center shadow relative" key={user.user_id}>
                            <div className="bg-white dark:bg-[#1c232f] rounded-md overflow-hidden text-center ">
                                <div
                                    className="bg-primary rounded-t-md bg-center bg-cover p-20 pb-0"
                                    style={{
                                        backgroundImage: `url('/assets/images/notification-bg.png')`,
                                        backgroundRepeat: 'no-repeat',
                                        width: '100%',
                                        height: '100%',

                                    }}
                                >
                                    <img className="object-contain w-4/5 max-h-40 mx-auto" src={`/assets/images/${user.path}`} alt="gambar_pengguna" />
                                </div>
                                <div className="px-6 pb-24 -mt-10 relative">
                                    <div className="shadow-md bg-white dark:bg-gray-900 rounded-md px-2 py-4">
                                        <div className="text-xl">{user.nama}</div>
                                        <div className="text-white-dark">{user.role}</div>
                                    </div>
                                    <div className="mt-6 grid grid-cols-1 gap-4 ltr:text-left rtl:text-right">
                                        <div className="flex items-start">
                                            <div className="w-20">Email</div>
                                            <div className="w-2">:</div>
                                            <div className="flex-1 truncate text-white-dark">{user.email}</div>
                                        </div>
                                        <div className="flex items-start">
                                            <div className="w-20">Status</div>
                                            <div className="w-2">:</div>
                                            <div >
                                            <span className={`badge  ${user.status === 'active' ? 'badge-outline-success' : 'badge-outline-warning'}`}>
                                                    {user.status === 'active' ? 'Active' : 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 flex gap-4 absolute bottom-0 w-full ltr:left-0 rtl:right-0 p-6">
                                    <button type="button" className="btn btn-outline-primary w-1/2" onClick={() => editUser(user)}>
                                        Edit
                                    </button>
                                    <button type="button" className="btn btn-outline-danger w-1/2" onClick={() => deleteUser(user.user_id)}>
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tampilan List */}
            {viewType === 'list' && (
                <div className="mt-5 panel p-0 border-0 overflow-hidden">
                    <div className="table-responsive">
                        <table className="table-striped table-hover">
                            <thead>
                                <tr>
                                    <th>Nama</th>
                                    <th>Email</th>
                                    <th>Peran</th>
                                    <th>Status</th>
                                    <th className="!text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map((user: any) => {
                                let iconColor = "";
                                switch (user.role) {
                                    case 'karyawan':
                                        iconColor = "text-primary";
                                        break;
                                    case 'driver':
                                        iconColor = "text-success";
                                        break;
                                    default:
                                        iconColor = "text-danger";
                                }

                                return (
                                    <tr key={user.user_id}>
                                        <td>
                                            <div className="flex items-center w-max">
                                                <div className={`w-max ${iconColor}`}>
                                                    <IconUser className="w-6 h-6" />
                                                </div>
                                                <div className="p-2">{user.nama}</div>
                                            </div>
                                        </td>
                                        <td>{user.email}</td>
                                        <td>{user.role}</td>
                                        <td>
                                            <span className={`badge ${user.status === 'active' ? 'bg-success' : 'bg-warning'}`}>
                                                {user.status === 'active' ? 'Active' : 'Pending'}
                                            </span>
                                        </td>                                            <td>
                                                <div className="flex gap-4 items-center justify-center">
                                                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => editUser(user)}>
                                                        Edit
                                                    </button>
                                                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => deleteUser(user.user_id)}>
                                                        Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal Tambah/Edit Pengguna */}
            <Transition appear show={addUserModal} as={Fragment}>
                <Dialog as="div" open={addUserModal} onClose={() => setAddUserModal(false)} className="relative z-[51]">
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-[black]/60" />
                    </Transition.Child>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center px-4 py-8">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg text-black dark:text-white-dark">
                                    <button
                                        type="button"
                                        onClick={() => setAddUserModal(false)}
                                        className="absolute top-4 ltr:right-4 rtl:left-4 text-gray-400 hover:text-gray-800 dark:hover:text-gray-600 outline-none"
                                    >
                                        <IconX />
                                    </button>
                                    <div className="text-lg font-medium bg-[#fbfbfb] dark:bg-[#121c2c] ltr:pl-5 rtl:pr-5 py-3 ltr:pr-[50px] rtl:pl-[50px]">
                                        {params.user_id ? 'Edit Pengguna' : 'Tambah Pengguna'}
                                    </div>
                                    <div className="p-5">
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
                                                            checked={params.role === 'karyawan'}
                                                            onChange={(e) => setParams({ ...params, role: e.target.checked ? 'karyawan' : '' })}
                                                        />
                                                        <span className="ml-2">Karyawan</span>
                                                    </label>
                                                    <label className="inline-flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            className="form-checkbox outline-primary"
                                                            checked={params.role === 'driver'}
                                                            onChange={(e) => setParams({ ...params, role: e.target.checked ? 'driver' : '' })}
                                                        />
                                                        <span className="ml-2">Driver</span>
                                                    </label>
                                                </div>
                                                {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
                                            </div>

                                            <div className="flex justify-end items-center mt-8">
                                                <button type="button" className="btn btn-outline-danger" onClick={() => setAddUserModal(false)}>
                                                    Batal
                                                </button>
                                                <button type="button" className="btn btn-primary ltr:ml-4 rtl:mr-4" onClick={saveUser}>
                                                    {params.user_id ? 'Perbarui' : 'Tambah'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default Users;
