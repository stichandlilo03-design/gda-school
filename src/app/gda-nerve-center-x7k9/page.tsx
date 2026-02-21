"use client";
import { useState, useEffect, useCallback } from "react";

const API = "/api/gda-admin";
type Tab = "dashboard"|"schools"|"users"|"live"|"features"|"tickets"|"inbox"|"logs"|"broadcast"|"health"|"config"|"database"|"framework";

export default function GdaNerveCenter() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [unread, setUnread] = useState({ messages: 0, tickets: 0 });
  const [lastUnread, setLastUnread] = useState(0);

  const api = useCallback(async (action: string, params?: Record<string, string>) => {
    const qs = new URLSearchParams({ action, key, ...params }).toString();
    const r = await fetch(`${API}?${qs}`);
    return r.json();
  }, [key]);

  const post = useCallback(async (body: any) => {
    const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key }, body: JSON.stringify(body) });
    return r.json();
  }, [key]);

  const login = async () => {
    const r = await fetch(`${API}?action=stats&key=${key}`);
    if (r.ok) { setAuthed(true); } else { setMsg("Invalid admin key"); }
  };

  const loadTab = useCallback(async () => {
    setLoading(true); setMsg("");
    try {
      if (tab === "dashboard") setData(await api("stats"));
      else if (tab === "schools") setData(await api("schools"));
      else if (tab === "users") setData(await api("users"));
      else if (tab === "live") setData(await api("live_sessions"));
      else if (tab === "features") setData(await api("features"));
      else if (tab === "tickets") setData(await api("tickets"));
      else if (tab === "inbox") setData(await api("inbox"));
      else if (tab === "logs") setData(await api("logs"));
      else if (tab === "health") setData(await api("health"));
      else if (tab === "config") setData(await api("env"));
      else if (tab === "database") setData(await api("db_tables"));
      else setData(null);
    } catch (e: any) { setMsg(e.message); }
    setLoading(false);
  }, [tab, api]);

  useEffect(() => { if (authed) loadTab(); }, [authed, tab, loadTab]);

  // Poll for unread messages + tickets with sound alert
  useEffect(() => {
    if (!authed) return;
    const poll = async () => {
      try {
        const r = await fetch(`${API}?action=unread&key=${key}`);
        if (r.ok) {
          const d = await r.json();
          const total = (d.messages || 0) + (d.tickets || 0);
          if (total > lastUnread && lastUnread > 0) {
            // Play alert sound
            try {
              const ac = new AudioContext();
              const osc = ac.createOscillator();
              const gain = ac.createGain();
              osc.connect(gain); gain.connect(ac.destination);
              osc.frequency.value = 880;
              gain.gain.value = 0.3;
              osc.start(); osc.stop(ac.currentTime + 0.15);
              setTimeout(() => { const o2 = ac.createOscillator(); o2.connect(gain); o2.frequency.value = 1100; o2.start(); o2.stop(ac.currentTime + 0.15); }, 200);
            } catch {}
          }
          setUnread(d);
          setLastUnread(total);
        }
      } catch {}
    };
    poll();
    const i = setInterval(poll, 10000);
    return () => clearInterval(i);
  }, [authed, key, lastUnread]);

  // ===== LOGIN SCREEN =====
  if (!authed) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-96 border border-gray-700">
        <h1 className="text-xl font-bold text-white text-center mb-1">GDA NERVE CENTER</h1>
        <p className="text-xs text-gray-500 text-center mb-6">Super Admin Access</p>
        <input type="password" placeholder="Enter admin key..." className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 outline-none text-sm"
          value={key} onChange={e => setKey(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} />
        <button onClick={login} className="w-full mt-3 bg-blue-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-blue-700">ACCESS</button>
        {msg && <p className="text-red-400 text-xs text-center mt-3">{msg}</p>}
      </div>
    </div>
  );

  // ===== TABS CONFIG =====
  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "schools", label: "Schools", icon: "🏫" },
    { id: "users", label: "Users", icon: "👥" },
    { id: "live", label: "Live Sessions", icon: "🔴" },
    { id: "features", label: "Feature Flags", icon: "🚀" },
    { id: "tickets", label: "Support", icon: "🎫" },
    { id: "inbox", label: "Inbox", icon: "💬" },
    { id: "logs", label: "Logs & Debug", icon: "📋" },
    { id: "broadcast", label: "Broadcast", icon: "📢" },
    { id: "health", label: "Health", icon: "🏥" },
    { id: "config", label: "Config & ENV", icon: "⚙️" },
    { id: "database", label: "Database", icon: "🗄️" },
    { id: "framework", label: "Framework Map", icon: "🗺️" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* SIDEBAR */}
      <div className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-sm font-bold text-blue-400">GDA NERVE CENTER</h1>
          <p className="text-[9px] text-gray-600 mt-0.5">Super Admin Panel</p>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full text-left px-4 py-2.5 text-xs flex items-center gap-2 ${tab === t.id ? "bg-blue-600/20 text-blue-400 border-r-2 border-blue-400" : "text-gray-400 hover:bg-gray-800"}`}>
              <span>{t.icon}</span> {t.label}
              {t.id === "inbox" && unread.messages > 0 && <span className="ml-auto bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full animate-pulse">{unread.messages}</span>}
              {t.id === "tickets" && unread.tickets > 0 && <span className="ml-auto bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{unread.tickets}</span>}
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-gray-800">
          <button onClick={() => { setAuthed(false); setKey(""); }} className="w-full text-xs text-red-400 hover:text-red-300 py-1">🔒 Lock Panel</button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">{TABS.find(t => t.id === tab)?.icon} {TABS.find(t => t.id === tab)?.label}</h2>
          <div className="flex items-center gap-2">
            {msg && <span className="text-xs text-amber-400 bg-amber-400/10 px-3 py-1 rounded">{msg}</span>}
            <button onClick={loadTab} className="text-xs bg-gray-800 text-gray-400 px-3 py-1.5 rounded-lg hover:bg-gray-700">
              {loading ? "Loading..." : "🔄 Refresh"}
            </button>
          </div>
        </div>

        {/* DASHBOARD */}
        {tab === "dashboard" && data && <DashboardTab data={data} post={post} setMsg={setMsg} loadTab={loadTab} />}
        {/* SCHOOLS */}
        {tab === "schools" && data && <SchoolsTab data={data} post={post} setMsg={setMsg} loadTab={loadTab} />}
        {/* USERS */}
        {tab === "users" && <UsersTab api={api} post={post} setMsg={setMsg} />}
        {/* LIVE */}
        {tab === "live" && data && <LiveTab data={data} post={post} setMsg={setMsg} loadTab={loadTab} />}
        {/* FEATURES */}
        {tab === "features" && data && <FeaturesTab data={data} post={post} setMsg={setMsg} loadTab={loadTab} />}
        {/* TICKETS */}
        {tab === "tickets" && data && <TicketsTab data={data} post={post} setMsg={setMsg} loadTab={loadTab} />}
        {/* INBOX */}
        {tab === "inbox" && data && <InboxTab data={data} post={post} setMsg={setMsg} loadTab={loadTab} />}
        {/* LOGS */}
        {tab === "logs" && data && <LogsTab data={data} api={api} post={post} setData={setData} setMsg={setMsg} />}
        {/* BROADCAST */}
        {tab === "broadcast" && <BroadcastTab post={post} setMsg={setMsg} />}
        {/* HEALTH */}
        {tab === "health" && data && <HealthTab data={data} />}
        {/* CONFIG */}
        {tab === "config" && data && <ConfigTab data={data} />}
        {/* DATABASE */}
        {tab === "database" && data && <DatabaseTab data={data} />}
        {/* FRAMEWORK */}
        {tab === "framework" && <FrameworkTab />}
      </div>
    </div>
  );
}

// ============================================================
// TAB COMPONENTS
// ============================================================

function StatCard({ label, value, color = "blue", icon }: { label: string; value: any; color?: string; icon: string }) {
  const colors: Record<string, string> = { blue: "from-blue-600 to-blue-800", green: "from-emerald-600 to-emerald-800", amber: "from-amber-600 to-amber-800", red: "from-red-600 to-red-800", purple: "from-purple-600 to-purple-800" };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-4 shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-white/60 uppercase">{label}</p>
          <p className="text-2xl font-bold mt-1">{typeof value === "number" ? value.toLocaleString() : value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

function DashboardTab({ data, post, setMsg, loadTab }: any) {
  const [maintenanceReason, setMaintenanceReason] = useState("");
  const maint = data.maintenanceMode || { enabled: false, reason: "" };

  const toggleMaintenance = async (enable: boolean) => {
    if (enable && !maintenanceReason.trim()) { setMsg("Enter a reason"); return; }
    await post({ action: "set_maintenance", enabled: enable, reason: maintenanceReason || "System maintenance" });
    setMsg(enable ? "🔴 MAINTENANCE MODE ON" : "🟢 Site is live");
    loadTab();
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Schools" value={data.schools} color="blue" icon="🏫" />
        <StatCard label="Teachers" value={data.teachers} color="green" icon="👩‍🏫" />
        <StatCard label="Students" value={data.students} color="purple" icon="🎓" />
        <StatCard label="Parents" value={data.parents} color="amber" icon="👨‍👩‍👧" />
        <StatCard label="Live Sessions" value={data.liveSessions} color="red" icon="🔴" />
        <StatCard label="Open Tickets" value={data.openTickets} color="amber" icon="🎫" />
        <StatCard label="Today Sessions" value={data.todaySessions} color="blue" icon="📅" />
        <StatCard label="Today New Users" value={data.todayNewUsers} color="green" icon="👤" />
      </div>

      {/* Maintenance Mode */}
      <div className={`rounded-xl p-5 border ${maint.enabled ? "bg-red-900/30 border-red-500" : "bg-gray-800/50 border-gray-700"}`}>
        <h3 className="text-sm font-bold flex items-center gap-2">
          {maint.enabled ? "🔴 MAINTENANCE MODE ACTIVE" : "🟢 Site is Live"}
        </h3>
        {maint.enabled && <p className="text-xs text-red-300 mt-1">Reason: {maint.reason}</p>}
        <div className="flex items-center gap-2 mt-3">
          <input className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg text-xs border border-gray-600" placeholder="Maintenance reason..." value={maintenanceReason} onChange={e => setMaintenanceReason(e.target.value)} />
          {!maint.enabled ? (
            <button onClick={() => toggleMaintenance(true)} className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700">🛑 Enable Maintenance</button>
          ) : (
            <button onClick={() => toggleMaintenance(false)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700">🟢 Go Live</button>
          )}
        </div>
      </div>

      {/* Recent Logs */}
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <h3 className="text-sm font-bold mb-3">📋 Recent Activity</h3>
        {(data.recentLogs || []).map((l: any) => (
          <div key={l.id} className="flex items-center gap-2 py-1.5 border-b border-gray-700/50 last:border-0">
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${l.level === "ERROR" || l.level === "CRITICAL" ? "bg-red-500/20 text-red-400" : l.level === "WARN" ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"}`}>{l.level}</span>
            <span className="text-[10px] text-gray-500">[{l.source}]</span>
            <span className="text-xs text-gray-300 flex-1">{l.message}</span>
            <span className="text-[9px] text-gray-600">{new Date(l.createdAt).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SchoolsTab({ data, post, setMsg, loadTab }: any) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 mb-3">{data.length} schools registered</p>
      {data.map((s: any) => (
        <div key={s.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 flex items-start justify-between">
          <div>
            <h4 className="text-sm font-bold">{s.name}</h4>
            <p className="text-[10px] text-gray-500 mt-0.5">{s.address || "No address"} | {s.countryCode || "??"} | Code: {s.code}</p>
            <div className="flex gap-3 mt-1.5">
              <span className="text-[10px] text-blue-400">👩‍🏫 {s._count?.teachers || 0} teachers</span>
              <span className="text-[10px] text-purple-400">🎓 {s.studentCount || 0} students</span>
              <span className="text-[10px] text-emerald-400">📚 {s._count?.grades || 0} grades</span>
              <span className="text-[10px] text-gray-500">Principal: {s.principal?.user?.name || "None"}</span>
            </div>
            <p className="text-[9px] text-gray-600 mt-1">Created: {new Date(s.createdAt).toLocaleDateString()} | ID: {s.id.slice(0, 8)}...</p>
          </div>
          <div className="flex flex-col gap-1">
            <span className={`text-[9px] px-2 py-0.5 rounded-full text-center ${s.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>{s.isActive ? "Active" : "Inactive"}</span>
            <button onClick={async () => { if (confirm(`DELETE school "${s.name}"? This removes ALL data!`)) { await post({ action: "delete_school", schoolId: s.id }); setMsg("School deleted"); loadTab(); } }}
              className="text-[9px] text-red-400 hover:text-red-300 mt-1">Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function UsersTab({ api, post, setMsg }: any) {
  const [users, setUsers] = useState<any[]>([]);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");

  const load = async (role?: string) => {
    const r = await api("users", role ? { role } : {});
    setUsers(r);
  };
  useEffect(() => { load(roleFilter); }, [roleFilter]);

  const filtered = users.filter((u: any) => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        {["", "PRINCIPAL", "TEACHER", "STUDENT", "PARENT"].map(r => (
          <button key={r} onClick={() => setRoleFilter(r)} className={`text-[10px] px-3 py-1.5 rounded-lg ${roleFilter === r ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400"}`}>{r || "All"}</button>
        ))}
        <input className="flex-1 bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs border border-gray-700" placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <p className="text-xs text-gray-500">{filtered.length} users</p>
      <div className="max-h-[60vh] overflow-y-auto space-y-1">
        {filtered.map((u: any) => (
          <div key={u.id} className="bg-gray-800/50 rounded-lg px-4 py-2.5 border border-gray-700/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs">{u.name?.[0] || "?"}</div>
              <div>
                <p className="text-xs font-medium">{u.name || "Unnamed"}</p>
                <p className="text-[10px] text-gray-500">{u.email} | {new Date(u.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] px-2 py-0.5 rounded-full ${u.role === "PRINCIPAL" ? "bg-purple-500/20 text-purple-400" : u.role === "TEACHER" ? "bg-blue-500/20 text-blue-400" : u.role === "STUDENT" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>{u.role}</span>
              <button onClick={async () => { await post({ action: "toggle_user", userId: u.id }); setMsg(`User ${u.isActive ? "deactivated" : "activated"}`); load(roleFilter); }}
                className={`text-[9px] px-2 py-0.5 rounded ${u.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>{u.isActive ? "Active" : "Disabled"}</button>
              <button onClick={async () => { if (confirm(`DELETE user ${u.email}? This is permanent!`)) { await post({ action: "delete_user", userId: u.id }); setMsg("Deleted"); load(roleFilter); } }}
                className="text-[9px] text-red-500 hover:text-red-400">×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveTab({ data, post, setMsg, loadTab }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{data.length} active sessions</p>
        {data.length > 0 && (
          <button onClick={async () => { if (confirm("Force-end ALL live sessions?")) { const r = await post({ action: "force_end_sessions" }); setMsg(`Ended ${r.ended} sessions`); loadTab(); } }}
            className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-red-700">⚡ Force End All</button>
        )}
      </div>
      {data.map((s: any) => (
        <div key={s.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2.5 h-2.5 rounded-full ${s.isPrep ? "bg-amber-500" : "bg-red-500 animate-pulse"}`} />
            <h4 className="text-sm font-bold">{s.class?.subject?.name || s.class?.name || "Unknown"}</h4>
            <span className={`text-[9px] px-2 py-0.5 rounded-full ${s.isPrep ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"}`}>{s.isPrep ? "PREP" : "LIVE"}</span>
          </div>
          <p className="text-[10px] text-gray-500">Teacher: {s.teacher?.user?.name} | School: {s.class?.schoolGrade?.school?.name || "?"}</p>
          <p className="text-[10px] text-gray-600">Started: {s.startedAt ? new Date(s.startedAt).toLocaleTimeString() : "?"} | Duration: {s.startedAt ? Math.round((Date.now() - new Date(s.startedAt).getTime()) / 60000) : 0}min</p>
        </div>
      ))}
      {data.length === 0 && <p className="text-gray-600 text-center py-12">No live sessions right now</p>}
    </div>
  );
}

function FeaturesTab({ data, post, setMsg, loadTab }: any) {
  const [newKey, setNewKey] = useState("");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCat, setNewCat] = useState("general");

  const seedFeatures = async () => {
    const r = await post({ action: "seed_features" });
    setMsg(`Created ${r.created} features`);
    loadTab();
  };

  const createFeature = async () => {
    if (!newKey || !newName) return;
    await post({ action: "create_feature", key: newKey, name: newName, description: newDesc, category: newCat });
    setNewKey(""); setNewName(""); setNewDesc("");
    setMsg("Feature created");
    loadTab();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={seedFeatures} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">🌱 Seed Default Features</button>
      </div>

      {/* Create new */}
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 space-y-2">
        <h4 className="text-xs font-bold">Create New Feature Flag</h4>
        <div className="grid grid-cols-4 gap-2">
          <input className="bg-gray-700 text-white px-3 py-2 rounded-lg text-xs border border-gray-600" placeholder="key (e.g. new_feature)" value={newKey} onChange={e => setNewKey(e.target.value)} />
          <input className="bg-gray-700 text-white px-3 py-2 rounded-lg text-xs border border-gray-600" placeholder="Display Name" value={newName} onChange={e => setNewName(e.target.value)} />
          <input className="bg-gray-700 text-white px-3 py-2 rounded-lg text-xs border border-gray-600" placeholder="Description" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
          <div className="flex gap-1">
            <select className="flex-1 bg-gray-700 text-white px-2 py-2 rounded-lg text-xs border border-gray-600" value={newCat} onChange={e => setNewCat(e.target.value)}>
              {["general", "billing", "classroom", "communication"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={createFeature} className="px-3 bg-emerald-600 text-white rounded-lg text-xs font-bold">+ Add</button>
          </div>
        </div>
      </div>

      {/* Feature list */}
      {data.map((f: any) => (
        <div key={f.id} className={`rounded-xl p-4 border flex items-start justify-between ${f.published ? "bg-emerald-900/20 border-emerald-700" : "bg-gray-800/50 border-gray-700"}`}>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold">{f.name}</h4>
              <span className="text-[9px] bg-gray-600 text-gray-300 px-1.5 py-0.5 rounded font-mono">{f.key}</span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full ${f.published ? "bg-emerald-500 text-white" : "bg-gray-600 text-gray-300"}`}>{f.published ? "PUBLISHED" : "DRAFT"}</span>
              <span className="text-[9px] text-gray-500">{f.category}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{f.description}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={async () => { await post({ action: "toggle_feature", featureId: f.id }); setMsg(f.published ? "Unpublished" : "Published!"); loadTab(); }}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold ${f.published ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"} text-white`}>
              {f.published ? "Unpublish" : "🚀 Publish"}
            </button>
            <button onClick={async () => { if (confirm("Delete this feature?")) { await post({ action: "delete_feature", featureId: f.id }); loadTab(); } }}
              className="text-xs text-red-400 hover:text-red-300 px-2">×</button>
          </div>
        </div>
      ))}
      {data.length === 0 && <p className="text-gray-600 text-center py-8">No features yet. Click &quot;Seed Default Features&quot; to add pre-configured ones.</p>}
    </div>
  );
}

function TicketsTab({ data, post, setMsg, loadTab }: any) {
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const statusColors: Record<string, string> = { OPEN: "bg-blue-500/20 text-blue-400", IN_PROGRESS: "bg-amber-500/20 text-amber-400", RESOLVED: "bg-emerald-500/20 text-emerald-400", CLOSED: "bg-gray-500/20 text-gray-400" };
  const prioColors: Record<string, string> = { LOW: "text-gray-400", NORMAL: "text-blue-400", HIGH: "text-amber-400", URGENT: "text-red-400" };

  const getThread = (t: any) => {
    let thread: any[] = [];
    try { if (t.adminNote) thread = JSON.parse(t.adminNote); } catch {}
    if (thread.length === 0) {
      thread.push({ from: "principal", text: t.message, at: t.createdAt });
      if (t.adminReply) thread.push({ from: "admin", text: t.adminReply, at: t.updatedAt || t.createdAt });
    }
    return thread;
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">{data.length} tickets</p>
      {data.map((t: any) => {
        const thread = getThread(t);
        const isOpen = expanded === t.id;
        const lastMsg = thread[thread.length - 1];
        const needsReply = lastMsg?.from === "principal";
        return (
          <div key={t.id} className={`rounded-xl border overflow-hidden ${needsReply ? "bg-blue-900/20 border-blue-700" : "bg-gray-800/50 border-gray-700"}`}>
            <button onClick={() => setExpanded(isOpen ? null : t.id)} className="w-full text-left px-4 py-3 flex items-start justify-between hover:bg-gray-700/20">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold">{t.subject}</h4>
                  {needsReply && <span className="text-[8px] bg-red-500 text-white px-1.5 py-0.5 rounded-full animate-pulse">NEEDS REPLY</span>}
                </div>
                <p className="text-[10px] text-gray-500">From: {t.userName} ({t.userRole}) {t.school?.name ? `| ${t.school.name}` : ""} | {thread.length} messages</p>
                <p className="text-[10px] text-gray-400 mt-0.5 truncate">{lastMsg.from === "admin" ? "You: " : `${t.userName}: `}{lastMsg.text}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${prioColors[t.priority]}`}>{t.priority}</span>
                <span className={`text-[9px] px-2 py-0.5 rounded-full ${statusColors[t.status]}`}>{t.status}</span>
                <span className="text-gray-500">{isOpen ? "▼" : "▶"}</span>
              </div>
            </button>
            {isOpen && (
              <div className="border-t border-gray-700/50">
                <div className="p-4 space-y-2 max-h-60 overflow-y-auto bg-gray-900/30">
                  {thread.map((msg: any, i: number) => (
                    <div key={i} className={`flex ${msg.from === "admin" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-xl px-3 py-2 text-xs ${msg.from === "admin" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-200"}`}>
                        <p className={`text-[8px] font-bold mb-0.5 ${msg.from === "admin" ? "text-blue-200" : "text-gray-400"}`}>
                          {msg.from === "admin" ? "You (Admin)" : t.userName}
                        </p>
                        <p>{msg.text}</p>
                        <p className={`text-[7px] mt-0.5 ${msg.from === "admin" ? "text-blue-300" : "text-gray-500"}`}>{new Date(msg.at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {t.status !== "CLOSED" && (
                  <div className="flex gap-2 p-3 border-t border-gray-700/50">
                    <input className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg text-xs border border-gray-600" placeholder="Reply..."
                      value={replyText[t.id] || ""} onChange={(e: any) => setReplyText((p: any) => ({ ...p, [t.id]: e.target.value }))}
                      onKeyDown={(e: any) => { if (e.key === "Enter" && replyText[t.id]?.trim()) { post({ action: "reply_ticket", ticketId: t.id, reply: replyText[t.id], close: false }).then(() => { setReplyText((p: any) => ({ ...p, [t.id]: "" })); setMsg("Replied"); loadTab(); }); } }} />
                    <button onClick={async () => { if (!replyText[t.id]?.trim()) return; await post({ action: "reply_ticket", ticketId: t.id, reply: replyText[t.id], close: false }); setReplyText((p: any) => ({ ...p, [t.id]: "" })); setMsg("Replied"); loadTab(); }}
                      className="text-xs bg-blue-600 text-white px-3 rounded-lg">Reply</button>
                    <button onClick={async () => { await post({ action: "reply_ticket", ticketId: t.id, reply: replyText[t.id] || "Resolved.", close: true }); setReplyText((p: any) => ({ ...p, [t.id]: "" })); setMsg("Resolved"); loadTab(); }}
                      className="text-xs bg-emerald-600 text-white px-3 rounded-lg">Resolve</button>
                    <button onClick={async () => { await post({ action: "close_ticket", ticketId: t.id }); loadTab(); }}
                      className="text-xs text-gray-400 hover:text-gray-300">Close</button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      {data.length === 0 && <p className="text-gray-600 text-center py-12">No support tickets</p>}
    </div>
  );
}
function InboxTab({ data, post, setMsg, loadTab }: any) {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [chatMsgs, setChatMsgs] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const conversations = data?.conversations || [];
  const adminUserId = data?.adminUserId;

  const openChat = async (conv: any) => {
    setActiveChat(conv.partnerId);
    setChatMsgs(conv.messages.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    if (conv.unread > 0) {
      await post({ action: "admin_mark_read", partnerId: conv.partnerId });
      loadTab();
    }
  };

  const sendReply = async () => {
    if (!reply.trim() || !activeChat) return;
    setSending(true);
    await post({ action: "admin_reply", receiverId: activeChat, content: reply });
    setReply("");
    setSending(false);
    loadTab();
  };

  if (activeChat) {
    const conv = conversations.find((c: any) => c.partnerId === activeChat);
    return (
      <div className="flex flex-col h-[70vh]">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-700 mb-3">
          <button onClick={() => setActiveChat(null)} className="text-xs text-gray-400 hover:text-white">← Back</button>
          <h3 className="text-sm font-bold">{conv?.partner?.name || "Unknown"}</h3>
          <span className="text-[9px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">{conv?.partner?.role}</span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {chatMsgs.map((m: any) => (
            <div key={m.id} className={`flex ${m.senderId === adminUserId ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] px-3 py-2 rounded-xl text-xs ${m.senderId === adminUserId ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-200"}`}>
                {m.subject && <p className="text-[9px] font-bold opacity-70 mb-0.5">{m.subject}</p>}
                <p>{m.content}</p>
                <p className={`text-[8px] mt-1 ${m.senderId === adminUserId ? "text-blue-200" : "text-gray-500"}`}>{new Date(m.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-700">
          <input className="flex-1 bg-gray-700 text-white px-3 py-2.5 rounded-lg text-xs border border-gray-600" placeholder="Type reply..."
            value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendReply()} />
          <button onClick={sendReply} disabled={sending || !reply.trim()} className="px-4 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50">
            {sending ? "..." : "Send"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 mb-3">{conversations.length} conversations</p>
      {conversations.map((c: any) => (
        <button key={c.partnerId} onClick={() => openChat(c)}
          className={`w-full text-left bg-gray-800/50 rounded-xl p-4 border hover:bg-gray-800 transition ${c.unread > 0 ? "border-blue-500" : "border-gray-700"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">{c.partner?.name?.[0] || "?"}</div>
              <div>
                <p className="text-xs font-bold">{c.partner?.name || "Unknown"}</p>
                <p className="text-[10px] text-gray-500">{c.partner?.role}</p>
              </div>
            </div>
            <div className="text-right">
              {c.unread > 0 && <span className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full animate-pulse">{c.unread} new</span>}
              <p className="text-[9px] text-gray-600 mt-0.5">{new Date(c.lastMessage.createdAt).toLocaleString()}</p>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5 truncate">{c.lastMessage.subject ? `${c.lastMessage.subject}: ` : ""}{c.lastMessage.content}</p>
        </button>
      ))}
      {conversations.length === 0 && <p className="text-gray-600 text-center py-12">No messages yet. Send a broadcast first!</p>}
    </div>
  );
}

function LogsTab({ data, api, post, setData, setMsg }: any) {
  const [levelFilter, setLevelFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  const filter = async () => {
    const params: Record<string, string> = {};
    if (levelFilter) params.level = levelFilter;
    if (sourceFilter) params.source = sourceFilter;
    setData(await api("logs", params));
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center flex-wrap">
        {["", "INFO", "WARN", "ERROR", "CRITICAL"].map(l => (
          <button key={l} onClick={() => { setLevelFilter(l); }} className={`text-[10px] px-2.5 py-1 rounded-lg ${levelFilter === l ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400"}`}>{l || "All"}</button>
        ))}
        <span className="text-gray-600">|</span>
        {["", "auth", "classroom", "payment", "admin", "support", "system"].map(s => (
          <button key={s} onClick={() => { setSourceFilter(s); }} className={`text-[10px] px-2.5 py-1 rounded-lg ${sourceFilter === s ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400"}`}>{s || "All"}</button>
        ))}
        <button onClick={filter} className="text-xs bg-gray-700 text-white px-3 py-1 rounded-lg">Apply</button>
        <button onClick={async () => { if (confirm("Clear logs older than 30 days?")) { const r = await post({ action: "clear_logs", days: 30 }); setMsg(`Cleared ${r.deleted} logs`); } }}
          className="text-xs text-red-400 hover:text-red-300 ml-auto">🗑 Clear Old Logs</button>
      </div>
      <div className="bg-gray-900 rounded-xl border border-gray-800 max-h-[65vh] overflow-y-auto font-mono text-[11px]">
        {data.map((l: any) => (
          <div key={l.id} className="px-3 py-1.5 border-b border-gray-800/50 flex items-start gap-2 hover:bg-gray-800/30">
            <span className="text-[9px] text-gray-600 whitespace-nowrap">{new Date(l.createdAt).toLocaleTimeString()}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded w-14 text-center ${l.level === "CRITICAL" ? "bg-red-600 text-white" : l.level === "ERROR" ? "bg-red-500/20 text-red-400" : l.level === "WARN" ? "bg-amber-500/20 text-amber-400" : "bg-gray-700 text-gray-400"}`}>{l.level}</span>
            <span className="text-blue-400 w-20">[{l.source}]</span>
            <span className="text-gray-300 flex-1">{l.message}</span>
            {l.userId && <span className="text-gray-600 text-[9px]">{l.userId.slice(0, 6)}</span>}
          </div>
        ))}
        {data.length === 0 && <p className="text-gray-600 text-center py-8">No logs</p>}
      </div>
    </div>
  );
}

function BroadcastTab({ post, setMsg }: any) {
  const [target, setTarget] = useState("all");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!title.trim() || !message.trim()) { setMsg("Fill in title and message"); return; }
    if (!confirm(`Send broadcast to ALL ${target} users?`)) return;
    setSending(true);
    const r = await post({ action: "broadcast", target, title, message });
    setMsg(`Broadcast sent to ${r.sent} users`);
    setTitle(""); setMessage("");
    setSending(false);
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700 space-y-4">
        <h3 className="text-sm font-bold">📢 Send Broadcast Notification</h3>
        <p className="text-xs text-gray-500">This sends a notification to every user in the selected group. Use sparingly.</p>
        <div>
          <label className="text-xs text-gray-400">Target Audience</label>
          <div className="flex gap-2 mt-1">
            {["all", "principals", "teachers", "students", "parents"].map(t => (
              <button key={t} onClick={() => setTarget(t)} className={`text-xs px-3 py-1.5 rounded-lg capitalize ${target === t ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-400"}`}>{t}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400">Title</label>
          <input className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg text-xs border border-gray-600 mt-1" placeholder="Announcement title..." value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-gray-400">Message</label>
          <textarea className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg text-xs border border-gray-600 mt-1" rows={4} placeholder="Message content..." value={message} onChange={e => setMessage(e.target.value)} />
        </div>
        <button onClick={send} disabled={sending} className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50">
          {sending ? "Sending..." : `📢 Send to All ${target}`}
        </button>
      </div>
    </div>
  );
}

function HealthTab({ data }: any) {
  return (
    <div className="space-y-4">
      {Object.entries(data).map(([key, val]: [string, any]) => (
        <div key={key} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">{key}</h4>
          {typeof val === "object" && val !== null ? (
            <div className="space-y-1">
              {Object.entries(val).map(([k, v]: [string, any]) => (
                <div key={k} className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{k}</span>
                  <span className={`font-mono ${v === "OK" || v === "SET" ? "text-emerald-400" : v === "ERROR" || v === "MISSING" ? "text-red-400" : "text-gray-300"}`}>
                    {typeof v === "number" ? v.toLocaleString() : String(v)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-300 font-mono">{typeof val === "number" ? val.toLocaleString() : String(val)}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function ConfigTab({ data }: any) {
  return (
    <div className="space-y-4">
      <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
        <h3 className="text-sm font-bold mb-3">⚙️ Environment Variables</h3>
        <div className="space-y-2">
          {Object.entries(data).map(([k, v]: [string, any]) => (
            <div key={k} className="flex items-center justify-between py-2 border-b border-gray-700/50 last:border-0">
              <span className="text-xs font-mono text-blue-400">{k}</span>
              <span className={`text-xs font-mono ${String(v).includes("NOT SET") || String(v).includes("MISSING") ? "text-red-400" : "text-emerald-400"}`}>{String(v)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
        <h3 className="text-sm font-bold mb-3">🔗 Quick Links</h3>
        <div className="space-y-1">
          {[
            ["Production Site", "https://www.gdaschools.sbs"],
            ["GitHub", "https://github.com/stichandlilo03-design/gda-school.git"],
            ["Vercel Dashboard", "https://vercel.com"],
            ["Admin API", "/api/gda-admin?action=health&key=YOUR_KEY"],
          ].map(([label, url]) => (
            <div key={label} className="flex items-center justify-between py-1.5">
              <span className="text-xs text-gray-400">{label}</span>
              <span className="text-xs font-mono text-blue-400">{url}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DatabaseTab({ data }: any) {
  const entries = Object.entries(data).sort((a: any, b: any) => b[1] - a[1]);
  const total = entries.reduce((s: number, [, v]: any) => s + (v > 0 ? v : 0), 0);

  return (
    <div className="space-y-4">
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <h3 className="text-sm font-bold mb-1">Total Records: {total.toLocaleString()}</h3>
        <p className="text-[10px] text-gray-500">{entries.length} tables</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {entries.map(([model, count]: any) => (
          <div key={model} className={`rounded-lg p-3 border ${count < 0 ? "bg-red-900/20 border-red-800" : count === 0 ? "bg-gray-800/30 border-gray-700" : "bg-gray-800/50 border-gray-700"}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">{model}</span>
              <span className={`text-sm font-bold font-mono ${count < 0 ? "text-red-400" : count === 0 ? "text-gray-600" : "text-blue-400"}`}>
                {count < 0 ? "ERR" : count.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FrameworkTab() {
  const [openSection, setOpenSection] = useState<string | null>("architecture");
  const toggle = (s: string) => setOpenSection(openSection === s ? null : s);

  const Section = ({ id, title, icon, children }: { id: string; title: string; icon: string; children: React.ReactNode }) => (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
      <button onClick={() => toggle(id)} className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-700/30">
        <span className="text-sm font-bold">{icon} {title}</span>
        <span className="text-gray-500">{openSection === id ? "▼" : "▶"}</span>
      </button>
      {openSection === id && <div className="px-4 pb-4 text-xs text-gray-300 space-y-3 border-t border-gray-700/50 pt-3">{children}</div>}
    </div>
  );

  const Code = ({ children }: { children: string }) => (
    <pre className="bg-gray-900 rounded-lg p-3 overflow-x-auto text-[11px] font-mono text-green-400 border border-gray-700">{children}</pre>
  );

  const Row = ({ label, value, color = "text-blue-400" }: { label: string; value: string; color?: string }) => (
    <div className="flex items-start gap-2 py-1 border-b border-gray-700/30 last:border-0">
      <span className="text-gray-500 w-40 flex-shrink-0">{label}</span>
      <span className={`font-mono text-[11px] ${color}`}>{value}</span>
    </div>
  );

  return (
    <div className="space-y-3 max-w-4xl">
      <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-700">
        <h3 className="text-sm font-bold text-blue-400 mb-1">🗺️ GDA Schools — Complete System Framework</h3>
        <p className="text-[10px] text-blue-300">Every route, API, connection, and flow documented. Click any section to expand.</p>
      </div>

      <Section id="architecture" title="System Architecture" icon="🏗️">
        <Code>{`GDA SCHOOLS ARCHITECTURE
========================
Next.js 14 (App Router) + Prisma + PostgreSQL + NextAuth

┌──────────────────────────────────────────────────┐
│  FRONTEND (React Server Components + Client)     │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │
│  │Student │ │Teacher │ │Princpl │ │Parent  │    │
│  │Portal  │ │Portal  │ │Portal  │ │Portal  │    │
│  └────┬───┘ └────┬───┘ └────┬───┘ └────┬───┘    │
│       └──────────┴──────────┴──────────┘         │
│                      │                            │
│  ┌───────────────────┴───────────────────┐       │
│  │  Server Actions (/lib/actions/*.ts)   │       │
│  │  19 action files, ~100 functions      │       │
│  └───────────────────┬───────────────────┘       │
│                      │                            │
│  ┌───────────────────┴───────────────────┐       │
│  │  API Routes (/api/*)                  │       │
│  │  11 endpoints                         │       │
│  └───────────────────┬───────────────────┘       │
├──────────────────────┼───────────────────────────┤
│  ┌───────────────────┴───────────────────┐       │
│  │  Prisma ORM + PostgreSQL              │       │
│  │  55 models, 46 tables                 │       │
│  └───────────────────────────────────────┘       │
│                                                   │
│  ┌─────────────────┐  ┌──────────────────┐       │
│  │ Auto-Session    │  │ Nerve Center     │       │
│  │ (CRON endpoint) │  │ (Super Admin)    │       │
│  └─────────────────┘  └──────────────────┘       │
└──────────────────────────────────────────────────┘`}</Code>
      </Section>

      <Section id="portals" title="4 Portals — All Pages" icon="🖥️">
        <p className="font-bold text-white mb-2">STUDENT PORTAL (15 pages)</p>
        <Row label="/student" value="Dashboard — today's classes, schedule, term info, classmates" />
        <Row label="/student/classroom" value="Live classroom — join sessions, blackboard, chat, polls, exams" />
        <Row label="/student/subjects" value="Enrolled subjects list" />
        <Row label="/student/teachers" value="Browse & enroll in teacher classes" />
        <Row label="/student/messages" value="Chat with teachers, principal, GDA Admin" />
        <Row label="/student/timetable" value="Personal weekly schedule with session badges" />
        <Row label="/student/grades" value="View approved grades and report cards" />
        <Row label="/student/attendance" value="Attendance record per class" />
        <Row label="/student/materials" value="Teacher-uploaded materials" />
        <Row label="/student/fees" value="Fee breakdown + payment upload" />
        <Row label="/student/profile" value="Photo, ID card, public profile" />
        <Row label="/student/calendar" value="Academic calendar" />
        <Row label="/student/certificates" value="Awarded certificates" />
        <Row label="/student/schedule" value="Today's to-do and reminders" />
        <Row label="/student/help" value="Help & FAQ" />
        <p className="font-bold text-white mb-2 mt-4">TEACHER PORTAL (15 pages)</p>
        <Row label="/teacher" value="Dashboard — salary balance, today's classes, stats" />
        <Row label="/teacher/classroom" value="Start sessions, prep mode, board, polls, exams" />
        <Row label="/teacher/classes" value="Assigned classes, requirements, equipment" />
        <Row label="/teacher/students" value="Enrolled students, manage enrollment" />
        <Row label="/teacher/messages" value="Chat with students, principal, parents, GDA Admin" />
        <Row label="/teacher/gradebook" value="Create assessments, enter grades" />
        <Row label="/teacher/attendance" value="Mark attendance per session" />
        <Row label="/teacher/materials" value="Upload teaching materials" />
        <Row label="/teacher/timetable" value="Personal teaching schedule" />
        <Row label="/teacher/payroll" value="Earnings, session credits, payment history" />
        <Row label="/teacher/vacancies" value="Browse/apply for jobs" />
        <Row label="/teacher/profile" value="Bio, photo, public profile, ID card" />
        <Row label="/teacher/calendar" value="Academic calendar" />
        <Row label="/teacher/schedule" value="Today's teaching plan" />
        <Row label="/teacher/help" value="Help & FAQ" />
        <p className="font-bold text-white mb-2 mt-4">PRINCIPAL PORTAL (17 pages)</p>
        <Row label="/principal" value="Dashboard — school stats, revenue, quick actions" />
        <Row label="/principal/monitor" value="Live classroom monitor — all active sessions" />
        <Row label="/principal/teachers" value="Manage teachers, ratings, assign classes" />
        <Row label="/principal/students" value="Approve enrollments, promote, manage grades" />
        <Row label="/principal/messages" value="Chat with all users + GDA Admin" />
        <Row label="/principal/interviews" value="Schedule teacher interviews" />
        <Row label="/principal/vacancies" value="Create job postings" />
        <Row label="/principal/payroll" value="Teacher payroll, session credits, payment" />
        <Row label="/principal/fees" value="Fee structures per grade" />
        <Row label="/principal/bank-accounts" value="School payment accounts" />
        <Row label="/principal/payments" value="Review student/parent payment proof" />
        <Row label="/principal/curriculum" value="Subjects, grades, teacher assignment" />
        <Row label="/principal/timetable" value="Weekly timetable editor per grade" />
        <Row label="/principal/calendar" value="Academic calendar auto-generation" />
        <Row label="/principal/grading" value="Grade approval + term report generation" />
        <Row label="/principal/settings" value="School config — timing, fees, timezone" />
        <Row label="/principal/support" value="Submit support tickets to GDA Admin" />
        <Row label="/principal/help" value="Help & FAQ" />
        <p className="font-bold text-white mb-2 mt-4">PARENT PORTAL (10 pages)</p>
        <Row label="/parent" value="Dashboard — all children overview" />
        <Row label="/parent/children" value="Child details, linking" />
        <Row label="/parent/attendance" value="Children's attendance records" />
        <Row label="/parent/grades" value="Verified grades, report cards" />
        <Row label="/parent/fees" value="Fee payment for children" />
        <Row label="/parent/timetable" value="Children's timetables" />
        <Row label="/parent/teachers" value="Children's teachers" />
        <Row label="/parent/messages" value="Chat with teachers & principal" />
        <Row label="/parent/calendar" value="Academic calendar" />
        <Row label="/parent/help" value="Help & FAQ" />
      </Section>

      <Section id="apis" title="API Routes (11 endpoints)" icon="🔌">
        <Row label="GET/POST /api/auth/[...nextauth]" value="NextAuth — login, register, session management" />
        <Row label="GET /api/auto-session" value="CRON — auto-start/end sessions, prep timeout, school close, orphan cleanup, teacher credits" color="text-red-400" />
        <Row label="GET/POST /api/classroom/[sessionId]" value="Live classroom polling — board, chat, polls, hands, reactions, whispers, exams, prep hide" color="text-red-400" />
        <Row label="GET/POST /api/enrollments" value="Student enrollment requests" />
        <Row label="GET/POST /api/gda-admin" value="Super Admin — 30+ actions (stats, schools, users, features, tickets, broadcast, inbox, health)" color="text-amber-400" />
        <Row label="GET /api/maintenance" value="Maintenance mode check (used by MaintenanceGuard)" />
        <Row label="GET /api/notifications" value="Notification list for current user" />
        <Row label="GET /api/notifications/previews" value="Notification previews for bell popup" />
        <Row label="GET/POST /api/support" value="Principal support ticket submission" />
        <Row label="GET /api/unread-count" value="Unread message count for notification bell" />
        <Row label="GET /api/vacancies" value="Public job board data" />
      </Section>

      <Section id="actions" title="Server Actions (19 files, ~100 functions)" icon="⚡">
        <Row label="auth.ts" value="register, login flows" />
        <Row label="classroom.ts" value="startLiveClass, endLiveClass, convertPrepToLive, joinSession, boardWrite, raiseHand, sendChat" color="text-red-400" />
        <Row label="messages.ts" value="sendMessage, getMessagesWith, getConversations, markAllRead, getUnreadCount" />
        <Row label="enrollment.ts" value="requestEnrollment, approveEnrollment, bulkEnroll, smartEnroll" />
        <Row label="grading.ts" value="createAssessment, submitScores, approveGrades, generateTermReport, saveExamToGradebook" />
        <Row label="payroll.ts" value="processPayroll, uploadPaymentProof, getSessionCredits" color="text-red-400" />
        <Row label="fee-payment.ts" value="submitPayment, approvePayment, getPaymentHistory" />
        <Row label="timetable.ts" value="addPeriod, removePeriod, autoGenerate, getTeacherTimetable" />
        <Row label="school.ts" value="updateSchoolSettings, updateFeePolicy, updateTimezone" />
        <Row label="student-management.ts" value="approveStudent, promoteStudent, moveStudent, removeStudent" />
        <Row label="teacher.ts" value="assignClass, rateTeacher, approveTeacher" />
        <Row label="teacher-profile.ts" value="updateProfile, uploadPhoto, generateIdCard" />
        <Row label="profile.ts" value="updateStudentProfile, uploadStudentPhoto" />
        <Row label="vacancy.ts" value="createVacancy, applyToVacancy, approveApplication" />
        <Row label="interview.ts" value="scheduleInterview, updateInterviewStatus" />
        <Row label="materials.ts" value="uploadMaterial, editMaterial, deleteMaterial" />
        <Row label="bank-account.ts" value="addBankAccount, updateBankAccount" />
        <Row label="parent.ts" value="linkChild, unlinkChild, payChildFee" />
        <Row label="class-requirements.ts" value="addRequirement, addEquipment" />
      </Section>

      <Section id="session-flow" title="SESSION & PAYMENT FLOW (Critical Path)" icon="💰">
        <p className="text-amber-400 font-bold">This is the money flow. Every step must work perfectly.</p>
        <Code>{`SESSION LIFECYCLE
=================

1. TIMETABLE → AUTO-START
   Principal sets timetable (ClassSchedule records)
   → /api/auto-session (CRON, every 1-2 min)
   → Checks school timezone + local time
   → If slot startTime matches: creates LiveClassSession
   → Status: IN_PROGRESS, autoStarted: true

2. TEACHER MANUAL START
   Teacher clicks "Start" on classroom page
   → classroom.ts → startLiveClass(classId, topic)
   → Creates LiveClassSession: IN_PROGRESS
   → Records teacherJoinedAt + calculates lateMinutes

3. PREP SESSION (No payment)
   Teacher clicks "Prep" with duration (5-60 min)
   → startLiveClass(classId, topic, isPrep=true, prepDurationMin)
   → Creates LiveClassSession: isPrep=true
   → /api/auto-session ends prep when timer expires
   → NEVER auto-converts to live (just ends)
   → Teacher can click "Go Live" → convertPrepToLive()
     → Same session, isPrep=false, startedAt=now

4. DURING SESSION
   /api/classroom/[sessionId] polls every 3-5 sec
   → Returns: boardContent, chatMessages, polls, questions
   → Teacher writes → boardWrite action → DB update
   → Students see updates on next poll

5. SESSION END (3 ways)
   a) Teacher clicks "End Session"
      → endLiveClass(sessionId)
   b) /api/auto-session: past timetable endTime
   c) /api/auto-session: past school close time
   d) /api/auto-session: orphan (1.5x duration limit)
   → All paths: status="ENDED", endedAt=now, durationMin calculated

6. CREDIT CALCULATION (auto, inside auto-session)
   → creditTeacher(session, schoolId, durationMin)
   → SKIPS if: session.isPrep || session.creditAwarded || durationMin < 1
   → Gets TeacherSalary: baseSalary, sessionsPerDay, workingDays
   → credit = (baseSalary / totalSessions) × (minutes / sessionLimit)
   → Creates SessionCredit record
   → Sets creditAwarded=true on session

7. PAYROLL AGGREGATION (auto)
   → Upserts PayrollRecord for teacher+month+year
   → Adds credit to grossPay
   → Calculates: taxDeduction, pensionDeduction
   → netPay = grossPay - deductions
   → Status: DRAFT (until principal processes)

8. PRINCIPAL PAYS TEACHER
   → /principal/payroll → sees earnings
   → Uploads payment proof
   → PayrollRecord status → PAID`}</Code>
        <p className="mt-2 text-amber-300 font-bold">KEY FILES:</p>
        <Row label="Session start/end" value="src/lib/actions/classroom.ts" color="text-amber-400" />
        <Row label="Auto-session CRON" value="src/app/api/auto-session/route.ts" color="text-amber-400" />
        <Row label="Live classroom API" value="src/app/api/classroom/[sessionId]/route.ts" color="text-amber-400" />
        <Row label="Credit calculation" value="creditTeacher() in auto-session/route.ts" color="text-amber-400" />
        <Row label="Payroll display" value="src/app/(dashboard)/principal/payroll/page.tsx" color="text-amber-400" />
        <Row label="Teacher payroll view" value="src/app/(dashboard)/teacher/payroll/page.tsx" color="text-amber-400" />
      </Section>

      <Section id="grading-flow" title="GRADING & ANTI-CHEAT FLOW" icon="📝">
        <Code>{`GRADE FLOW (Anti-Cheat Pipeline)
================================

1. TEACHER creates exam in live classroom
   → Visual classroom → poll panel → exam mode
   → Questions with timers, correct answers
   → Student answers LOCKED once selected

2. TEACHER saves to gradebook
   → saveExamToGradebook() in classroom.ts
   → Creates Assessment record (type: END_OF_TERM_EXAM / MID_TERM_TEST)
   → Creates Score records per student
   → Assessment status: SUBMITTED

3. PRINCIPAL reviews
   → /principal/grading → Pending tab
   → Reviews scores → Approve or Reject
   → Assessment status: APPROVED / REJECTED

4. STUDENTS & PARENTS see grades
   → Only APPROVED grades visible
   → /student/grades, /parent/grades

5. TERM REPORTS
   → Principal → Generate Term Reports
   → Auto-calculates: CA (40%) + Exam (60%)
   → Includes attendance, assignments
   → Principal signs → TermReport record`}</Code>
      </Section>

      <Section id="feature-flags" title="Feature Flag System" icon="🚀">
        <Code>{`FEATURE FLAG FLOW
=================

1. ADMIN creates feature in Nerve Center
   → FeatureFlag record: published=false (DRAFT)

2. ADMIN clicks "Publish"
   → published=true

3. APP checks feature
   → import { isFeatureEnabled } from "@/lib/features"
   → if (await isFeatureEnabled("subscription_plans")) { ... }

4. ADMIN clicks "Unpublish"
   → Feature disappears everywhere instantly

PRE-BUILT FLAGS (seed with one click):
- subscription_plans    → Monthly/yearly billing tiers
- ai_tutoring          → AI student tutoring
- sms_notifications    → SMS alerts
- offline_mode         → Offline classroom
- mobile_app_download  → App store links
- marketplace          → Content marketplace
- advanced_analytics   → School analytics
- multi_campus         → Multi-branch management
- student_study_groups → Peer collaboration
- parent_payment_gateway → Online payments
- video_recording      → Session recording
- custom_branding      → School branding`}</Code>
        <Row label="Feature utility" value="src/lib/features.ts → isFeatureEnabled(), getFeatureConfig()" />
        <Row label="Flag DB model" value="FeatureFlag: key, name, description, published, category, config" />
      </Section>

      <Section id="messaging" title="Messaging & Notification System" icon="💬">
        <Code>{`MESSAGE FLOW
============

User sends message → sendMessage() server action
→ Creates Message record (senderId, receiverId, content)
→ Recipient's NotificationBell polls /api/unread-count every 10s
→ Count increases → bell animates + plays sound
→ User opens Messages page → conversations auto-refresh every 8s
→ Opening a chat → getMessagesWith() loads + marks read
→ Active chat polls every 5s for new messages

ADMIN BROADCAST
→ Nerve Center → Broadcast tab
→ Creates GDA Admin user (admin@gdaschools.sbs, SUPER_ADMIN)
→ Sends Message to every user in target group
→ All users see "GDA Admin" in their conversations
→ Users can reply → Admin sees in Nerve Center Inbox tab
→ Admin Inbox polls every 10s + plays alert sound`}</Code>
      </Section>

      <Section id="countries" title="14-Country Education System" icon="🌍">
        <Code>{`SUPPORTED COUNTRIES & GRADE STRUCTURES
======================================
Nigeria:     6-3-3-4 (Primary 1-6, JSS 1-3, SSS 1-3)
Kenya:       2-6-3-3 CBC (PP1-PP2, Grade 1-6, JSS 1-3, SSS 1-3)
Ghana:       6-3-4 (Primary 1-6, JHS 1-3, SHS 1-4)
South Africa: Foundation-Senior (Grade R-12)
Tanzania:    7-4-2-3 (Std 1-7, Form 1-4, Form 5-6)
Uganda:      7-4-2 (P1-P7, S1-S4, S5-S6)
Cameroon:    6-5 (Class 1-6, Form 1-5)
UK:          Key Stages (Reception-Year 13)
USA:         K-12 (Kindergarten-Grade 12)
Canada:      K-12 (Same as USA)
India:       10+2 (Class 1-12)
Australia:   Foundation-Year 12
Pakistan:    5-3-2-2 (Class 1-12)
Egypt:       6-3-3 (Primary-Preparatory-Secondary)

Config file: src/lib/education-systems.ts
Calendar:    src/lib/academic-calendar.ts
Payments:    src/lib/country-payments.ts`}</Code>
      </Section>

      <Section id="files" title="Key Files Quick Reference" icon="📁">
        <p className="font-bold text-white mb-2">CRITICAL FILES (touch with care)</p>
        <Row label="prisma/schema.prisma" value="55 models — THE source of truth for all data" color="text-red-400" />
        <Row label="src/lib/auth.ts" value="NextAuth config — login, session, callbacks" color="text-red-400" />
        <Row label="src/lib/db.ts" value="Prisma client singleton" color="text-red-400" />
        <Row label="src/middleware.ts" value="Route protection — role-based access" color="text-red-400" />
        <Row label="src/app/api/auto-session/route.ts" value="CRON — sessions, credits, payroll" color="text-red-400" />
        <Row label="src/app/api/classroom/[sessionId]/route.ts" value="Live classroom polling + actions" color="text-red-400" />
        <Row label="src/lib/actions/classroom.ts" value="Session start/end/prep/convert" color="text-red-400" />
        <p className="font-bold text-white mb-2 mt-3">COMPONENTS</p>
        <Row label="visual-classroom.tsx" value="1173 lines — THE live classroom UI (board, chat, polls, exams, video)" />
        <Row label="messages-inbox.tsx" value="290 lines — Chat UI used by all 4 portals" />
        <Row label="class-alarm.tsx" value="233 lines — Student class reminder alarms" />
        <Row label="notification-bell.tsx" value="62 lines — Unread message counter + sound" />
        <Row label="maintenance-guard.tsx" value="33 lines — Blocks site when maintenance mode on" />
        <Row label="dashboard-sidebar.tsx" value="111 lines — Sidebar nav for all portals" />
        <p className="font-bold text-white mb-2 mt-3">CONFIG</p>
        <Row label=".env" value="DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, GDA_ADMIN_KEY" />
        <Row label="next.config.js" value="Next.js config" />
        <Row label="tailwind.config.ts" value="Tailwind + brand colors" />
        <Row label="vercel.json" value="CRON job: /api/auto-session every 2 min" />
      </Section>

      <Section id="deployment" title="Deployment & Operations" icon="🚀">
        <Code>{`DEPLOY COMMANDS
===============
git add . && git commit -m "message" && git push
→ Vercel auto-deploys from GitHub

DATABASE MIGRATION (after schema changes)
npx prisma db push

ENVIRONMENT VARIABLES (Vercel Dashboard)
- DATABASE_URL     → PostgreSQL connection string
- NEXTAUTH_SECRET  → Random secret for session encryption
- NEXTAUTH_URL     → https://www.gdaschools.sbs
- GDA_ADMIN_KEY    → Super admin panel password

CRON JOB (vercel.json)
{
  "crons": [{ "path": "/api/auto-session", "schedule": "*/2 * * * *" }]
}
→ Runs every 2 minutes
→ Handles: session auto-start, auto-end, prep timeout,
   school close, orphan cleanup, credit calculation

ADMIN PANEL ACCESS
URL: /gda-nerve-center-x7k9
Auth: GDA_ADMIN_KEY password`}</Code>
      </Section>
    </div>
  );
}
