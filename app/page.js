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
    await supabase.from("tasks").update({ done: !current }).eq("id", taskId);
    setClients(c => c.map(cl => cl.id === clientId
      ? { ...cl, tasks: cl.tasks.map(t => t.id === taskId ? { ...t, done: !current } : t) }
      : cl));
  };

  const deleteTask = async (clientId, taskId) => {
    await supabase.from("tasks").delete().eq("id", taskId);
    setClients(c => c.map(cl => cl.id === clientId
      ? { ...cl, tasks: cl.tasks.filter(t => t.id !== taskId) } : cl));
  };

  const clearDone = async () => {
    const ids = clients.flatMap(cl => cl.tasks.filter(t => t.done).map(t => t.id));
    if (ids.length === 0) return;
    await supabase.from("tasks").delete().in("id", ids);
    setClients(c => c.map(cl => ({ ...cl, tasks: cl.tasks.filter(t => !t.done) })));
  };

  const signOut = async () => { await supabase.auth.signOut(); router.push("/login"); router.refresh(); };

  if (loading) return <div className="app"><div className="empty" style={{margin:"auto"}}>Loading...</div></div>;

  return (
    <div className="app">
      <div className="topbar">
        <h1>📋 Client Task Tracker</h1>
        <input placeholder="New client name…" value={newClient}
          onChange={e => setNewClient(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addClient()} />
        <button onClick={addClient}>+ Add Client</button>
        <button className="ghost" onClick={clearDone}>Clear done</button>
        <span className="user">{email}</span>
        <button className="ghost" onClick={signOut}>Sign out</button>
      </div>
      <div className="board">
        {clients.length === 0 && <div className="empty" style={{margin:"auto"}}>Add your first client →</div>}
        {clients.map(cl => (
          <ClientColumn key={cl.id} client={cl}
            onAddTask={(t) => addTask(cl.id, t)}
            onToggle={(tid, cur) => toggleTask(cl.id, tid, cur)}
            onDelete={(tid) => deleteTask(cl.id, tid)}
            onRemoveClient={() => removeClient(cl.id)} />
        ))}
      </div>
    </div>
  );
}

function ClientColumn({ client, onAddTask, onToggle, onDelete, onRemoveClient }) {
  const [text, setText] = useState("");
  const pending = client.tasks.filter(t => !t.done).length;
  const submit = () => { onAddTask(text); setText(""); };
  return (
    <div className="col">
      <header>
        <span className="name">{client.name}</span>
        <span className="count">{pending} pending</span>
        <button className="del" onClick={onRemoveClient}>✕</button>
      </header>
      <div className="add">
        <input placeholder="Add task…" value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()} />
        <button onClick={submit}>Add</button>
      </div>
      <div className="list">
        {client.tasks.length === 0 && <div className="empty">No tasks yet</div>}
        {client.tasks.map(t => (
          <div key={t.id} className={`task ${t.done ? "done" : ""}`}>
            <input type="checkbox" checked={t.done} onChange={() => onToggle(t.id, t.done)} />
            <span className="text">{t.text}</span>
            <button className="x" onClick={() => onDelete(t.id)}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
