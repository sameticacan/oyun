export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: React.ReactNode }) {
  return <header className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
    <div>{eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-teal-600">{eyebrow}</p>}<h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-black/55">{description}</p></div>{action}
  </header>;
}
