"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { BottomPlayer } from "@/components/BottomPlayer";
import { MobileTabBar } from "@/components/MobileTabBar";
import { usePlayerStore } from "@/store/usePlayerStore";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentSong = usePlayerStore(state => state.currentSong);
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isAuthPage) {
    return <main className="flex-1 w-full h-full relative bg-background">{children}</main>;
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full bg-black md:bg-transparent overflow-hidden">
        <main className={`flex-1 overflow-y-auto w-full md:rounded-lg md:mt-2 md:mr-2 ${currentSong ? 'md:mb-28 pb-[140px]' : 'md:mb-2 pb-[76px]'} bg-surface/50 backdrop-blur-3xl shadow-2xl relative transition-spacing duration-300`}>
          {children}
        </main>
      </div>

      {/* Global Player anchored to the bottom */}
      <div className="fixed bottom-0 left-0 right-0 md:bottom-2 md:left-2 md:right-2 z-[60] flex flex-col pointer-events-none">
        <div className="pointer-events-auto">
          <BottomPlayer />
        </div>
        <div className="pointer-events-auto">
          <MobileTabBar />
        </div>
      </div>
    </>
  );
}
