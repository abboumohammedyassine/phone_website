import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  totalPages: number;
  /** Paramètres actuels de l'URL (filtres, tri…) : conservés d'une page à l'autre. */
  params: Record<string, string | string[] | undefined>;
  basePath?: string;
};

function hrefFor(basePath: string, params: Props["params"], page: number) {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "page" || value === undefined || value === "") continue;
    if (Array.isArray(value)) value.forEach((v) => sp.append(key, v));
    else sp.set(key, value);
  }
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/** 1 … 4 [5] 6 … 12 : toujours la première, la dernière et les voisines de la page courante. */
export function pageWindow(page: number, totalPages: number): Array<number | "…"> {
  const keep = new Set([1, totalPages, page - 1, page, page + 1]);
  const pages = [...keep].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out: Array<number | "…"> = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}

export default function Pagination({ page, totalPages, params, basePath = "/catalogue" }: Props) {
  if (totalPages <= 1) return null;

  const base =
    "flex h-9 min-w-9 items-center justify-center rounded-full border px-3 text-sm transition";
  const idle = "border-carbon-600 text-steel-300 hover:border-steel-400 hover:text-porcelain";

  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={hrefFor(basePath, params, page - 1)} className={`${base} ${idle}`} aria-label="Page précédente">
          <ChevronLeft size={16} />
        </Link>
      ) : (
        <span className={`${base} border-carbon-700 text-carbon-600`} aria-hidden="true">
          <ChevronLeft size={16} />
        </span>
      )}

      {pageWindow(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-steel-400" aria-hidden="true">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(basePath, params, p)}
            aria-current={p === page ? "page" : undefined}
            className={`${base} ${
              p === page ? "border-amber-500 bg-amber-500 font-medium text-carbon-950" : idle
            }`}
          >
            {p}
          </Link>
        )
      )}

      {page < totalPages ? (
        <Link href={hrefFor(basePath, params, page + 1)} className={`${base} ${idle}`} aria-label="Page suivante">
          <ChevronRight size={16} />
        </Link>
      ) : (
        <span className={`${base} border-carbon-700 text-carbon-600`} aria-hidden="true">
          <ChevronRight size={16} />
        </span>
      )}
    </nav>
  );
}
