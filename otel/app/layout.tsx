import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = { title: "OdaRadar", description: "Butik oteller için rakip fiyat takibi" };

const navigation = [
  ["Genel Bakış", "/", "⌁"], ["Rakip Oteller", "/competitors", "▦"], ["Fiyat Gözlemleri", "/observations", "◫"],
  ["Fiyat Yakala", "/capture", "⊕"], ["Arama Profilleri", "/profiles", "◎"], ["Ayarlar ve Güvenlik", "/settings", "⚙"],
] as const;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body>
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="border-b border-black/5 bg-[#172126] text-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0">
        <div className="flex items-center justify-between px-5 py-5 lg:block lg:px-7 lg:py-8">
          <Link href="/" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-500 text-xl">◉</span><span><b className="block text-lg tracking-tight">OdaRadar</b><small className="text-white/50">Pazar zekâsı</small></span></Link>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold tracking-widest text-white/70">MVP</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-4 lg:block lg:space-y-1 lg:px-4">
          {navigation.map(([label, href, icon]) => <Link key={href} href={href} className="flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-white/65 transition hover:bg-white/10 hover:text-white"><span className="text-lg text-teal-100">{icon}</span>{label}</Link>)}
        </nav>
        <div className="mx-5 mt-auto hidden rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-white/55 lg:block lg:absolute lg:bottom-6 lg:left-0 lg:right-0">
          <b className="mb-1 block text-white/80">Güvenli mod etkin</b>Public fiyat kontrolleri varsayılan olarak kapalıdır.
        </div>
      </aside>
      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-9 lg:py-8">{children}</main>
    </div>
  </body></html>;
}
