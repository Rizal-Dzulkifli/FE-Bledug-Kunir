import { lazy } from 'react';
import ProtectedRoute from './ProtectedRoute';
const Index = lazy(() => import('../pages/Dashboard'));
const Analytics = lazy(() => import('../pages/Analytics'));
const Todolist = lazy(() => import('../pages/Apps/Todolist'));
const Mailbox = lazy(() => import('../pages/Apps/Mailbox'));
const Notes = lazy(() => import('../pages/Apps/Notes'));
const Contacts = lazy(() => import('../pages/Apps/Contacts'));
const Chat = lazy(() => import('../pages/Apps/Chat'));
const Scrumboard = lazy(() => import('../pages/Apps/Scrumboard'));
const Calendar = lazy(() => import('../pages/Apps/Calendar'));
const CetakLabel = lazy(() => import('../pages/CetakLabel/CetakLabel'));
const ListDataBarang = lazy(() => import('../pages/CetakLabel/ListDataBarang'));
const ViewDataBarang = lazy(() => import('../pages/CetakLabel/PreviewPage'));
const PemeliharaanInventarisAdd = lazy(() => import('../pages/Apps/Pemeliharaan/Add'));
const PemeliharaanInventarisEdit = lazy(() => import('../pages/Apps/Pemeliharaan/Edit'));
const PemeliharaanInventarisView = lazy(() => import('../pages/Apps/Pemeliharaan/Preview'));
const PemeliharaanInventaris = lazy(() => import('../pages/Apps/Pemeliharaan/List'));
const MutasiInventarisAdd = lazy(() => import('../pages/Apps/Mutasi/Add'));
const MutasiInventaris = lazy(() => import('../pages/Apps/Mutasi/List'));
const MutasiInventarisView = lazy(() => import('../pages/Apps/Mutasi/Preview'));
const PenempatanInventarisAdd = lazy(() => import('../pages/Apps/Penempatan/Add'));
const PenempatanInventarisView = lazy(() => import('../pages/Apps/Penempatan/Preview'));
const PenempatanInventaris = lazy(() => import('../pages/Apps/Penempatan/List'));
const PeminjamanInventarisAdd = lazy(() => import('../pages/Apps/Peminjaman/Add'));
const PeminjamanInventarisView = lazy(() => import('../pages/Apps/Peminjaman/Preview'));
const PeminjamanInventaris = lazy(() => import('../pages/Apps/Peminjaman/List'));
const PenghapusanInventarisAdd = lazy(() => import('../pages/Apps/Penghapusan/Add'));
const PenghapusanInventarisView = lazy(() => import('../pages/Apps/Penghapusan/Preview'));
const PenghapusanInventaris = lazy(() => import('../pages/Apps/Penghapusan/List'));
const PermintaanPermohonan = lazy(() => import('../pages/Apps/Invoice/Permohonan'));
const PermintaanPengajuan= lazy(() => import('../pages/Apps/Invoice/Pengajuan'));

// Produksi pages
const ProduksiList = lazy(() => import('../pages/Apps/Produksi/List'));
const ProduksiAdd = lazy(() => import('../pages/Apps/Produksi/Add'));
const ProduksiEdit = lazy(() => import('../pages/Apps/Produksi/Edit'));
const ProduksiPreview = lazy(() => import('../pages/Apps/Produksi/Preview'));

// Karyawan Produksi pages
const KaryawanProduksi = lazy(() => import('../pages/Apps/Produksi/Karyawan'));
const DetailKaryawan = lazy(() => import('../pages/Apps/Produksi/DetailKaryawan'));  
const RiwayatKaryawan = lazy(() => import('../pages/Apps/Produksi/RiwayatKaryawan'));
const StatistikKaryawan = lazy(() => import('../pages/Apps/Produksi/StatistikKaryawan'));

// Pengadaan pages
const PengadaanList = lazy(() => import('../pages/Apps/Pengadaan/List'));
const PengadaanAdd = lazy(() => import('../pages/Apps/Pengadaan/Add'));
const PengadaanEdit = lazy(() => import('../pages/Apps/Pengadaan/Edit'));
const PengadaanPreview = lazy(() => import('../pages/Apps/Pengadaan/Preview'));

// Pesanan pages
const PesananList = lazy(() => import('../pages/Apps/Pesanan/List'));
const PesananAdd = lazy(() => import('../pages/Apps/Pesanan/Add'));
const PesananEdit = lazy(() => import('../pages/Apps/Pesanan/Edit'));
const PesananPreview = lazy(() => import('../pages/Apps/Pesanan/Preview'));

// Keuangan Eksternal pages
const KeuanganDashboard = lazy(() => import('../pages/Keuangan/Dashboard'));

const KeuanganForm = lazy(() => import('../pages/Keuangan/Form'));
const KeuanganTransaksi = lazy(() => import('../pages/Keuangan/Transaksi'));
const KeuanganLaporan = lazy(() => import('../pages/Keuangan/Laporan'));
const KeuanganLaporanBulanan = lazy(() => import('../pages/Keuangan/LaporanBulanan'));
const KeuanganLaporanTerpadu = lazy(() => import('../pages/Keuangan/LaporanTerpadu'));
const KeuanganProyeksi = lazy(() => import('../pages/Keuangan/Proyeksi'));
const KeuanganTransaksiTerpadu = lazy(() => import('../pages/keuangan-eksternal/TransaksiTerpadu'));

const Preview = lazy(() => import('../pages/Apps/Invoice/Preview'));
const Add = lazy(() => import('../pages/Apps/Invoice/Add'));
const Edit = lazy(() => import('../pages/Apps/Invoice/Edit'));
const Tabs = lazy(() => import('../pages/Components/Tabs'));
const Accordians = lazy(() => import('../pages/Components/Accordians'));
const Modals = lazy(() => import('../pages/Components/Modals'));
const Cards = lazy(() => import('../pages/Components/Cards'));
const Carousel = lazy(() => import('../pages/Components/Carousel'));
const Countdown = lazy(() => import('../pages/Components/Countdown'));
const Counter = lazy(() => import('../pages/Components/Counter'));
const SweetAlert = lazy(() => import('../pages/Components/SweetAlert'));
const Timeline = lazy(() => import('../pages/Components/Timeline'));
const Notification = lazy(() => import('../pages/Components/Notification'));
const MediaObject = lazy(() => import('../pages/Components/MediaObject'));
const ListGroup = lazy(() => import('../pages/Components/ListGroup'));
const PricingTable = lazy(() => import('../pages/Components/PricingTable'));
const LightBox = lazy(() => import('../pages/Components/LightBox'));
const Alerts = lazy(() => import('../pages/Elements/Alerts'));
const Avatar = lazy(() => import('../pages/Elements/Avatar'));
const Badges = lazy(() => import('../pages/Elements/Badges'));
const Breadcrumbs = lazy(() => import('../pages/Elements/Breadcrumbs'));
const Buttons = lazy(() => import('../pages/Elements/Buttons'));
const Buttongroups = lazy(() => import('../pages/Elements/Buttongroups'));
const Colorlibrary = lazy(() => import('../pages/Elements/Colorlibrary'));
const DropdownPage = lazy(() => import('../pages/Elements/DropdownPage'));
const Infobox = lazy(() => import('../pages/Elements/Infobox'));
const Jumbotron = lazy(() => import('../pages/Elements/Jumbotron'));
const Loader = lazy(() => import('../pages/Elements/Loader'));
const Pagination = lazy(() => import('../pages/Elements/Pagination'));
const Popovers = lazy(() => import('../pages/Elements/Popovers'));
const Progressbar = lazy(() => import('../pages/Elements/Progressbar'));
const Search = lazy(() => import('../pages/Elements/Search'));
const Tooltip = lazy(() => import('../pages/Elements/Tooltip'));
const Treeview = lazy(() => import('../pages/Elements/Treeview'));
const Typography = lazy(() => import('../pages/Elements/Typography'));
const Widgets = lazy(() => import('../pages/Widgets'));
const FontIcons = lazy(() => import('../pages/FontIcons'));
const DragAndDrop = lazy(() => import('../pages/DragAndDrop'));
const Tables = lazy(() => import('../pages/Tables'));

const NamaBarangMentah = lazy(() => import('../pages/DataTables/NamaBarangMentah'));
const NamaProduk = lazy(() => import('../pages/DataTables/NamaProduk'));
const Asset = lazy(() => import('../pages/DataTables/Asset'));
const Ruangan = lazy(() => import('../pages/DataTables/Ruangan'));
const InventarisBarang= lazy(() => import('../pages/Inventaris/InventarisBarang'));
const InventarisProduk= lazy(() => import('../pages/Inventaris/InventarisProduk'));
const EditInventarisBarang= lazy(() => import('../pages/Inventaris/EditInventaris'));
const ResumeInventarisBarang= lazy(() => import('../pages/Inventaris/ResumeInventaris'));
const Supplier = lazy(() => import('../pages/DataTables/Supplier'));
const Pelanggan = lazy(() => import('../pages/DataTables/Pelanggan'));
const OrderSorting = lazy(() => import('../pages/Inventaris/DataBarang'));

const AccountSetting = lazy(() => import('../pages/Users/AccountSetting'));
const SettingGaji = lazy(() => import('../pages/Penggajian/SettingGaji'));
const PerhitunganGaji = lazy(() => import('../pages/Penggajian/PerhitunganGaji'));
const KnowledgeBase = lazy(() => import('../pages/Pages/KnowledgeBase'));
const ContactUsBoxed = lazy(() => import('../pages/Pages/ContactUsBoxed'));
const ContactUsCover = lazy(() => import('../pages/Pages/ContactUsCover'));
const Faq = lazy(() => import('../pages/Pages/Faq'));
const ComingSoonBoxed = lazy(() => import('../pages/Pages/ComingSoonBoxed'));
const ComingSoonCover = lazy(() => import('../pages/Pages/ComingSoonCover'));
const ERROR404 = lazy(() => import('../pages/Pages/Error404'));
const ERROR500 = lazy(() => import('../pages/Pages/Error500'));
const ERROR503 = lazy(() => import('../pages/Pages/Error503'));
const Maintenence = lazy(() => import('../pages/Pages/Maintenence'));
const LoginBoxed = lazy(() => import('../pages/Authentication/Login'));
const RegisterBoxed = lazy(() => import('../pages/Authentication/RegisterBoxed'));
const RegisterCover = lazy(() => import('../pages/Authentication/AccountActivation'));
const RecoverIdCover = lazy(() => import('../pages/Authentication/SendEmailRecover'));
const About = lazy(() => import('../pages/About'));
const Error = lazy(() => import('../components/Error'));
const Charts = lazy(() => import('../pages/Charts'));
const FormBasic = lazy(() => import('../pages/Forms/Basic'));
const FormInputGroup = lazy(() => import('../pages/Forms/InputGroup'));
const FormLayouts = lazy(() => import('../pages/Forms/Layouts'));
const Validation = lazy(() => import('../pages/Forms/Validation'));
const InputMask = lazy(() => import('../pages/Forms/InputMask'));
const Select2 = lazy(() => import('../pages/Forms/Select2'));
const Touchspin = lazy(() => import('../pages/Forms/TouchSpin'));
const CheckBoxRadio = lazy(() => import('../pages/Forms/CheckboxRadio'));
const Switches = lazy(() => import('../pages/Forms/Switches'));
const Wizards = lazy(() => import('../pages/Forms/Wizards'));
const FileUploadPreview = lazy(() => import('../pages/Forms/FileUploadPreview'));
const QuillEditor = lazy(() => import('../pages/Forms/QuillEditor'));
const MarkDownEditor = lazy(() => import('../pages/Forms/MarkDownEditor'));
const DateRangePicker = lazy(() => import('../pages/Forms/DateRangePicker'));
const Clipboard = lazy(() => import('../pages/Forms/Clipboard'));
const PengirimanPage = lazy(() => import('../pages/Apps/Pengiriman/Index'));
const PengirimanAdd = lazy(() => import('../pages/Apps/Pengiriman/Add'));
const PengirimanEdit = lazy(() => import('../pages/Apps/Pengiriman/Edit'));
const PengirimanPreview = lazy(() => import('../pages/Apps/Pengiriman/Preview'));

// Driver pages
const DriverLaporanGaji = lazy(() => import('../pages/DriverLaporanGaji'));

// Import route helpers
import { adminOnly, karyawanOnly, driverOnly, withPermission, authenticated } from './RouteHelpers';

const wrapWithProtectedRoute = (element: JSX.Element) => {
    return <ProtectedRoute>{element}</ProtectedRoute>;
};
const routes = [
    // dashboard
    {
        path: '/',
        element: <LoginBoxed />,
        layout: 'blank',
    },
    {
        path: '/dashboard',
        element: authenticated(<Index />),
    },
    // Master Data Routes - Admin Only
    {
        path: '/masterdata/jenisbarang',
        element: adminOnly(<NamaBarangMentah />),
    },
    {
        path: '/masterdata/nama-barang-mentah',
        element: adminOnly(<NamaBarangMentah />),
    },
    {
        path: '/masterdata/nama-produk',
        element: adminOnly(<NamaProduk />),
    },
    {
        path: '/masterdata/asset',
        element: adminOnly(<Asset />),
    },
    {
        path: '/masterdata/supplier',
        element: adminOnly(<Supplier />),
    },
    {
        path: '/masterdata/pelanggan',
        element: adminOnly(<Pelanggan />),
    },
    {
        path: '/masterdata/pelanggan',
        element: <Pelanggan />,
    },
    {
        path: '/masterdata/ruangan',
        element: <Ruangan />,
    },
    {
        path: '/inventaris/inventaris-barang',
        element: <InventarisBarang />,
    },
    {
        path: '/inventaris/inventaris-produk',
        element: <InventarisProduk />,
    },
    {
        path: '/inventaris/edit-inventaris-barang/:id',
        element: <EditInventarisBarang />,
    },
    {
        path: '/inventaris/resume-inventaris-barang/:id',
        element: <ResumeInventarisBarang />,
    },
    {
        path: '/apps/cetak-label',
        element: <CetakLabel />,
    },
    {
        path: '/apps/cetak-label/list-data-barang/:barang_id',
        element: <ListDataBarang />,
    },
    {
        path: '/apps/cetak-label/list-data-barang/preview',
        element: <ViewDataBarang />,
        layout: 'blank',
    },

    // Production Management - Admin and Karyawan
    {
        path: '/apps/produksi',
        element: withPermission(<ProduksiList />, 'canAccessProduksi'),
    },
    {
        path: '/apps/produksi/add',
        element: withPermission(<ProduksiAdd />, 'canAccessProduksi'),
    },
    {
        path: '/apps/produksi/preview/:id',
        element: withPermission(<ProduksiPreview />, 'canAccessProduksi'),
    },
    {
        path: '/apps/produksi/edit/:id',
        element: withPermission(<ProduksiEdit />, 'canAccessProduksi'),
    },
    {
        path: '/apps/produksi/karyawan',
        element: karyawanOnly(<KaryawanProduksi />),
    },
    {
        path: '/apps/produksi/karyawan/detail/:id',
        element: karyawanOnly(<DetailKaryawan />),
    },
    {
        path: '/apps/produksi/karyawan/riwayat',
        element: karyawanOnly(<RiwayatKaryawan />),
    },
    {
        path: '/apps/produksi/karyawan/statistik',
        element: karyawanOnly(<StatistikKaryawan />),
    },

    // Pengadaan Management - Admin Only
    {
        path: '/apps/pengadaan',
        element: adminOnly(<PengadaanList />),
    },
    {
        path: '/apps/pengadaan/add',
        element: adminOnly(<PengadaanAdd />),
    },
    {
        path: '/apps/pengadaan/edit/:id',
        element: adminOnly(<PengadaanEdit />),
    },
    {
        path: '/apps/pengadaan/preview/:id',
        element: adminOnly(<PengadaanPreview />),
    },

    // Pesanan Management - Admin Only
    {
        path: '/apps/pesanan',
        element: adminOnly(<PesananList />),
    },
    {
        path: '/apps/pesanan/add',
        element: adminOnly(<PesananAdd />),
    },
    {
        path: '/apps/pesanan/edit/:id',
        element: adminOnly(<PesananEdit />),
    },
    {
        path: '/apps/pesanan/preview/:id',
        element: adminOnly(<PesananPreview />),
    },

    // Pengiriman Management - Admin, Karyawan & Driver
    {
        path: '/apps/pengiriman',
        element: <PengirimanPage />, // Accessible by all authenticated users
    },
    {
        path: '/apps/pengiriman/add',
        element: adminOnly(<PengirimanAdd />), // Only admin/karyawan can create
    },
    {
        path: '/apps/pengiriman/edit/:id',
        element: <PengirimanEdit />, // Accessible by admin and driver (with restrictions)
    },
    {
        path: '/apps/pengiriman/preview/:id',
        element: <PengirimanPreview />, // Accessible by all authenticated users
    },

    // Driver Routes
    {
        path: '/driver/laporan-gaji',
        element: driverOnly(<DriverLaporanGaji />), // Driver only
    },

    // Keuangan Eksternal - Admin Only
    {
        path: '/keuangan/dashboard',
        element: adminOnly(<KeuanganDashboard />),
    },
    {
        path: '/keuangan/transaksi',
        element: adminOnly(<KeuanganTransaksi />),
    },
    {
        path: '/keuangan/transaksi/add',
        element: adminOnly(<KeuanganForm />),
    },
    {
        path: '/keuangan/transaksi/edit/:id',
        element: adminOnly(<KeuanganForm />),
    },
    {
        path: '/keuangan/laporan',
        element: adminOnly(<KeuanganLaporanBulanan />),
    },
    {
        path: '/keuangan/laporan/detail/:year/:month',
        element: adminOnly(<KeuanganLaporan />),
    },
    {
        path: '/keuangan/laporan-terpadu',
        element: adminOnly(<KeuanganLaporanBulanan />),
    },
    {
        path: '/keuangan/laporan-terpadu/detail/:year/:month',
        element: adminOnly(<KeuanganLaporanTerpadu />),
    },
    {
        path: '/keuangan/proyeksi',
        element: adminOnly(<KeuanganProyeksi />),
    },
    {
        path: '/keuangan/transaksi-terpadu',
        element: adminOnly(<KeuanganTransaksiTerpadu />),
    },






    // Data Tables
    
    
    {
        path: '/datatables/order-sorting',
        element: <OrderSorting />,
    },
    {
        path: '/analytics',
        element: <Analytics />,
    },
    // finance page
    {
        path: '/apps/todolist',
        element: <Todolist />,
    },
    {
        path: '/apps/notes',
        element: <Notes />,
    },
    // User Management - Admin Only
    {
        path: '/apps/contacts',
        element: adminOnly(<Contacts />),
    },
    // Penggajian routes - Admin Only
    {
        path: '/penggajian/setting-gaji',
        element: adminOnly(<SettingGaji />),
    },
    {
        path: '/penggajian/perhitungan-gaji',
        element: adminOnly(<PerhitunganGaji />),
    },
    {
        path: '/apps/mailbox',
        element: <Mailbox />,
    },
    {
        path: '/apps/invoice/permohonan',
        element: <PermintaanPermohonan/>,
    },
    {
        path: '/apps/transaksi/penghapusan',
        element: <PenghapusanInventaris/>,
    },
    {
        path: '/penghapusan/add',
        element: <PenghapusanInventarisAdd/>,
    },
    {
        path: '/penghapusan/edit/:id',
        element: <PenghapusanInventarisAdd/>,
    },
    {
        path: '/penghapusan/view/:id',
        element: <PenghapusanInventarisView/>,
    },
    {
        path: '/apps/transaksi/penempatan',
        element: <PenempatanInventaris/>,
    },
    {
        path: '/penempatan/add',
        element: <PenempatanInventarisAdd/>,
    },
    {
        path: '/penempatan/edit/:id',
        element: <PenempatanInventarisAdd/>,
    },
    {
        path: '/penempatan/view/:id',
        element: <PenempatanInventarisView/>,
    },
    {
        path: '/apps/transaksi/peminjaman',
        element: <PeminjamanInventaris/>,
    },
    {
        path: '/peminjaman/add',
        element: <PeminjamanInventarisAdd/>,
    },
    {
        path: '/peminjaman/edit/:id',
        element: <PeminjamanInventarisAdd/>,
    },
    {
        path: '/peminjaman/view/:id',
        element: <PeminjamanInventarisView/>,
    },
    {
        path: '/apps/transaksi/mutasi',
        element: <MutasiInventaris/>,
    },
    {
        path: '/mutasi/add',
        element: <MutasiInventarisAdd/>,
    },
    {
        path: '/mutasi/edit/:id',
        element: <MutasiInventarisAdd/>,
    },
    {
        path: '/mutasi/view/:id',
        element: <MutasiInventarisView/>,
    },
    // Pemeliharaan Management - Admin Only
    {
        path: '/apps/transaksi/pemeliharaan',
        element: adminOnly(<PemeliharaanInventaris/>),
    },
    {
        path: '/pemeliharaan',
        element: adminOnly(<PemeliharaanInventaris/>),
    },
    {
        path: '/pemeliharaan/add',
        element: adminOnly(<PemeliharaanInventarisAdd/>),
    },
    {
        path: '/pemeliharaan/add/:id',
        element: adminOnly(<PemeliharaanInventarisAdd/>),
    },
    {
        path: '/pemeliharaan/edit/:id',
        element: adminOnly(<PemeliharaanInventarisEdit/>),
    },
    {
        path: '/pemeliharaan/view/:id',
        element: adminOnly(<PemeliharaanInventarisView/>),
    },
    {
        path: '/apps/transaksi/pengajuan',
        element: <PermintaanPengajuan status="pengajuan"/>,
    },
    {
        path: '/apps/transaksi/permohonan',
        element: <PermintaanPermohonan/>,
    },
    
    // Apps page
    {
        path: '/apps/chat',
        element: <Chat />,
    },
    {
        path: '/apps/scrumboard',
        element: <Scrumboard />,
    },
    {
        path: '/apps/calendar',
        element: <Calendar />,
    },
    // preview page
    {
        path: '/apps/invoice/preview/:id',
        element: <Preview />,
    },
    {
        path: '/apps/invoice/add',
        element: <Add />,
    },
    {
        path: '/apps/invoice/add/:id',
        element: <Add />,
    },
    {
        path: '/apps/invoice/edit',
        element: <Edit />,
    },
    // components page
    {
        path: '/components/tabs',
        element: <Tabs />,
    },
    {
        path: '/components/accordions',
        element: <Accordians />,
    },
    {
        path: '/components/modals',
        element: <Modals />,
    },
    {
        path: '/components/cards',
        element: <Cards />,
    },
    {
        path: '/components/carousel',
        element: <Carousel />,
    },
    {
        path: '/components/countdown',
        element: <Countdown />,
    },
    {
        path: '/components/counter',
        element: <Counter />,
    },
    {
        path: '/components/sweetalert',
        element: <SweetAlert />,
    },
    {
        path: '/components/timeline',
        element: <Timeline />,
    },
    {
        path: '/components/notifications',
        element: <Notification />,
    },
    {
        path: '/components/media-object',
        element: <MediaObject />,
    },
    {
        path: '/components/list-group',
        element: <ListGroup />,
    },
    {
        path: '/components/pricing-table',
        element: <PricingTable />,
    },
    {
        path: '/components/lightbox',
        element: <LightBox />,
    },
    // elements page
    {
        path: '/elements/alerts',
        element: <Alerts />,
    },
    {
        path: '/elements/avatar',
        element: <Avatar />,
    },
    {
        path: '/elements/badges',
        element: <Badges />,
    },
    {
        path: '/elements/breadcrumbs',
        element: <Breadcrumbs />,
    },
    {
        path: '/elements/buttons',
        element: <Buttons />,
    },
    {
        path: '/elements/buttons-group',
        element: <Buttongroups />,
    },
    {
        path: '/elements/color-library',
        element: <Colorlibrary />,
    },
    {
        path: '/elements/dropdown',
        element: <DropdownPage />,
    },
    {
        path: '/elements/infobox',
        element: <Infobox />,
    },
    {
        path: '/elements/jumbotron',
        element: <Jumbotron />,
    },
    {
        path: '/elements/loader',
        element: <Loader />,
    },
    {
        path: '/elements/pagination',
        element: <Pagination />,
    },
    {
        path: '/elements/popovers',
        element: <Popovers />,
    },
    {
        path: '/elements/progress-bar',
        element: <Progressbar />,
    },
    {
        path: '/elements/search',
        element: <Search />,
    },
    {
        path: '/elements/tooltips',
        element: <Tooltip />,
    },
    {
        path: '/elements/treeview',
        element: <Treeview />,
    },
    {
        path: '/elements/typography',
        element: <Typography />,
    },

    // charts page
    {
        path: '/charts',
        element: <Charts />,
    },
    // widgets page
    {
        path: '/widgets',
        element: <Widgets />,
    },
    //  font-icons page
    {
        path: '/font-icons',
        element: <FontIcons />,
    },
    //  Drag And Drop page
    {
        path: '/dragndrop',
        element: <DragAndDrop />,
    },
    //  Tables page
    {
        path: '/tables',
        element: <Tables />,
    },

    // Users page
    {
        path: '/users/user-account-settings',
        element: <AccountSetting />,
    },
    //Authentication
    {
        path: '/auth/boxed-signup',
        element: <RegisterBoxed />,
        layout: 'blank',
    },
    {
        path: '/auth/cover-register',
        element: <RegisterCover />,
        layout: 'blank',
    },
    {
        path: '/auth/cover-password-reset',
        element: <RecoverIdCover />,
        layout: 'blank',
    },
    //forms page
    {
        path: '/forms/basic',
        element: <FormBasic />,
    },
    {
        path: '/forms/input-group',
        element: <FormInputGroup />,
    },
    {
        path: '/forms/layouts',
        element: <FormLayouts />,
    },
    {
        path: '/forms/validation',
        element: <Validation />,
    },
    {
        path: '/forms/input-mask',
        element: <InputMask />,
    },
    {
        path: '/forms/select2',
        element: <Select2 />,
    },
    {
        path: '/forms/touchspin',
        element: <Touchspin />,
    },
    {
        path: '/forms/checkbox-radio',
        element: <CheckBoxRadio />,
    },
    {
        path: '/forms/switches',
        element: <Switches />,
    },
    {
        path: '/forms/wizards',
        element: <Wizards />,
    },
    {
        path: '/forms/file-upload',
        element: <FileUploadPreview />,
    },
    {
        path: '/forms/quill-editor',
        element: <QuillEditor />,
    },
    {
        path: '/forms/markdown-editor',
        element: <MarkDownEditor />,
    },
    {
        path: '/forms/date-picker',
        element: <DateRangePicker />,
    },
    {
        path: '/forms/clipboard',
        element: <Clipboard />,
    },
    {
        path: '/about',
        element: <About />,
        layout: 'blank',
    },
    {
        path: '*',
        element: <Error />,
        layout: 'blank',
    },
];

export { routes };
