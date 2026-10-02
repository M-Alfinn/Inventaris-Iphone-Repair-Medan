import { ActivityLog, AppNotification } from '../types';

/**
 * Daftar kata kunci & frasa untuk notifikasi yang TIDAK BOLEH masuk ke dalam sistem notifikasi.
 * Sesuai kebijakan notifikasi operasional, aktivitas personal/non-operasional seperti:
 * tautan email, putus tautan, update profil mandiri, ganti password, dan login/logout
 * tidak dimunculkan di lonceng notifikasi agar fokus pada transaksi bisnis (stok, return, absensi).
 */
export const NON_ESSENTIAL_NOTIFICATION_KEYWORDS = [
  'tautan email',
  'tautkan email',
  'putus tautan',
  'lepas tautan',
  'verifikasi email',
  'ganti email',
  'ubah email',
  'update profil',
  'edit profil',
  'profil diperbarui',
  'ganti kata sandi',
  'ganti sandi',
  'reset password',
  'login',
  'logout',
  'sesi berakhir',
];

/**
 * Memeriksa apakah notifikasi termasuk notifikasi non-operasional/tidak penting.
 */
export const isNonEssentialNotification = (
  judul?: string,
  pesan?: string,
  kategori?: string
): boolean => {
  if (kategori === 'AUTH') return true;

  const j = (judul || '').trim().toLowerCase();
  const p = (pesan || '').trim().toLowerCase();

  for (const keyword of NON_ESSENTIAL_NOTIFICATION_KEYWORDS) {
    if (j.includes(keyword) || p.includes(keyword)) {
      return true;
    }
  }

  return false;
};

/**
 * Filter validator: Menentukan apakah sebuah notifikasi valid & esensial untuk ditampilkan.
 */
export const isEssentialNotification = (
  notif: Partial<AppNotification>
): boolean => {
  if (!notif) return false;
  return !isNonEssentialNotification(notif.judul, notif.pesan, notif.kategori);
};

/**
 * Membersihkan kumpulan data notifikasi dari entri non-esensial.
 */
export const sanitizeNotifications = (
  notifs: AppNotification[]
): AppNotification[] => {
  if (!Array.isArray(notifs)) return [];
  return notifs.filter(isEssentialNotification);
};

/**
 * Daftar kata kunci & frasa untuk aktivitas yang TIDAK BOLEH masuk ke dalam log aktivitas sistem.
 * Sesuai kebijakan audit trail, aktivitas non-operasional/trivial seperti:
 * logout, pilih toko, ganti password wajib, akses dashboard, navigasi menu, dan login
 * tidak perlu dicatat agar log aktivitas tetap fokus pada rekonsiliasi data penting.
 */
export const NON_ESSENTIAL_ACTIVITY_KEYWORDS = [
  'logout',
  'log out',
  'keluar sistem',
  'keluar aplikasi',
  'keluar akun',
  'pilih toko',
  'pilih cabang',
  'ganti toko',
  'seleksi toko',
  'akses dashboard',
  'buka dashboard',
  'dashboard utama',
  'dashboard toko',
  'akses menu',
  'akses halaman',
  'buka menu',
  'buka halaman',
  'navigasi',
];

/**
 * Memeriksa apakah suatu aktivitas merupakan aktivitas non-operasional / tidak penting.
 * Mengembalikan true jika aktivitas harus diabaikan/dihapus dari log.
 */
export const isNonEssentialActivity = (
  aktivitas?: string,
  detail?: string
): boolean => {
  const act = (aktivitas || '').trim().toLowerCase();
  const det = (detail || '').trim().toLowerCase();

  if (!act && !det) return true;

  // 1. Cek kata kunci pada judul aktivitas
  for (const keyword of NON_ESSENTIAL_ACTIVITY_KEYWORDS) {
    if (act.includes(keyword)) {
      return true;
    }
  }

  // Khusus kata 'keluar' (harus bukan 'barang keluar' yang merupakan transaksi inventaris)
  if (act === 'keluar' || (act.includes('keluar') && !act.includes('barang keluar'))) {
    return true;
  }

  // Khusus kata 'masuk' (harus bukan 'barang masuk' atau 'absen masuk' / 'check in')
  if (
    act === 'masuk' ||
    (act.includes('masuk') &&
      !act.includes('barang masuk') &&
      !act.includes('absen masuk') &&
      !act.includes('check in'))
  ) {
    return true;
  }

  // 2. Cek detail perubahan untuk indikasi aktivitas non-operasional/trivial
  const nonEssentialDetailPatterns = [
    'logout',
    'pilih toko',
    'pilih cabang',
    'ganti password wajib',
    'wajib ganti password',
    'akses dashboard',
    'berhasil logout',
    'keluar dari sesi',
    'berhasil login',
    'memperbarui profil akun mandiri',
    'profil akun mandiri',
    'menautkan dan memverifikasi akun gmail',
    'tautkan email',
    'putus tautan email',
    'status tautan email',
    'mengubah email akun',
    'memperbarui kata sandi akun',
    'verifikasi otp gmail',
  ];

  for (const pattern of nonEssentialDetailPatterns) {
    if (det.includes(pattern)) {
      return true;
    }
  }

  return false;
};

/**
 * Filter validator: Menentukan apakah sebuah log valid & penting untuk disimpan/ditampilkan.
 */
export const isEssentialActivityLog = (log: Partial<ActivityLog>): boolean => {
  if (!log) return false;

  // Kebijakan Operasional: Super Admin tidak memiliki kewajiban absensi kerja
  // Dilarang menampilkan/menyimpan log aktivitas absensi (check in, check out, izin, alpa) untuk Super Admin
  const isSuper =
    log.role === 'SUPER_ADMIN' ||
    log.user_id === 'user-super' ||
    (log.user_name && log.user_name.toLowerCase().includes('super admin'));

  const isAbsenActivity =
    log.tipe === 'ABSENSI' ||
    (log.aktivitas && log.aktivitas.toLowerCase().includes('absen')) ||
    (log.aktivitas && log.aktivitas.toLowerCase().includes('check in')) ||
    (log.aktivitas && log.aktivitas.toLowerCase().includes('check out')) ||
    (log.detail_perubahan && log.detail_perubahan.toLowerCase().includes('absen masuk')) ||
    (log.detail_perubahan && log.detail_perubahan.toLowerCase().includes('absen pulang'));

  if (isSuper && isAbsenActivity) {
    return false;
  }

  return !isNonEssentialActivity(log.aktivitas, log.detail_perubahan);
};

/**
 * Membersihkan kumpulan data log aktivitas dari entri-entri yang tidak penting.
 */
export const sanitizeActivityLogs = (logs: ActivityLog[]): ActivityLog[] => {
  if (!Array.isArray(logs)) return [];
  return logs.filter(isEssentialActivityLog);
};
