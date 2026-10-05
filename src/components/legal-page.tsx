export function LegalPage({
  eyebrow,
  title,
  updated,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  intro: string;
  sections: Array<[string, string[]]>;
}) {
  return (
    <>
      <header className="border-b border-ink-100 bg-ink-50">
        <div className="wrap py-10">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-2 text-[36px] leading-tight sm:text-[44px]">{title}</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-500">{intro}</p>
          <p className="mt-3 text-[12px] uppercase tracking-[0.1em] text-ink-400">{updated}</p>
        </div>
      </header>

      <div className="wrap max-w-3xl py-12">
        {sections.map(([heading, paragraphs]) => (
          <section key={heading} className="mb-10">
            <h2 className="text-[22px] leading-tight">{heading}</h2>
            <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ink-600">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
