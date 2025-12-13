import PerfectScrollbar from 'react-perfect-scrollbar';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useLocation } from 'react-router-dom';
import { toggleSidebar } from '../../store/themeConfigSlice';
import AnimateHeight from 'react-animate-height';
import { IRootState } from '../../store';
import { useState, useEffect } from 'react';
import IconCaretsDown from '../Icon/IconCaretsDown';
import IconCaretDown from '../Icon/IconCaretDown';
import IconMinus from '../Icon/IconMinus';
import { Icon } from '@iconify-icon/react';
import { useAuth } from '../../contexts/AuthContext';


const Sidebar = () => {
    const [currentMenu, setCurrentMenu] = useState<string>('');
    const [errorSubMenu, setErrorSubMenu] = useState(false);
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const semidark = useSelector((state: IRootState) => state.themeConfig.semidark);
    const location = useLocation();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const { canAccessMenu, hasRole, state: authState } = useAuth();
    const toggleMenu = (value: string) => {
        setCurrentMenu((oldValue) => {
            return oldValue === value ? '' : value;
        });
    };

    useEffect(() => {
        const selector = document.querySelector('.sidebar ul a[href="' + window.location.pathname + '"]');
        if (selector) {
            selector.classList.add('active');
            const ul: any = selector.closest('ul.sub-menu');
            if (ul) {
                let ele: any = ul.closest('li.menu').querySelectorAll('.nav-link') || [];
                if (ele.length) {
                    ele = ele[0];
                    setTimeout(() => {
                        ele.click();
                    });
                }
            }
        }
    }, []);

    useEffect(() => {
        if (window.innerWidth < 1024 && themeConfig.sidebar) {
            dispatch(toggleSidebar());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location]);

    return (
        <div className={semidark ? 'dark' : ''}>
            <nav
                className={`sidebar fixed min-h-screen h-full top-0 bottom-0 w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] z-50 transition-all duration-300 ${semidark ? 'text-white-dark' : ''}`}
            >
                <div className="bg-white dark:bg-black h-full">
                    <div className="flex justify-between items-center px-4 py-3">
                        <NavLink to="/dashboard" className="main-logo flex items-center shrink-0">
                            <img 
                                className="ml-4 m-[5px] flex-none w-[150px] h-auto max-h-[70px] object-contain" 
                                src={themeConfig.theme === 'dark' ? "/assets/images/sidebar/logo_dark.png" : "/assets/images/sidebar/logo_white.png"} 
                                alt="logo" 
                            />

                        </NavLink>

                        <button
                            type="button"
                            className="collapse-icon w-8 h-8 rounded-full flex items-center hover:bg-gray-500/10 dark:hover:bg-dark-light/10 dark:text-white-light transition duration-300 rtl:rotate-180"
                            onClick={() => dispatch(toggleSidebar())}
                        >
                            <IconCaretsDown className="m-auto rotate-90" />
                        </button>
                    </div>
                    <PerfectScrollbar className="h-[calc(100vh-80px)] relative">
                         {/* User Info Section */}
                            {authState.user && (
                                <li className="menu nav-item">
                                    <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {authState.user.nama} 
                                        {/* - {authState.role === 'admin' ? 'Administrator' : authState.role === 'karyawan' ? 'Karyawan' : 'Driver'} */}
                                    </div>
                                </li>
                            )}
                        <ul className="relative font-semibold space-y-0.5 p-4 py-0">
                            {/* Dashboard - Available for all users */}
                            {canAccessMenu('dashboard') && (
                                <li className="menu nav-item"> 
                                    <NavLink to="/dashboard" className="group">
                                        <div className="flex items-center">
                                            <Icon icon="solar:chart-2-bold-duotone" className="icon-theme group-hover:!text-primary shrink-0" width="1.2rem" />
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-white/40 dark:group-hover:text-white-dark">{t('Dashboard')}</span>
                                        </div>
                                    </NavLink>            
                                </li>
                            )}
                            
                           

                            {/* Apps Section - Show based on role */}
                            {(canAccessMenu('inventaris') || canAccessMenu('masterdata') || canAccessMenu('produksi') || canAccessMenu('pemeliharaan')) && (
                                <>
                                    <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                                        <IconMinus className="w-4 h-5 flex-none hidden" />
                                        <span>{t('apps')}</span>
                                    </h2>

                                    <li className="nav-item">
                                        <ul>
                                            {/* Inventaris - Only for Admin */}
                                            {canAccessMenu('inventaris') && (
                                                <li className="menu nav-item">
                                                    <button type="button" className={`${currentMenu === 'inventaris' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('inventaris')}>
                                                        <div className="flex items-center">
                                                            <Icon
                                                                icon="solar:archive-bold-duotone"
                                                                className="icon-theme group-hover:!text-warning shrink-0"
                                                                width="1.2rem"
                                                            />
                                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-white/40 dark:group-hover:text-white-dark">{t('inventaris')}</span>
                                                        </div>
                                                        <div className={currentMenu !== 'inventaris' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                                            <IconCaretDown />
                                                        </div>
                                                    </button>
                                                    <AnimateHeight duration={300} height={currentMenu === 'inventaris' ? 'auto' : 0}>
                                                        <ul className="sub-menu text-gray-500">
                                                            <li>
                                                                <NavLink to="/inventaris/inventaris-barang">{t('inventaris_barang')}</NavLink>
                                                            </li>
                                                            <li>
                                                                <NavLink to="/inventaris/inventaris-produk">{t('inventaris_produk')}</NavLink>
                                                            </li>
                                                        </ul>
                                                    </AnimateHeight>
                                                </li>
                                            )}

                                            {/* Master Data - Only for Admin */}
                                            {canAccessMenu('masterdata') && (
                                                <li className="menu nav-item">
                                                    <button type="button" className={`${currentMenu === 'masterdata' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('masterdata')}>
                                                        <div className="flex items-center">
                                                            <Icon
                                                                icon="solar:layers-bold-duotone"
                                                                className="icon-theme group-hover:!text-warning shrink-0"
                                                                width="1.2rem"
                                                            />
                                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-white/40 dark:group-hover:text-white-dark">{t('masterdata')}</span>
                                                        </div>
                                                        <div className={currentMenu !== 'masterdata' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                                            <IconCaretDown />
                                                        </div>
                                                    </button>
                                                    <AnimateHeight duration={300} height={currentMenu === 'masterdata' ? 'auto' : 0}>
                                                        <ul className="sub-menu text-gray-500">
                                                            <li>
                                                                <NavLink to="/masterdata/supplier">{t('supplier')}</NavLink>
                                                            </li>
                                                            <li>
                                                                <NavLink to="/masterdata/pelanggan">{t('pelanggan')}</NavLink>
                                                            </li>
                                                            <li>
                                                                <NavLink to="/masterdata/nama-barang-mentah">{t('nama_barang_mentah')}</NavLink>
                                                            </li>
                                                            <li>
                                                                <NavLink to="/masterdata/nama-produk">{t('nama_produk')}</NavLink>
                                                            </li>
                                                            <li>
                                                                <NavLink to="/masterdata/asset">{t('asset')}</NavLink>
                                                            </li>
                                                        </ul>
                                                    </AnimateHeight>
                                                </li>
                                            )}

                                            {/* Produksi - For Admin and Karyawan */}
                                            {canAccessMenu('produksi') && (
                                                <li className="menu nav-item">
                                                    {hasRole('karyawan') ? (
                                                        // Karyawan gets a submenu
                                                        <>
                                                            <button type="button" className={`${currentMenu === 'produksi-karyawan' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('produksi-karyawan')}>
                                                                <div className="flex items-center">
                                                                    <Icon
                                                                        icon="solar:widget-add-bold-duotone"
                                                                        className="icon-theme group-hover:!text-warning shrink-0"
                                                                        width="1.2rem"
                                                                    />
                                                                    <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-white/40 dark:group-hover:text-white-dark">Produksi Saya</span>
                                                                </div>
                                                                <div className={currentMenu !== 'produksi-karyawan' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                                                    <IconCaretDown />
                                                                </div>
                                                            </button>
                                                            <AnimateHeight duration={300} height={currentMenu === 'produksi-karyawan' ? 'auto' : 0}>
                                                                <ul className="sub-menu text-gray-500">
                                                                    <li>
                                                                        <NavLink to="/apps/produksi/karyawan">Dashboard</NavLink>
                                                                    </li>
                                                                    <li>
                                                                        <NavLink to="/apps/produksi/karyawan/riwayat">Riwayat Produksi</NavLink>
                                                                    </li>
                                                                    <li>
                                                                        <NavLink to="/apps/produksi/karyawan/statistik">Statistik Kinerja</NavLink>
                                                                    </li>
                                                                </ul>
                                                            </AnimateHeight>
                                                        </>
                                                    ) : (
                                                        // Admin gets direct link
                                                        <NavLink to="/apps/produksi" className="group">
                                                            <div className="flex items-center">
                                                                <Icon
                                                                    icon="solar:widget-add-bold-duotone"
                                                                    className="icon-theme group-hover:!text-warning shrink-0"
                                                                    width="1.2rem"
                                                                />
                                                                <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-white/40 dark:group-hover:text-white-dark">{t('produksi')}</span>
                                                            </div>
                                                        </NavLink>
                                                    )}
                                                </li>
                                            )}

                                            {/* Pemeliharaan - Only for Admin */}
                                            {canAccessMenu('pemeliharaan') && (
                                                <li className="nav-item">
                                                    <NavLink to="/pemeliharaan" className="group">
                                                        <div className="flex items-center">
                                                            <Icon
                                                                icon="solar:settings-bold-duotone"
                                                                className="icon-theme group-hover:!text-warning shrink-0"
                                                                width="1.2rem"
                                                            />
                                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-white/40 dark:group-hover:text-white-dark">{t('pemeliharaan')}</span>
                                                        </div>
                                                    </NavLink>
                                                </li>
                                            )}
                                        </ul>
                                    </li>
                                </>
                            )}

                            {/* Transaksi Section - Pengadaan, Pesanan for Admin, Pengiriman for Driver */}
                            {(canAccessMenu('pengadaan') || canAccessMenu('pesanan') || canAccessMenu('pengiriman')) && (
                                <>
                                    <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                                        <IconMinus className="w-4 h-5 flex-none hidden" />
                                        <span>{t('transaksi')}</span>
                                    </h2>
                                    
                                    {/* Pengadaan - Only for Admin */}
                                    {canAccessMenu('pengadaan') && (
                                        <li className="nav-item">
                                            <NavLink to="/apps/pengadaan" className="group">
                                                <div className="flex items-center">
                                                    <Icon
                                                        icon="solar:inbox-in-bold-duotone"
                                                        className="icon-theme group-hover:!text-warning shrink-0"
                                                        width="1.2rem"
                                                    />
                                                    <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-white/40 dark:group-hover:text-white-dark">{t('pengadaan')}</span>
                                                </div>
                                            </NavLink>
                                        </li>
                                    )}

                                    {/* Pesanan - Only for Admin */}
                                    {canAccessMenu('pesanan') && (
                                        <li className="nav-item">
                                            <NavLink to="/apps/pesanan" className="group">
                                                <div className="flex items-center">
                                                    <Icon
                                                        icon="solar:cart-3-bold-duotone"
                                                        className="icon-theme group-hover:!text-primary shrink-0"
                                                        width="1.2rem"
                                                    />
                                                    <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-white/40 dark:group-hover:text-white-dark">{t('pesanan')}</span>
                                                </div>
                                            </NavLink>
                                        </li>
                                    )}

                                    {/* Pengiriman - Admin, Karyawan, Driver */}
                                    {canAccessMenu('pengiriman') && (
                                        <li className="nav-item">
                                            <NavLink to="/apps/pengiriman" className="group">
                                                <div className="flex items-center">
                                                    <Icon
                                                        icon="solar:delivery-bold-duotone"
                                                        className="icon-theme group-hover:!text-success shrink-0"
                                                        width="1.2rem"
                                                    />
                                                    <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-white/40 dark:group-hover:text-white-dark">Pengiriman</span>
                                                </div>
                                            </NavLink>
                                        </li>
                                    )}

                                    {/* Laporan Pendapatan - Driver Only */}
                                    {authState.role === 'driver' && (
                                        <li className="nav-item">
                                            <NavLink to="/driver/laporan-gaji" className="group">
                                                <div className="flex items-center">
                                                    <Icon
                                                        icon="solar:chart-bold-duotone"
                                                        className="icon-theme group-hover:!text-warning shrink-0"
                                                        width="1.2rem"
                                                    />
                                                    <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-white/40 dark:group-hover:text-white-dark">Laporan Pendapatan</span>
                                                </div>
                                            </NavLink>
                                        </li>
                                    )}
                                </>
                            )}

                            {/* Keuangan Section - Only for Admin */}
                            {canAccessMenu('keuangan') && (
                                <>
                                    <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                                        <IconMinus className="w-4 h-5 flex-none hidden" />
                                        <span>{t('keuangan')}</span>
                                    </h2>
                                    
                                    <li className="nav-item">
                                        <NavLink to="/keuangan/dashboard" className="group">
                                            <div className="flex items-center">
                                                <Icon
                                                    icon="solar:chart-2-bold-duotone"
                                                    className="icon-theme group-hover:!text-warning shrink-0"
                                                    width="1.2rem"
                                                />
                                                <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-white/40 dark:group-hover:text-white-dark">Dashboard</span>
                                            </div>
                                        </NavLink>
                                    </li>
                                    
                                    <li className="nav-item">
                                        <NavLink to="/keuangan/transaksi" className="group">
                                            <div className="flex items-center">
                                                <Icon
                                                    icon="solar:dollar-bold-duotone"
                                                    className="icon-theme group-hover:!text-warning shrink-0"
                                                    width="1.2rem"
                                                />
                                                <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-white/40 dark:group-hover:text-white-dark">Transaksi</span>
                                            </div>
                                        </NavLink>
                                    </li>
                                    
                                    <li className="nav-item">
                                        <NavLink to="/keuangan/transaksi-terpadu" className="group">
                                            <div className="flex items-center">
                                                <Icon
                                                    icon="solar:bill-list-bold-duotone"
                                                    className="icon-theme group-hover:!text-warning shrink-0"
                                                    width="1.2rem"
                                                />
                                                <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-white/40 dark:group-hover:text-white-dark">Transaksi Terpadu</span>
                                            </div>
                                        </NavLink>
                                    </li>
                                    
                                    <li className="nav-item">
                                        <NavLink to="/keuangan/laporan-terpadu" className="group">
                                            <div className="flex items-center">
                                                <Icon
                                                    icon="solar:document-text-bold-duotone"
                                                    className="icon-theme group-hover:!text-warning shrink-0"
                                                    width="1.2rem"
                                                />
                                                <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-white/40 dark:group-hover:text-white-dark">Laporan Terpadu</span>
                                            </div>
                                        </NavLink>
                                    </li>
                                </>
                            )}

                            {/* User Management - Only for Admin */}
                            {canAccessMenu('users') && (
                                <>
                                    <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                                        <IconMinus className="w-4 h-5 flex-none hidden" />
                                        <span>{t('user')}</span>
                                    </h2>
                                    <li className="nav-item">
                                        <NavLink to="/apps/contacts" className="group">
                                            <div className="flex items-center">
                                                <Icon
                                                    icon="solar:users-group-rounded-bold-duotone"
                                                    className="icon-theme group-hover:!text-warning shrink-0"
                                                    width="1.2rem"
                                                />
                                                <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-white/40 dark:group-hover:text-white-dark">{t('users')}</span>
                                            </div>
                                        </NavLink>
                                    </li>
                                </>
                            )}
                            
                            {/* Penggajian - Only for Admin */}
                            {canAccessMenu('gaji') && (
                                <>
                                    <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                                        <IconMinus className="w-4 h-5 flex-none hidden" />
                                        <span>{t('penggajian')}</span>
                                    </h2>
                                    <li className="nav-item">
                                        <NavLink to="/penggajian/setting-gaji" className="group">
                                            <div className="flex items-center">
                                                <Icon
                                                    icon="solar:wallet-money-bold-duotone"
                                                    className="icon-theme group-hover:!text-warning shrink-0"
                                                    width="1.2rem"
                                                />
                                                <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-white/40 dark:group-hover:text-white-dark">{t('setting_gaji')}</span>
                                            </div>
                                        </NavLink>
                                    </li>
                                </>
                            )}
                            {/* <li className="nav-item">
                                <NavLink to="/penggajian/perhitungan-gaji" className="group">
                                    <div className="flex items-center">
                                        <Icon
                                            icon="solar:calculator-bold-duotone"
                                            className="icon-theme group-hover:!text-warning shrink-0"
                                            width="1.2rem"
                                        />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-white/40 dark:group-hover:text-white-dark">{t('perhitungan_gaji')}</span>
                                    </div>
                                </NavLink>
                            </li> */}

                        </ul>
                    </PerfectScrollbar>
                </div>
            </nav>
        </div>
    );
};

export default Sidebar;
