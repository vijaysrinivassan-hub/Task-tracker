"use client";
import { useEffect, useState, useRef } from "react";

const STORAGE_KEY = "client-task-tracker-v1";

export default function Home() {
  const [clients, setClients] = useState([]);
  const [newClient, setNewClient] = useState("");
  const loaded = useRef(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) { try { setClients(JSON.parse(raw)); } catch {} }
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (loaded.current) localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  }, [clients]);

  const addClient = () => {
    const name = newClient.trim();
    if (!name) return;
    setClients(c => [...c, { id: crypto.randomUUID(), name, tasks: [] }]);
    setNewClient("");
  };

  const removeClient = (id) => {
    if (!confirm("Remove this client and all its tasks?")) return;
    setClients(c => c.filter(x => x.id !== id));
  };

  const addTask = (clientId, text) => {
    const t = text.trim();
    if (!t) return;
    setClients(c => c.map(cl => cl.id === clientId
      ? { ...cl, tasks: [{ id: crypto.randomUUID(), text: t, done: false, ts: Date.now() }, ...cl.tasks] }
      : cl));
  };

  const toggleTask = (clientId, taskId) => {
    setClients(c => c.map(cl => cl.id === clientId
      ? { ...cl, tasks: cl.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t) }
      : cl));
  };

  const deleteTask = (clientId, taskId) => {
    setClients(c => c.map(cl => cl.id === clientId
      ? { ...cl, tasks: cl.tasks.filter(t => t.id !== taskId) }
      : cl));
  };

  const clearDone = () => {
    setClients(c => c.map(cl => ({ ...cl, tasks: cl.tasks.filter(t => !t.done) })));
  };

  return (
    <div className="app">
      <div className="topbar">
        <h1>📋 Client Task Tracker</h1>
        <input
          placeholder="New client name…"
          value={newClient}
          onChange={e => setNewClient(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addClient()}
        />
        <button onClick={addClient}>+ Add Client</button>
        <button className="ghost" onClick={clearDone}>Clear done</button>
      </div>

      <div className="board">
        {clients.length === 0 && (
          <div className="empty" style={{margin: "auto"}}>Add your first client to get started →</div>
        )}
        {clients.map(cl => (
          <ClientColumn
            key={cl.id}
            client={cl}
            onAddTask={(t) => addTask(cl.id, t)}
            onToggle={(tid) => toggleTask(cl.id, tid)}
            onDelete={(tid) => deleteTask(cl.id, tid)}
            onRemoveClient={() => removeClient(cl.id)}
          />
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
        <button className="del" onClick={onRemoveClient} title="Remove client">✕</button>
      </header>
      <div className="add">
        <input
          placeholder="Add task…"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
        />
        <button onClick={submit}>Add</button>
      </div>
      <div className="list">
        {client.tasks.length === 0 && <div className="empty">No tasks yet</div>}
        {client.tasks.map(t => (
          <div key={t.id} className={`task ${t.done ? "done" : ""}`}>
            <input type="checkbox" checked={t.done} onChange={() => onToggle(t.id)} />
            <span className="text">{t.text}</span>
            <button className="x" onClick={() => onDelete(t.id)} title="Delete">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
