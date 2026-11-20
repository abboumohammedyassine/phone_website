"use client";

import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-2 text-xs text-steel-400 hover:text-porcelain"
    >
      <LogOut size={13} />
      Déconnexion
    </button>
  );
}
