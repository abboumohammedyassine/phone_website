import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="border-b border-carbon-700 bg-carbon-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-6">
            <span className="font-mono text-xs uppercase tracking-widest text-steel-400">
              Phone House Maghnia · Admin
            </span>
            <nav className="flex gap-4 text-sm">
              <Link href="/admin" className="text-steel-300 hover:text-porcelain">
                Commandes
              </Link>
              <Link
                href="/admin/produits"
                className="text-steel-300 hover:text-porcelain"
              >
                Produits
              </Link>
            </nav>
          </div>
          <LogoutButton />
        </div>
      </div>
      {children}
    </div>
  );
}