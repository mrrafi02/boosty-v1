import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, ShoppingCart, Package, Wallet, ReceiptText, Headphones, Bell, User, LogOut, Menu, X, Settings } from "lucide-react";
import Logo from "./Logo";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { money } from "../lib/format";

const items = [
  ["/dashboard", "Dashboard", LayoutDashboard],
  ["/new-order", "New Order", ShoppingCart],
  ["/services", "Services", Package],
  ["/orders", "Orders", ReceiptText],
  ["/add-funds", "Add Funds", Wallet],
  ["/transactions", "Transactions", ReceiptText],
  ["/support", "Support", Headphones],
  ["/notifications", "Notifications", Bell],
  ["/profile", "Profile", User],
] as const;

export default function AppShell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { profile, isAdmin } = useAuth();

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {open && <button aria-label="Close menu" className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-white/10 bg-slate-950/95 p-5 backdrop-blur transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between">
          <Link to="/dashboard" onClick={() => setOpen(false)}><Logo /></Link>
          <button className="btn-secondary p-2 lg:hidden" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="text-xs text-slate-500">Available Balance</div>
          <div className="mt-1 text-2xl font-bold text-white">{money(profile?.balance ?? 0)}</div>
        </div>
        <nav className="mt-6 space-y-1">
          {items.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${isActive ? "bg-boosty-600/15 text-boosty-300" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
              <Icon className="h-5 w-5" />{label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/admin" onClick={() => setOpen(false)} className="mt-4 flex items-center gap-3 rounded-xl border border-violet-400/20 bg-violet-400/10 px-4 py-3 text-sm font-semibold text-violet-200">
              <Settings className="h-5 w-5" /> Admin Panel
            </NavLink>
          )}
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white">
            <LogOut className="h-5 w-5" /> Logout
          </button>
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 px-4 py-4 backdrop-blur md:px-8">
          <div className="flex items-center justify-between">
            <button className="btn-secondary p-2 lg:hidden" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
            <div className="hidden lg:block">
              <div className="text-sm text-slate-400">Welcome back</div>
              <div className="font-semibold text-white">{profile?.name || profile?.username || "Boosty User"}</div>
            </div>
            <Link to="/add-funds" className="btn-primary py-2.5">Add Funds</Link>
          </div>
        </header>
        <main className="p-4 md:p-8"><Outlet /></main>
      </div>
    </div>
  );
}