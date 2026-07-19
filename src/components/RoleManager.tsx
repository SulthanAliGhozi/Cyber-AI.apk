import React, { useState, useEffect } from "react";
import { 
  Users, 
  UserPlus, 
  Trash2, 
  ExternalLink, 
  LogOut, 
  RefreshCw, 
  Shield, 
  ShieldAlert,
  Mail, 
  CheckCircle2, 
  AlertTriangle,
  Settings
} from "lucide-react";
import { 
  getAllUsers, 
  updateUserRole, 
  removeUser,
  getFirebaseAuth,
  UserData,
  UserRole
} from "../lib/firebase";

interface RoleManagerProps {
  user: { email: string; name: string; picture?: string; role?: string };
  onLogout: () => void;
  onProceedToRedirect: () => void;
  isDark: boolean;
}

export const RoleManager: React.FC<RoleManagerProps> = ({
  user,
  onLogout,
  onProceedToRedirect,
  isDark,
}) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  
  const userRole = user.role as UserRole || "pending";
  const canManageRoles = userRole === "admin owner" || userRole === "reseller";

  // Fetch users
  const fetchUsers = async () => {
    if (!canManageRoles) return;
    setIsLoading(true);
    setMessage(null);
    try {
      const list = await getAllUsers();
      setUsers(list);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setMessage({
        text: `Gagal memuat data pengguna: ${err.message || String(err)}`,
        isError: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (canManageRoles) {
      fetchUsers();
    }
  }, [user.role]);

  const handleRoleChange = async (targetEmail: string, newRole: UserRole) => {
    if (!window.confirm(`Yakin ingin mengubah role ${targetEmail} menjadi ${newRole}?`)) {
      return;
    }

    setActionLoading(true);
    setMessage(null);

    try {
      await updateUserRole(targetEmail, newRole, userRole);
      setMessage({ text: `Role untuk ${targetEmail} berhasil diperbarui.`, isError: false });
      await fetchUsers();
    } catch (err: any) {
      setMessage({
        text: `Gagal mengubah role: ${err.message || String(err)}`,
        isError: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveUser = async (emailToRemove: string) => {
    if (!window.confirm(`PERINGATAN! Yakin ingin menghapus ${emailToRemove} secara permanen dari sistem?`)) {
      return;
    }

    setActionLoading(true);
    setMessage(null);

    try {
      await removeUser(emailToRemove, userRole);
      setMessage({ text: `Pengguna ${emailToRemove} berhasil dihapus.`, isError: false });
      await fetchUsers();
    } catch (err: any) {
      setMessage({
        text: `Gagal menghapus pengguna: ${err.message || String(err)}`,
        isError: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleFirebaseAuthLogout = async () => {
    try {
      const authInstance = getFirebaseAuth();
      if (authInstance) {
        await authInstance.signOut();
      }
    } catch (err) {
      console.error("Firebase logout error:", err);
    }
    onLogout();
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-4 relative z-10 mb-12">
      <div className={`p-6 md:p-8 rounded-xl border crt-screen transition-all duration-300 ${
        isDark 
          ? "bg-[#0a0a0a]/95 border-[#a78bfa]/40 text-[#a78bfa] shadow-[0_0_30px_rgba(167,139,250,0.2)]" 
          : "bg-white/95 border-indigo-500/40 text-indigo-800 shadow-[0_8px_30px_rgba(99,102,241,0.15)]"
      }`}>
        
        {/* Panel Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-5 mb-6 border-neutral-700/30 gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg border ${
              isDark ? "border-[#a78bfa]/30 bg-[#a78bfa]/5 text-[#a78bfa]" : "border-indigo-500/30 bg-indigo-50 text-indigo-600"
            }`}>
              <Shield className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-widest uppercase font-sans flex items-center gap-2">
                NODE CENTRAL STATION
              </h2>
              <p className="text-[10px] font-mono opacity-75 uppercase">
                Access Authorization Control Console
              </p>
            </div>
          </div>

          {/* User Profile Card */}
          <div className={`p-2 rounded-lg border flex items-center gap-3 font-mono text-xs ${
            isDark ? "bg-black/60 border-neutral-800 text-white" : "bg-neutral-50 border-neutral-200 text-neutral-800"
          }`}>
            {user.picture ? (
              <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border border-neutral-700/50" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-neutral-700 text-white flex items-center justify-center font-bold text-sm uppercase">
                {user.name.charAt(0)}
              </div>
            )}
            <div className="text-left">
              <p className="font-bold text-[11px] truncate max-w-[150px]">{user.name}</p>
              <p className="text-[9px] opacity-65 truncate max-w-[150px] uppercase">
                {userRole === "admin owner" ? "👑 ADMIN OWNER" : userRole === "reseller" ? "💼 RESELLER" : userRole === "user premium" ? "⭐ PREMIUM USER" : "⏳ PENDING"}
              </p>
            </div>
          </div>
        </div>

        {/* Pending Screen */}
        {userRole === "pending" && (
          <div className="text-center py-10 space-y-4">
            <ShieldAlert className="w-16 h-16 mx-auto text-amber-500 animate-pulse" />
            <h3 className="text-xl font-bold font-sans uppercase tracking-widest text-amber-500">
              STATUS AKUN: PENDING
            </h3>
            <p className="font-mono text-xs opacity-80 max-w-lg mx-auto">
              Akun Anda telah berhasil didaftarkan ke dalam sistem kami. Namun, Anda belum diberikan hak akses (Role) untuk menggunakan fitur Cyber AI. Silakan hubungi Admin atau Reseller Anda untuk mengaktifkan akun.
            </p>
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://wa.me/628985292353?text=Hallo%20Min!%20Akun%20saya%20masih%20berstatus%20PENDING.%20Tolong%20diaktifkan%20dong!"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-6 rounded-lg font-mono text-xs uppercase tracking-wider font-bold bg-[#25D366] text-white hover:bg-[#20b958] transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(37,211,102,0.4)] hover:shadow-[0_0_25px_rgba(37,211,102,0.6)] hover:scale-105 active:scale-95"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 brightness-0 invert">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
                [ HUBUNGI ADMIN VIA WHATSAPP ]
              </a>

              <button
                onClick={handleFirebaseAuthLogout}
                className="py-2.5 px-6 rounded-lg font-mono text-xs uppercase tracking-wider font-bold border border-red-500/40 text-red-500 hover:bg-red-500/10 transition-all flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                [ LOGOUT ]
              </button>
            </div>
          </div>
        )}

        {/* Authorized User Screen */}
        {(userRole === "user premium" || userRole === "admin owner" || userRole === "reseller") && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-8">
              <div className="md:col-span-8 flex flex-col justify-center">
                <h3 className="font-bold text-sm tracking-wider uppercase font-sans mb-1">
                  PROCEED TO SECURE ENVIRONMENT
                </h3>
                <p className="text-xs opacity-75 font-mono mb-3 leading-relaxed">
                  Launch the automated decryption and cryptographic tunneling sequence to access the primary dashboard.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={onProceedToRedirect}
                    className={`py-3 px-6 rounded-lg font-mono text-xs uppercase tracking-wider font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                      isDark
                        ? "bg-[#a78bfa] text-black hover:bg-white hover:shadow-[0_0_20px_rgba(167,139,250,0.4)]"
                        : "bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                    }`}
                  >
                    <ExternalLink className="w-4 h-4" />
                    [ RUN REDIRECT TUNNEL ]
                  </button>

                  <button
                    onClick={handleFirebaseAuthLogout}
                    className="py-3 px-4 rounded-lg font-mono text-xs uppercase tracking-wider font-bold border border-red-500/40 text-red-500 hover:bg-red-500/10 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    [ LOGOUT ]
                  </button>
                </div>
              </div>

              {canManageRoles && (
                <div className={`md:col-span-4 p-4 rounded-lg border font-mono text-xs flex flex-col justify-center items-center text-center ${
                  isDark ? "bg-[#a78bfa]/5 border-[#a78bfa]/20" : "bg-indigo-50 border-indigo-100"
                }`}>
                  <Users className="w-8 h-8 mb-2 opacity-80" />
                  <div className="text-xl font-black">{users.length}</div>
                  <div className="text-[10px] tracking-widest opacity-60 uppercase mt-0.5">TOTAL REGISTERED NODES</div>
                </div>
              )}
            </div>

            {/* Notifications */}
            {message && (
              <div className={`p-4 mb-6 rounded-lg border text-xs font-mono flex items-start gap-3 ${
                message.isError 
                  ? "bg-red-950/20 border-red-500/40 text-red-400" 
                  : "bg-green-950/20 border-green-500/40 text-green-400"
              }`}>
                {message.isError ? <AlertTriangle className="w-4 h-4 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 mt-0.5" />}
                <div>
                  <p className="font-bold uppercase mb-0.5">{message.isError ? "SYSTEM ALERT" : "TRANSACTION CONFIRMED"}</p>
                  <p>{message.text}</p>
                </div>
              </div>
            )}

            {/* Role Management Dashboard */}
            {canManageRoles && (
              <div className="space-y-4 border-t border-neutral-700/30 pt-6">
                <div className="flex items-center justify-between border-b pb-3 border-neutral-700/20">
                  <h4 className="font-bold font-sans text-xs uppercase tracking-widest flex items-center gap-2">
                    <Settings className="w-4 h-4" /> USER & ROLE MANAGEMENT
                  </h4>
                  <button
                    onClick={fetchUsers}
                    disabled={isLoading}
                    className="p-1.5 rounded hover:bg-neutral-800/30 transition-all text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer border border-neutral-700/50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
                    SYNC DATA
                  </button>
                </div>

                <div className={`border rounded-lg overflow-x-auto custom-scrollbar font-mono text-[11px] ${
                  isDark ? "border-neutral-800 bg-black/40" : "border-neutral-200 bg-neutral-50/50"
                }`}>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={isDark ? "bg-neutral-900/60 border-b border-neutral-800" : "bg-neutral-200/50 border-b border-neutral-300"}>
                        <th className="p-3 font-bold opacity-70">EMAIL / NAMA</th>
                        <th className="p-3 font-bold opacity-70">ROLE SAAT INI</th>
                        <th className="p-3 font-bold opacity-70 text-right">AKSI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-6 text-center opacity-50 italic">Data kosong atau sedang memuat...</td>
                        </tr>
                      ) : (
                        users.map((u) => {
                          const isOwner = u.role === "admin owner";
                          
                          return (
                            <tr key={u.email} className={`border-b last:border-0 transition-colors ${
                              isDark ? "border-neutral-800 hover:bg-neutral-800/30" : "border-neutral-200 hover:bg-neutral-100"
                            }`}>
                              <td className="p-3">
                                <div className="font-bold">{u.email}</div>
                                <div className="text-[9px] opacity-60 mt-0.5">{u.name || "N/A"}</div>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider border ${
                                  u.role === "admin owner" ? "bg-amber-500/10 text-amber-500 border-amber-500/30" :
                                  u.role === "reseller" ? "bg-purple-500/10 text-purple-400 border-purple-500/30" :
                                  u.role === "user premium" ? "bg-green-500/10 text-green-400 border-green-500/30" :
                                  "bg-neutral-500/10 text-neutral-400 border-neutral-500/30"
                                }`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                {isOwner ? (
                                  <span className="text-[9px] opacity-50 uppercase">Terkunci (Owner)</span>
                                ) : (
                                  <div className="flex justify-end items-center gap-2">
                                    <select
                                      disabled={actionLoading}
                                      value={u.role}
                                      onChange={(e) => handleRoleChange(u.email, e.target.value as UserRole)}
                                      className={`p-1.5 rounded outline-none border cursor-pointer text-[10px] uppercase font-bold ${
                                        isDark ? "bg-black text-[#a78bfa] border-[#a78bfa]/30" : "bg-white text-indigo-700 border-indigo-300"
                                      }`}
                                    >
                                      <option value="pending">Pending</option>
                                      <option value="user premium">User Premium</option>
                                      {userRole === "admin owner" && (
                                        <option value="reseller">Reseller</option>
                                      )}
                                      {userRole === "admin owner" && (
                                        <option value="admin owner">Admin Owner</option>
                                      )}
                                    </select>
                                    
                                    {userRole === "admin owner" && (
                                      <button
                                        onClick={() => handleRemoveUser(u.email)}
                                        disabled={actionLoading}
                                        className="p-1.5 rounded text-red-400 hover:bg-red-500/15 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                                        title="Hapus Permanen"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};
