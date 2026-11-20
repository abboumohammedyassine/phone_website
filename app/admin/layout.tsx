import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

const NAV_LINK =
  "whitespace-nowrap rounded-lg px-3 py-2 text-sm text-steel-300 transition hover:bg-carbon-800 hover:text-porcelain sm:py-1.5";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header className="border-b border-carbon-700 bg-carbon-900">
        {/* Téléphone : titre + déconnexion sur la 1re ligne, menu sur la 2e (pleine largeur).
            Ordinateur / tablette : tout sur une seule ligne. */}
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 sm:gap-x-6 sm:px-5 sm:py-3">
          <span className="order-1 min-w-0 flex-1 truncate font-mono text-[11px] uppercase tracking-widest text-steel-400 sm:flex-none sm:text-xs">
            <span className="sm:hidden">Phone House · Admin</span>
            <span className="hidden sm:inline">Phone House Maghnia · Admin</span>
          </span>

          <nav
            aria-label="Navigation admin"
            className="order-3 -mx-2 flex w-full gap-1 overflow-x-auto sm:order-2 sm:mx-0 sm:w-auto"
          >
            <Link href="/admin" className={NAV_LINK}>
              Commandes
            </Link>
            <Link href="/admin/produits" className={NAV_LINK}>
              Produits
            </Link>
          </nav>

          <div className="order-2 shrink-0 sm:order-3 sm:ml-auto">
            <LogoutButton />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
