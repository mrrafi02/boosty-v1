import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Category, Service } from "../lib/types";
import { money } from "../lib/format";

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState("all");
  useEffect(() => {
    Promise.all([
      supabase.from("categories").select("*").eq("status","active").order("sort_order"),
      supabase.from("services").select("*, category:categories(*)").eq("status","active").order("sort_order")
    ]).then(([c,s]) => { setCategories((c.data ?? []) as Category[]); setServices((s.data ?? []) as Service[]); });
  }, []);
  const visible = category === "all" ? services : services.filter(s => s.category_id === category);
  return <div className="mx-auto max-w-7xl"><div><p className="text-sm text-boosty-300">Catalog</p><h1 className="mt-1 text-3xl font-bold text-white">Facebook Services</h1></div>
    <div className="mt-7 flex gap-2 overflow-x-auto pb-2"><button className={`rounded-xl px-4 py-2 text-sm ${category==="all"?"bg-boosty-600 text-white":"bg-white/5 text-slate-400"}`} onClick={()=>setCategory("all")}>All</button>{categories.map(c=><button key={c.id} className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm ${category===c.id?"bg-boosty-600 text-white":"bg-white/5 text-slate-400"}`} onClick={()=>setCategory(c.id)}>{c.name}</button>)}</div>
    <div className="mt-6 grid gap-4">{visible.map(s=><div className="card p-5" key={s.id}><div className="flex flex-col justify-between gap-4 md:flex-row"><div><div className="text-xs text-boosty-300">ID: {s.service_id}</div><h2 className="mt-1 font-bold text-white">{s.name}</h2><p className="mt-2 text-sm text-slate-400">{s.description}</p><div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500"><span>Max {s.max_quantity.toLocaleString()}</span><span>•</span><span>{s.speed || "Manual"}</span><span>•</span><span>{s.start_time || "Instant"}</span><span>•</span><span>{s.refill || "No Refill"}</span></div></div><div className="flex items-center justify-between gap-5 md:block md:text-right"><div className="text-lg font-bold text-white">{money(s.rate_per_1000)} / 1K</div><Link to={`/new-order?service=${s.id}`} className="mt-2 inline-block text-sm font-semibold text-boosty-300">Order →</Link></div></div></div>)}</div>
    {visible.length===0 && <div className="card mt-6 p-10 text-center text-slate-500">No services available.</div>}
  </div>;
}