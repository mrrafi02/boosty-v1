import { Link } from "react-router-dom";
import { ArrowRight, Clock3, CheckCircle2, ShoppingBag, Wallet } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { money } from "../lib/format";

export default function Dashboard() {
  const { profile } = useAuth();
  const cards = [
    ["Balance", money(profile?.balance ?? 0), Wallet],
    ["Total Orders", "0", ShoppingBag],
    ["Pending", "0", Clock3],
    ["Completed", "0", CheckCircle2]
  ];
  return <div className="mx-auto max-w-7xl">
    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-sm text-boosty-300">Dashboard</p><h1 className="mt-1 text-3xl font-bold text-white">Grow smarter with Boosty.</h1></div><Link to="/new-order" className="btn-primary inline-flex items-center justify-center gap-2">New Order <ArrowRight className="h-4 w-4" /></Link></div>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label,value,Icon]) => <div className="card p-5" key={label as string}><Icon className="h-5 w-5 text-boosty-400" /><div className="mt-5 text-sm text-slate-500">{label as string}</div><div className="mt-1 text-2xl font-bold text-white">{value as string}</div></div>)}</div>
    <div className="mt-6 grid gap-6 lg:grid-cols-2"><div className="card p-6"><h2 className="font-bold text-white">Recent Orders</h2><div className="mt-8 text-center text-sm text-slate-500">No orders yet. Place your first order to get started.</div></div><div className="card p-6"><h2 className="font-bold text-white">Announcements</h2><div className="mt-8 text-center text-sm text-slate-500">No announcements yet.</div></div></div>
  </div>;
}