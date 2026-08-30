import { FormEvent, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

export function Transactions(){return <Simple title="Transactions" text="Your deposit, order, refund and adjustment transactions will appear here."/>}
export function Notifications(){return <Simple title="Notifications" text="No notifications yet."/>}
export function Support(){
  const {user}=useAuth(); const [subject,setSubject]=useState(""); const [message,setMessage]=useState(""); const [done,setDone]=useState("");
  const submit=async(e:FormEvent)=>{e.preventDefault();const {error}=await supabase.from("support_tickets").insert({user_id:user!.id,subject,message,status:"open"});setDone(error?error.message:"Ticket created successfully.");if(!error){setSubject("");setMessage("");}};
  return <div className="mx-auto max-w-3xl"><h1 className="text-3xl font-bold text-white">Support</h1><div className="card mt-7 p-6"><form onSubmit={submit} className="space-y-4"><input className="input" placeholder="Subject" value={subject} onChange={e=>setSubject(e.target.value)} required/><textarea className="input min-h-36" placeholder="How can we help?" value={message} onChange={e=>setMessage(e.target.value)} required/>{done&&<div className="rounded-xl bg-white/5 p-3 text-sm text-slate-300">{done}</div>}<button className="btn-primary">Create Ticket</button></form></div></div>
}
export function Profile(){const {profile}=useAuth();return <Simple title="Profile" text={`Name: ${profile?.name||"-"} · Username: ${profile?.username||"-"} · Email: ${profile?.email||"-"}`}/>}
function Simple({title,text}:{title:string;text:string}){return <div className="mx-auto max-w-5xl"><h1 className="text-3xl font-bold text-white">{title}</h1><div className="card mt-7 p-8 text-slate-400">{text}</div></div>}
export function PublicInfo({title}:{title:string}){return <div className="mx-auto max-w-4xl px-4 py-20"><h1 className="text-4xl font-bold text-white">{title}</h1><p className="mt-5 leading-8 text-slate-400">Boosty is a professional manual-order social growth panel. This page is ready for the owner's final content and policies.</p></div>}