import Link from "next/link";
import { DashboardActions } from "@/components/dashboard-actions";
import { PageHeader } from "@/components/page-header";
import { PriceChart } from "@/components/price-chart";
import { getDashboardData } from "@/lib/dashboard";
import { formatDateTime, formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ profileId?: string }> }) {
  const { profileId } = await searchParams;
  const data = await getDashboardData(profileId);
  if (!data.profile) return <><PageHeader title="OdaRadar’a hoş geldiniz" description="Başlamak için bir arama profili oluşturun." /><Link className="btn-primary" href="/profiles">Arama profili ekle</Link></>;
  const currency = data.profile.currency;
  return <>
    <PageHeader eyebrow="Bugünün görünümü" title="Pazarın nabzı" description="Rakiplerin son fiyatlarını görün, kendi fiyatınızı kıyaslayın ve basit fiyat sinyallerini izleyin." action={<form className="flex gap-2"><select name="profileId" defaultValue={data.profile.id} className="input min-w-52">{data.profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><button className="btn-secondary">Uygula</button></form>} />
    <DashboardActions profileId={data.profile.id} currency={currency} />
    <section className="my-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Rakip Oteller" value={String(data.latestCompetitors.length)} detail={`${data.latestCompetitors.filter((c) => c.price != null).length} otelde güncel fiyat`} />
      <Metric label="Pazar Ortalaması" value={data.marketAverage ? formatMoney(data.marketAverage, currency) : "—"} detail="Son gözlemler üzerinden" />
      <Metric label="Bizim Fiyatımız" value={data.ownPrice ? formatMoney(data.ownPrice, currency) : "—"} detail="Manuel girilen son fiyat" />
      <Metric label="Öneri" value={data.recommendation} detail="±%10 eşik kuralı" accent={data.recommendationTone} />
    </section>
    <section className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
      <div className="card p-5 md:p-6"><div className="mb-5"><h2 className="text-lg font-bold">Fiyat trendi</h2><p className="text-xs text-black/50">Son 30 günlük pazar karşılaştırması</p></div>{data.trends.length ? <PriceChart data={data.trends} currency={currency} /> : <Empty text="Henüz trend oluşturacak gözlem yok." />}</div>
      <div className="card overflow-hidden"><div className="flex items-center justify-between border-b border-black/5 p-5"><div><h2 className="font-bold">Rakip Oteller</h2><p className="text-xs text-black/50">En son görülen fiyat</p></div><Link className="text-xs font-bold text-teal-700" href="/competitors">Tümünü gör →</Link></div>
        <div className="divide-y divide-black/5">{data.latestCompetitors.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 px-5 py-4"><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.name}</p><p className="mt-0.5 text-xs text-black/45">{item.district} · {item.source}</p></div><div className="text-right"><p className="font-bold">{item.price ? formatMoney(item.price, item.currency) : "—"}</p><p className="text-[10px] text-black/40">{item.observedAt ? formatDateTime(item.observedAt) : "Gözlem yok"}</p></div></div>)}</div>
      </div>
    </section>
    <div className="mt-5 flex items-center justify-between rounded-xl border border-black/5 bg-white/50 px-4 py-3 text-xs text-black/50"><span>Son Kontrol: {data.latestRun ? formatDateTime(data.latestRun.startedAt) : "Henüz çalıştırılmadı"}</span><span>Public kontroller: <b className={process.env.ENABLE_PUBLIC_PRICE_CHECKS === "true" ? "text-teal-700" : "text-coral"}>{process.env.ENABLE_PUBLIC_PRICE_CHECKS === "true" ? "Açık" : "Kapalı"}</b></span></div>
  </>;
}

function Metric({ label, value, detail, accent }: { label: string; value: string; detail: string; accent?: string }) {
  const color = accent === "low" ? "border-l-amber-400" : accent === "high" ? "border-l-coral" : accent === "near" ? "border-l-teal-500" : "border-l-transparent";
  return <div className={`card border-l-4 p-5 ${color}`}><p className="text-xs font-bold uppercase tracking-wider text-black/45">{label}</p><p className="mt-3 min-h-8 text-xl font-bold leading-tight">{value}</p><p className="mt-1 text-xs text-black/40">{detail}</p></div>;
}
function Empty({ text }: { text: string }) { return <div className="grid h-64 place-items-center rounded-xl bg-cream text-sm text-black/45">{text}</div>; }
