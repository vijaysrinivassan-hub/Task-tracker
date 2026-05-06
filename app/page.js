"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";

export default function Home() {
  const [clients, setClients] = useState([]);
  const [newClient, setNewClient] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    setEmail(user.email);
    const { data: cls } = await supabase.from("clients").select("*").order("created_at");
    const { data: tks } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
    const merged = (cls || []).map(c => ({ ...c, tasks: (tks || []).filter(t => t.client_id === c.id) }));
    setClients(merged);
    setLoading(false);
  };

  const addClient = async () => {
    const name = newClient.trim();
    if (!name) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from("clients").insert({ name, user_id: user.id }).select().single();
    if (data) setClients(c => [...c, { ...data, tasks: [] }]);
    setNewClient("");
  };

  const removeClient = async (id) => {
    if (!confirm("Remove this client and all its tasks?")) return;
    await supabase.from("clients").delete().eq("id", id);
    setClients(c => c.filter(x => x.id !== id));
  };

  const addTask = async (clientId, text) => {
    const t = text.trim();
    if (!t) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from("tasks").insert({ client_id: clientId, user_id: user.id, text: t }).select().single();
    if (data) {
      setClients(c => c.map(cl => cl.id === clientId ? { ...cl, tasks: [data, ...cl.tasks] } : cl));
    }
  };

  const toggleTask = async (clientId, taskId, current) => {
    await supabase.from("tasks").update({ done
