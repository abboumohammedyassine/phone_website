import { ReactNode } from "react";

export function LegalPage({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 md:py-20">
      <h1 className="font-display text-2xl font-600 md:text-3xl">{title}</h1>
      <p className="mt-2 font-mono text-xs uppercase tracking-widest text-steel-500">
        Dernière mise à jour : {updatedAt}
      </p>
      <div className="prose-legal mt-10 space-y-8 text-sm leading-relaxed text-steel-300">
        {children}
      </div>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 font-display text-base font-600 text-porcelain">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
