import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import type { Order } from "../lib/types";
import { money, dateTime } from "../lib/format";

export default function Orders() {
  const { user } = useAuth(); const [orders,setOrders]=useState<Order[]>([]);
  useEffect(()=>{ if(!user)return; supabase.from("orders").select("*, service:services(*)").eq("user_id",user.id).order("created_at",{ascending:false}).then(({data})=>setOrders((data??[]) as Order[])); },[user]);
  return <div className="mx-auto max-w-7xl"><h1 className="text-3xl font-bold text-white">Orders</h1><div className="card mt-7 overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-white/10 text-slate-500"><tr>{["Order","Service","Quantity","Charge","Status","Date"].map(x=><th className="px-5 py-4 font-medium" key={x}>{x}</th>)}</tr></thead><tbody>{orders.map(o=><tr className="border-b border-white/5 text-slate-300" key={o.id}><td className="px-5 py-4 font-semibold text-white">#{o.order_number}</td><td className="px-5 py-4">{o.service?.name || "Service"}</td><td className="px-5 py-4">{o.quantity.toLocaleString()}</td><td className="px-5 py-4">{money(o.charge)}</td><td className="px-5 py-4"><span className="rounded-full bg-white/5 px-3 py-1 text-xs">{o.status}</span></td><td className="px-5 py-4">{dateTime(o.created_at)}</td></tr>)}</tbody></table></div>{!orders.length&&<div className="p-10 text-center text-slate-500">No orders yet.</div>}</div></div>;
}