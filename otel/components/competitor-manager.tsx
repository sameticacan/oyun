"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type SelectorFields = { priceSelector: string; roomSelector: string; boardSelector: string; cancellationSelector: string; availabilitySelector: string };
type Competitor = { id: string; name: string; city: string; district: string; source: "manual" | "demo" | "ets_placeholder"; publicUrl: string | null; active: boolean; notes: string | null; priceSelector: string | null; roomSelector: string | null; boardSelector: string | null; cancellationSelector: string | null; availabilitySelector: string | null; _count: { profiles: number; observations: number } };
type CompetitorForm = Omit<Competitor, "id" | "_count" | "publicUrl" | "notes" | keyof SelectorFields> & { publicUrl: string; notes: string } & SelectorFields;
const empty: CompetitorForm = { name: "", city: "İzmir", district: "Karşıyaka", source: "demo", publicUrl: "", active: true, notes: "", priceSelector: "", roomSelector: "", boardSelector: "", cancellationSelector: "", availabilitySelector: "" };

export function CompetitorManager({ competitors }: { competitors: Competitor[] }) {
  const router = useRouter();
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const field = (name: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [name]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError("");
    const response = await fetch(editing ? `/api/competitors/${editing}` : "/api/competitors", { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const body = await response.json();
    if (!response.ok) return setError(body.error ?? "Kayıt başarısız.");
    setForm(empty); setEditing(null); router.refresh();
  }
  function edit(item: Competitor) { setEditing(item.id); setForm({ name: item.name, city: item.city, district: item.district, source: item.source, publicUrl: item.publicUrl ?? "", active: item.active, notes: item.notes ?? "", priceSelector: item.priceSelector ?? "", roomSelector: item.roomSelector ?? "", boardSelector: item.boardSelector ?? "", cancellationSelector: item.cancellationSelector ?? "", availabilitySelector: item.availabilitySelector ?? "" }); window.scrollTo({ top: 0, behavior: "smooth" }); }
  async function remove(item: Competitor) { if (!confirm(`${item.name} ve tüm gözlemleri silinsin mi?`)) return; await fetch(`/api/competitors/${item.id}`, { method: "DELETE" }); router.refresh(); }

  return <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
    <form onSubmit={submit} className="card h-fit p-5"><h2 className="mb-5 font-bold">{editing ? "Rakibi düzenle" : "Yeni rakip ekle"}</h2>
      <Field label="Otel adı"><input className="input" required minLength={2} value={form.name} onChange={(e) => field("name", e.target.value)} placeholder="Örn. Körfez Butik Otel" /></Field>
      <div className="grid grid-cols-2 gap-3"><Field label="Şehir"><input className="input" required value={form.city} onChange={(e) => field("city", e.target.value)} /></Field><Field label="İlçe"><input className="input" required value={form.district} onChange={(e) => field("district", e.target.value)} /></Field></div>
      <Field label="Kaynak"><select className="input" value={form.source} onChange={(e) => field("source", e.target.value)}><option value="demo">Demo</option><option value="manual">Manuel</option><option value="ets_placeholder">ETS placeholder</option></select></Field>
      <Field label="Public URL"><input className="input" type="url" value={form.publicUrl} onChange={(e) => field("publicUrl", e.target.value)} placeholder="https://…" /></Field>
      {form.source === "ets_placeholder" && <div className="mb-4 rounded-xl border border-teal-100 bg-teal-50/60 p-4">
        <p className="mb-4 text-xs leading-relaxed text-teal-900">Selector alanları yalnızca herkese açık sayfadaki görünür metni okumak için kullanılır. CAPTCHA, login veya erişim engeli aşılmaz.</p>
        <Field label="Fiyat CSS selector"><input className="input" value={form.priceSelector} onChange={(e) => field("priceSelector", e.target.value)} placeholder="Örn. .total-price" /></Field>
        <Field label="Oda adı CSS selector"><input className="input" value={form.roomSelector} onChange={(e) => field("roomSelector", e.target.value)} placeholder="Örn. .room-name" /></Field>
        <Field label="Pansiyon CSS selector"><input className="input" value={form.boardSelector} onChange={(e) => field("boardSelector", e.target.value)} placeholder="Örn. .board-type" /></Field>
        <Field label="İptal koşulu CSS selector"><input className="input" value={form.cancellationSelector} onChange={(e) => field("cancellationSelector", e.target.value)} placeholder="Örn. .cancellation" /></Field>
        <Field label="Müsaitlik CSS selector"><input className="input" value={form.availabilitySelector} onChange={(e) => field("availabilitySelector", e.target.value)} placeholder="Örn. .availability" /></Field>
      </div>}
      <Field label="Notlar"><textarea className="input min-h-20 resize-y" value={form.notes} onChange={(e) => field("notes", e.target.value)} /></Field>
      <label className="mb-5 flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => field("active", e.target.checked)} /> Aktif olarak takip et</label>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}<div className="flex gap-2"><button className="btn-primary flex-1">{editing ? "Değişiklikleri kaydet" : "Rakip ekle"}</button>{editing && <button type="button" className="btn-secondary" onClick={() => { setEditing(null); setForm(empty); }}>Vazgeç</button>}</div>
    </form>
    <div className="card overflow-hidden"><div className="hidden grid-cols-[1.4fr_.8fr_.7fr_.5fr_190px] gap-3 border-b border-black/5 bg-black/[0.02] px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-black/45 md:grid"><span>Otel</span><span>Konum</span><span>Kaynak</span><span>Durum</span><span>İşlemler</span></div>
      <div className="divide-y divide-black/5">{competitors.map((item) => <div key={item.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1.4fr_.8fr_.7fr_.5fr_190px] md:items-center"><div><p className="font-semibold">{item.name}</p><p className="mt-1 text-xs text-black/45">{item._count.profiles} profil · {item._count.observations} gözlem</p></div><p className="text-sm">{item.city} / {item.district}</p><span className="pill w-fit bg-teal-50 text-teal-700">{item.source}</span><span className={`pill w-fit ${item.active ? "bg-emerald-50 text-emerald-700" : "bg-black/5 text-black/50"}`}>{item.active ? "Aktif" : "Pasif"}</span><div className="flex flex-wrap gap-x-3 gap-y-2 text-xs font-bold">{item.publicUrl && <a href={item.publicUrl} target="_blank" rel="noreferrer" className="text-blue-600">Sayfayı aç</a>}<Link href={`/capture?competitorId=${item.id}`} className="text-teal-700">Fiyat Yakala</Link><button onClick={() => edit(item)} className="text-teal-700">Düzenle</button><button onClick={() => remove(item)} className="text-red-500">Sil</button></div></div>)}{!competitors.length && <p className="p-8 text-center text-sm text-black/45">Henüz rakip eklenmedi.</p>}</div>
    </div>
  </div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="mb-4 block"><span className="label">{label}</span>{children}</label>; }
