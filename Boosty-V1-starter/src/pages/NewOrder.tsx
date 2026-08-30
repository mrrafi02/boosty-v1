import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Category, Service } from "../lib/types";
import { money } from "../lib/format";
import { useAuth } from "../context/AuthContext";

export default function NewOrder() {
  const [params] = useSearchParams(); const navigate = useNavigate(); const { profile } = useAuth();
  const [categories,setCategories]=useState<Category[]>([]); const [services,setServices]=useState<Service[]>([]);
  const [cat,setCat]=useState(""); const [serviceId,setServiceId]=useState(params.get("service") || "");
  const [link,setLink]=useState(""); const [quantity,setQuantity]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  useEffect(()=>{ Promise.all([supabase.from("categories").select("*").eq("status","active").order("sort_order"),supabase.from("services").select("*").eq("status","active").order("sort_order")]).then(([c,s])=>{setCategories((c.data??[]) as Category[]);setServices((s.data??[]) as Service[]);}); },[]);
  const filtered=useMemo(()=>services.filter(s=>!cat || s.category_id===cat),[services,cat]);
  const selected=services.find(s=>s.id===serviceId);
  const qty=Number(quantity)||0; const charge=selected ? qty/1000*selected.rate_per_1000 : 0;
  const submit=async(e:FormEvent)=>{e.preventDefault();setError(""); if(!selected)return setError("Select a service."); if(qty<selected.min_quantity||qty>selected.max_quantity)return setError(`Quantity must be between ${selected.min_quantity.toLocaleString()} and ${selected.max_quantity.toLocaleString()}.`); if(!/^https?:\\/\\//i.test(link.trim()))return setError("Enter a valid URL."); if((profile?.balance??0)<charge)return setError("Insufficient balance. Please add funds."); setBusy(true);
    const {data,error}=await supabase.rpc("place_order",{p_service_id:selected.id,p_link:link.trim(),p_quantity:qty});
    if(error) setError(error.message); else navigate(`/orders?created=${data}`); setBusy(false);
  };
  return <div className="mx-auto max-w-3xl"><p className="text-sm text-boosty-300">Order</p><h1 className="mt-1 text-3xl font-bold text-white">New Order</h1>
    <form onSubmit={submit} className="card mt-7 space-y-5 p-6">
      <div><label className="mb-2 block text-sm text-slate-300">Category</label><select className="input" value={cat} onChange={e=>{setCat(e.target.value);setServiceId("");}}><option value="">Select category</option>{categories.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></div>
      <div><label className="mb-2 block text-sm text-slate-300">Service</label><select className="input" value={serviceId} onChange={e=>setServiceId(e.target.value)}><option value="">Select service</option>{filtered.map(s=><option value={s.id} key={s.id}>{s.service_id} — {s.name}</option>)}</select></div>
      {selected && <div className="rounded-xl border border-boosty-500/20 bg-boosty-500/5 p-4 text-sm text-slate-300"><div className="font-semibold text-white">{selected.name}</div><div className="mt-2">{selected.description}</div><div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400"><span>Min {selected.min_quantity}</span><span>Max {selected.max_quantity.toLocaleString()}</span><span>{selected.speed}</span><span>{selected.refill}</span></div></div>}
      <div><label className="mb-2 block text-sm text-slate-300">Link</label><input className="input" placeholder="https://facebook.com/..." value={link} onChange={e=>setLink(e.target.value)} required /></div>
      <div><label className="mb-2 block text-sm text-slate-300">Quantity</label><input className="input" type="number" min={selected?.min_quantity} max={selected?.max_quantity} value={quantity} onChange={e=>setQuantity(e.target.value)} required /></div>
      <div className="rounded-2xl bg-white/[0.04] p-5"><div className="flex justify-between text-sm text-slate-400"><span>Your balance</span><span>{money(profile?.balance??0)}</span></div><div className="mt-3 flex justify-between"><span className="font-semibold text-white">Total charge</span><span className="text-xl font-bold text-white">{money(charge)}</span></div></div>
      {error&&<div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
      <button className="btn-primary w-full" disabled={busy}>{busy?"Creating order...":"Confirm Order"}</button>
    </form>
  </div>;
}