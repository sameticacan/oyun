"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Competitor = { id: string; name: string };
type Profile = { id: string; name: string; checkIn: string; nights: number; adults: number; children: number; boardPreference: string; currency: string; competitors: Array<{ competitor: Competitor }>; _count: { observations: number } };
const tomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); };
const empty = { name: "", checkIn: tomorrow(), nights: 1, adults: 2, children: 0, boardPreference: "breakfast_included", currency: "TRY", competitorIds: [] as string[] };

export function ProfileManager({ profiles, competitors }: { profiles: Profile[]; competitors: Competitor[] }) {
  const router = useRouter(); const [form, setForm] = useState(empty); const [editing, setEditing] = useState<string | null>(null); const [error, setError] = useState("");
  const field = (name: keyof typeof form, value: string | number | string[]) => setForm((current) => ({ ...current, [name]: value }));
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(""); const response = await fetch(editing ? `/api/profiles/${editing}` : "/api/profiles", { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); const body = await response.json();
    if (!response.ok) return setError(body.error ?? "Kayıt başarısız."); setEditing(null); setForm({ ...empty, checkIn: tomorrow() }); router.refresh();
  }
  function edit(item: Profile) { setEditing(item.id); setForm({ name: item.name, checkIn: item.checkIn.slice(0, 10), nights: item.nights, adults: item.adults, children: item.children, boardPreference: item.boardPreference, currency: item.currency, competitorIds: item.competitors.map((x) => x.competitor.id) }); scrollTo({ top: 0, behavior: "smooth" }); }
  async function remove(item: Profile) { if (!confirm(`${item.name} ve ilişkili fiyatlar silinsin mi?`)) return; await fetch(`/api/profiles/${item.id}`, { method: "DELETE" }); router.refresh(); }
  function toggle(id: string) { field("competitorIds", form.competitorIds.includes(id) ? form.competitorIds.filter((x) => x !== id) : [...form.competitorIds, id]); }

  return <div className="grid gap-5 xl:grid-cols-[390px_1fr]"><form onSubmit={submit} className="card h-fit p-5"><h2 className="mb-5 font-bold">{editing ? "Profili düzenle" : "Yeni arama profili"}</h2>
    <Field label="Profil adı"><input className="input" required value={form.name} onChange={(e) => field("name", e.target.value)} placeholder="Hafta içi · 2 kişi" /></Field>
    <div className="grid grid-cols-2 gap-3"><Field label="Giriş tarihi"><input type="date" className="input" required value={form.checkIn} onChange={(e) => field("checkIn", e.target.value)} /></Field><Field label="Gece"><input type="number" className="input" min="1" max="30" value={form.nights} onChange={(e) => field("nights", Number(e.target.value))} /></Field></div>
    <div className="grid grid-cols-2 gap-3"><Field label="Yetişkin"><input type="number" className="input" min="1" max="10" value={form.adults} onChange={(e) => field("adults", Number(e.target.value))} /></Field><Field label="Çocuk"><input type="number" className="input" min="0" max="10" value={form.children} onChange={(e) => field("children", Number(e.target.value))} /></Field></div>
    <div className="grid grid-cols-2 gap-3"><Field label="Pansiyon"><select className="input" value={form.boardPreference} onChange={(e) => field("boardPreference", e.target.value)}><option value="breakfast_included">Kahvaltı dahil</option><option value="room_only">Sadece oda</option></select></Field><Field label="Para birimi"><input className="input" maxLength={3} value={form.currency} onChange={(e) => field("currency", e.target.value.toUpperCase())} /></Field></div>
    <fieldset className="mb-5"><legend className="label">Bağlı rakipler</legend><div className="max-h-40 space-y-2 overflow-y-auto rounded-xl border border-black/10 p-3">{competitors.map((item) => <label key={item.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.competitorIds.includes(item.id)} onChange={() => toggle(item.id)} />{item.name}</label>)}{!competitors.length && <p className="text-xs text-black/45">Önce rakip ekleyin.</p>}</div></fieldset>
    {error && <p className="mb-3 text-sm text-red-600">{error}</p>}<div className="flex gap-2"><button className="btn-primary flex-1">{editing ? "Kaydet" : "Profil oluştur"}</button>{editing && <button type="button" className="btn-secondary" onClick={() => { setEditing(null); setForm({ ...empty, checkIn: tomorrow() }); }}>Vazgeç</button>}</div></form>
    <div className="space-y-3">{profiles.map((item) => <article className="card p-5" key={item.id}><div className="flex flex-col justify-between gap-4 sm:flex-row"><div><h3 className="font-bold">{item.name}</h3><p className="mt-1 text-sm text-black/50">{new Date(item.checkIn).toLocaleDateString("tr-TR")} · {item.nights} gece · {item.adults} yetişkin · {item.children} çocuk</p><div className="mt-3 flex flex-wrap gap-2"><span className="pill bg-teal-50 text-teal-700">{item.boardPreference === "breakfast_included" ? "Kahvaltı dahil" : "Sadece oda"}</span><span className="pill bg-black/5 text-black/55">{item.currency}</span><span className="pill bg-black/5 text-black/55">{item.competitors.length} rakip</span><span className="pill bg-black/5 text-black/55">{item._count.observations} gözlem</span></div></div><div className="flex gap-3 text-xs font-bold"><button onClick={() => edit(item)} className="text-teal-700">Düzenle</button><button onClick={() => remove(item)} className="text-red-500">Sil</button></div></div></article>)}{!profiles.length && <div className="card p-10 text-center text-sm text-black/45">Henüz arama profili yok.</div>}</div>
  </div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="mb-4 block"><span className="label">{label}</span>{children}</label>; }
