import React from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { getSession } from "@/lib/session";
import { MdOutlineSearch } from "react-icons/md";

export default async function SearchPage() {
  const session = await getSession();

  return (
    <div className="min-h-full">
      <DashboardHeader username={session?.username || "Usuario"} />
      
      <div className="p-6 pb-24 md:pb-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <MdOutlineSearch className="text-7xl text-zinc-500 mb-6" />
        <h1 className="text-3xl font-bold text-white mb-3">Búsqueda en construcción</h1>
        <p className="text-zinc-400 max-w-sm">
          Estamos trabajando para indexar todo nuestro catálogo musical. Pronto podrás buscar a tus artistas y canciones favoritas aquí.
        </p>
      </div>
    </div>
  );
}
