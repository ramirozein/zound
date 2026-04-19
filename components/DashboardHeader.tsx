"use client";

import React, { useState } from "react";
import { MdNotificationsNone, MdOutlineSettings, MdLogout, MdPerson } from "react-icons/md";
import { LogoutModal } from "./LogoutModal";

export function DashboardHeader({ username }: { username: string }) {
  const [showLogout, setShowLogout] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-black/40 backdrop-blur-md px-6 py-4 flex items-center justify-between">
      <h1 className="text-2xl font-bold text-white tracking-tight">
        Qué bueno verte, <span className="text-primary">{username}</span>
      </h1>
      
      <div className="flex bg-black/60 rounded-full p-1 gap-1 items-center border border-zinc-800/50">
        <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors">
          <MdNotificationsNone className="text-xl text-white" />
        </button>
        <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors">
          <MdOutlineSettings className="text-xl text-white" />
        </button>
        <div className="w-px h-6 bg-zinc-700 mx-1"></div>
        <button 
          onClick={() => setShowLogout(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-500/20 text-white hover:text-red-500 transition-colors"
          title="Cerrar sesión"
        >
          <MdLogout className="text-xl" />
        </button>
        <div className="w-8 h-8 flex items-center justify-center rounded-full border border-primary/50 ml-1 bg-zinc-800">
          <MdPerson className="text-xl text-white" />
        </div>
      </div>

      <LogoutModal isOpen={showLogout} onClose={() => setShowLogout(false)} />
    </header>
  );
}
