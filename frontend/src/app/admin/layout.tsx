"use client";

import { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Tag, CreditCard, Shield, Activity,
  LogOut, ChevronDown, Settings,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.warpfix.org";

interface Admin {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthCtx {
  admin: Admin | null;
  token: string;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({ admin: null, token: "", logout: () => {} });
export const useAdmin = () => useContext(AuthContext);

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/promos", label: "Promos", icon: Tag },
  { href: "/admin/tiers", label: "Tiers & Plans", icon: CreditCard },
  { href: "/admin/activity", label: "Activity Log", icon: Activity },
  { href: "/admin/settings", label: "Admin Settings", icon: Settings },
];

function LoginPage({ onLogin }: { onLogin: (token: string, admin: Admin) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      onLogin(data.token, data.admin);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f8ff]">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-xl border border-[var(--border-default)] shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6 justify-center">
            <Image src="/logo-warpfix.png" alt="WarpFix" width={36} height={36} />
            <span className="font-semibold text-lg">Admin Panel</span>
          </div>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]"
                placeholder="admin@warpfix.dev"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]"
                placeholder="Enter password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[var(--brand)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState("");
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loaded, setLoaded] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const t = localStorage.getItem("warpfix_admin_token");
    const a = localStorage.getItem("warpfix_admin");
    if (t && a) {
      setToken(t);
      setAdmin(JSON.parse(a));
    }
    setLoaded(true);
  }, []);

  function handleLogin(t: string, a: Admin) {
    setToken(t);
    setAdmin(a);
    localStorage.setItem("warpfix_admin_token", t);
    localStorage.setItem("warpfix_admin", JSON.stringify(a));
  }

  function logout() {
    setToken("");
    setAdmin(null);
    localStorage.removeItem("warpfix_admin_token");
    localStorage.removeItem("warpfix_admin");
  }

  if (!loaded) return null;
  if (!token || !admin) return <LoginPage onLogin={handleLogin} />;

  return (
    <AuthContext.Provider value={{ admin, token, logout }}>
      <div className="flex min-h-screen bg-[#f8f9fb]">
        {/* Sidebar */}
        <aside className="hidden md:flex w-[240px] bg-white border-r border-[var(--border-default)] flex-col h-screen sticky top-0">
          <div className="h-14 flex items-center px-4 border-b border-[var(--border-default)]">
            <Link href="/admin" className="flex items-center gap-2.5">
              <Image src="/logo-warpfix.png" alt="WarpFix" width={32} height={32} />
              <span className="font-semibold text-[14px]">Admin</span>
            </Link>
          </div>
          <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
            {NAV.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    isActive
                      ? "bg-[var(--brand)]/8 text-[var(--brand)] font-medium"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-[var(--border-default)] p-3">
            <div className="flex items-center gap-2 px-2 py-1.5 text-[12px] text-[var(--text-tertiary)]">
              <Shield className="w-3.5 h-3.5" />
              <span className="truncate">{admin.email}</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-[12px] text-red-500 hover:bg-red-50 rounded-md transition-colors mt-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <header className="h-14 border-b border-[var(--border-default)] bg-white px-4 md:px-6 flex items-center justify-between sticky top-0 z-10">
            <h1 className="text-[15px] font-medium text-[var(--text-primary)]">
              {NAV.find((n) => n.href === pathname)?.label || "Admin Panel"}
            </h1>
            <div className="flex items-center gap-3 text-[13px] text-[var(--text-tertiary)]">
              <span className="px-2 py-1 bg-[var(--brand)]/8 text-[var(--brand)] rounded text-[11px] font-semibold uppercase">
                {admin.role.replace("_", " ")}
              </span>
              <span>{admin.name || admin.email}</span>
            </div>
          </header>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </AuthContext.Provider>
  );
}
