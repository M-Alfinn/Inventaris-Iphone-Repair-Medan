import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Activity, 
  Search, 
  ShieldCheck, 
  Clock, 
  Filter, 
  History, 
  Store as StoreIcon, 
  UserCheck, 
  PackageCheck, 
  RotateCcw, 
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { isEssentialActivityLog } from '../../utils/activityLogRules';
import { ConfirmationModal } from '../common/ConfirmationModal';

export const ActivityLogPage: React.FC = () => {
  const { 
    activityLogs, 
    stores, 
    users,
    currentUser, 
    activeStore, 
    activeStoreId,
    deleteActivityLog
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState(activeStoreId || 'ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedRole, setSelectedRole] = useState('ALL');

  // Confirmation modal state for individual deletion
  const [logToDelete, setLogToDelete] = useState<string | null>(null);

  React.useEffect(() => {
    setSelectedStore(activeStoreId || 'ALL');
  }, [activeStoreId]);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isAdminToko = currentUser?.role === 'ADMIN_TOKO';
  const isKaryawan = currentUser?.role === 'KARYAWAN';

  // 1. First ensure only essential operational logs are processed
  const sanitizedLogs = useMemo(() => {
    return activityLogs.filter(isEssentialActivityLog);
  }, [activityLogs]);

  // 2. Scoped activity logs based on user role and store:
  const roleScopedLogs = useMemo(() => {
    if (!currentUser) return [];

    // Super Admin: sees ALL activity logs across all stores
    if (isSuperAdmin) {
      if (activeStoreId) {
        return sanitizedLogs.filter((log) => log.store_id === activeStoreId || log.store_id === null);
      }
      return sanitizedLogs;
    }

    const myStoreId = currentUser.store_id || activeStoreId || (stores.length > 0 ? stores[0].id : '');

    // Admin Toko: sees logs in their OWN store only (strictly excludes Super Admin logs)
    if (isAdminToko) {
      return sanitizedLogs.filter((log) => {
        const isSameStore = log.store_id === myStoreId;
        const isNotSuperAdmin = log.role !== 'SUPER_ADMIN';
        return isSameStore && isNotSuperAdmin;
      });
    }

    // Karyawan: sees logs in their OWN store only (themselves and other staff/karyawan in that store)
    if (isKaryawan) {
      return sanitizedLogs.filter((log) => {
        const isSameStore = log.store_id === myStoreId;
        const isStaff = log.role === 'KARYAWAN' || (!log.role && log.user_id === currentUser.id);
        const isNotSuperAdmin = log.role !== 'SUPER_ADMIN';
        return isSameStore && isNotSuperAdmin && isStaff;
      });
    }

    return [];
  }, [sanitizedLogs, currentUser, activeStoreId, isSuperAdmin, isAdminToko, isKaryawan]);

  const filteredLogs = useMemo(() => {
    return roleScopedLogs
      .filter((log) => {
        if (activeStoreId || !isSuperAdmin) return true;
        if (selectedStore === 'ALL') return true;
        return log.store_id === selectedStore;
      })
      .filter((log) => {
        if (selectedType === 'ALL') return true;
        return log.tipe === selectedType;
      })
      .filter((log) => {
        if (selectedRole === 'ALL') return true;
        return log.role === selectedRole;
      })
      .filter((log) => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
          log.user_name.toLowerCase().includes(q) ||
          log.aktivitas.toLowerCase().includes(q) ||
          log.detail_perubahan.toLowerCase().includes(q) ||
          (log.store_name && log.store_name.toLowerCase().includes(q))
        );
      });
  }, [roleScopedLogs, selectedStore, selectedType, selectedRole, searchTerm, isSuperAdmin, activeStoreId]);

  // Type Badge Renderer
  const renderTypeBadge = (tipe?: string) => {
    switch (tipe) {
      case 'INVENTORY':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <PackageCheck className="w-3 h-3" />
            INVENTORY
          </span>
        );
      case 'ABSENSI':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
            <UserCheck className="w-3 h-3" />
            ABSENSI
          </span>
        );
      case 'RETURN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <RotateCcw className="w-3 h-3" />
            RETURN
          </span>
        );
      case 'STORE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <StoreIcon className="w-3 h-3" />
            STORE
          </span>
        );
      case 'USER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <ShieldCheck className="w-3 h-3" />
            USER
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
            LOG
          </span>
        );
    }
  };

  const handleConfirmDelete = () => {
    if (logToDelete) {
      deleteActivityLog(logToDelete);
      setLogToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
              Audit Trail Operasional
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold">
              {activeStore
                ? `Lingkup: ${activeStore.nama_toko}`
                : isSuperAdmin
                ? 'Lingkup: Seluruh Cabang'
                : `Lingkup: ${activeStore?.nama_toko || 'Cabang Ini'}`}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1.5">
            Log Aktivitas Sistem
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {activeStore
              ? `Riwayat transaksi stok, return, absensi, dan master data di ${activeStore.nama_toko}.`
              : isSuperAdmin
              ? 'Seluruh rekam jejak transaksi inventaris, return, dan absensi lintas seluruh cabang toko.'
              : `Catatan aktivitas operasional di ${activeStore?.nama_toko || 'cabang toko Anda'}.`}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <History className="w-4 h-4 text-purple-600" />
            <span>Total: <strong className="text-purple-900 font-bold">{filteredLogs.length} Catatan</strong></span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama pengguna / aktivitas / detail perubahan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-600"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Store Filter: ONLY FOR SUPER_ADMIN when no store is active */}
          {isSuperAdmin && !activeStoreId && (
            <div className="flex items-center gap-1.5">
              <StoreIcon className="w-3.5 h-3.5 text-slate-400" />
              <select
                id="filter-log-store"
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
              >
                <option value="ALL">Semua Cabang Toko</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama_toko} ({s.cabang})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Type Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="filter-log-type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
            >
              <option value="ALL">Semua Tipe</option>
              <option value="INVENTORY">Inventory &amp; Mutasi Stok</option>
              <option value="RETURN">Return Barang</option>
              <option value="ABSENSI">Absensi Karyawan</option>
              <option value="STORE">Cabang Toko</option>
              <option value="USER">User &amp; Karyawan</option>
            </select>
          </div>

          {/* Role Filter */}
          {isSuperAdmin ? (
            <select
              id="filter-log-role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
            >
              <option value="ALL">Semua Role</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN_TOKO">Admin Toko</option>
              <option value="KARYAWAN">Karyawan</option>
            </select>
          ) : isAdminToko ? (
            <select
              id="filter-log-role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
            >
              <option value="ALL">Semua Role</option>
              <option value="ADMIN_TOKO">Admin Toko</option>
              <option value="KARYAWAN">Karyawan</option>
            </select>
          ) : null}
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
              <tr>
                <th className="py-3.5 px-4">Waktu (WIB)</th>
                <th className="py-3.5 px-4">Tipe</th>
                <th className="py-3.5 px-4">Pengguna</th>
                <th className="py-3.5 px-4">Cabang Toko</th>
                <th className="py-3.5 px-4">Aktivitas</th>
                <th className="py-3.5 px-4">Detail Perubahan Data</th>
                {(isSuperAdmin || isAdminToko) && (
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin || isAdminToko ? 7 : 6} className="py-10 text-center text-slate-400 font-medium">
                    Tidak ada catatan aktivitas operasional yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {log.waktu}
                    </td>
                    <td className="py-3.5 px-4">
                      {renderTypeBadge(log.tipe)}
                    </td>
                    <td className="py-3.5 px-4">
                      {(() => {
                        const actor = users.find((u) => u.id === log.user_id);
                        return (
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-slate-200 shadow-2xs">
                              {actor?.avatar || actor?.foto_profil ? (
                                <img
                                  src={actor.avatar || actor.foto_profil}
                                  alt={log.user_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                log.user_name.substring(0, 2).toUpperCase()
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{log.user_name}</p>
                              {log.role && (
                                <span className="text-[10px] text-slate-400">
                                  {log.role === 'SUPER_ADMIN' ? 'Super Admin' : log.role === 'ADMIN_TOKO' ? 'Admin Toko' : 'Karyawan'}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {log.store_name || 'Pusat'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-indigo-700">
                      {log.aktivitas}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 max-w-md">
                      {log.detail_perubahan}
                    </td>
                    {(isSuperAdmin || isAdminToko) && (
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setLogToDelete(log.id)}
                          title="Hapus baris log ini"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards */}
        <div className="md:hidden p-3.5 space-y-3 bg-slate-50/60">
          {filteredLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 font-medium bg-white rounded-xl border border-slate-200/80 p-4">
              Tidak ada catatan aktivitas operasional yang sesuai dengan filter.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-4 space-y-2.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {renderTypeBadge(log.tipe)}
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                      {log.store_name || 'Pusat'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">{log.waktu}</span>
                    {(isSuperAdmin || isAdminToko) && (
                      <button
                        type="button"
                        onClick={() => setLogToDelete(log.id)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Hapus log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-indigo-900 text-xs">{log.aktivitas}</h4>
                  {(() => {
                    const actor = users.find((u) => u.id === log.user_id);
                    return (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                        <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 overflow-hidden border border-slate-200">
                          {actor?.avatar || actor?.foto_profil ? (
                            <img
                              src={actor.avatar || actor.foto_profil}
                              alt={log.user_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            log.user_name.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <span className="font-bold text-slate-800">{log.user_name}</span>
                        {log.role && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            ({log.role === 'SUPER_ADMIN' ? 'Super Admin' : log.role === 'ADMIN_TOKO' ? 'Admin Toko' : 'Karyawan'})
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 text-[11px] font-mono text-slate-600 border border-slate-100 break-words">
                  {log.detail_perubahan}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirmation Modal for Individual Deletion */}
      <ConfirmationModal
        isOpen={Boolean(logToDelete)}
        title="Hapus Catatan Log Aktivitas"
        message="Apakah Anda yakin ingin menghapus catatan log ini secara permanen dari sistem?"
        confirmText="Ya, Hapus Log"
        cancelText="Batal"
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setLogToDelete(null)}
      />
    </div>
  );
};
