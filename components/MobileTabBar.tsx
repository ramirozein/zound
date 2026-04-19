"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  MdOutlineHome, MdHome, 
  MdOutlineSearch, MdSearch, 
  MdOutlineLibraryMusic, MdLibraryMusic 
} from "react-icons/md";

export function MobileTabBar() {
  const pathname = usePathname();

  const tabs = [
    { label: "Inicio", href: "/", iconOutlined: MdOutlineHome, iconFilled: MdHome },
    { label: "Biblioteca", href: "/library", iconOutlined: MdOutlineLibraryMusic, iconFilled: MdLibraryMusic },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-lg border-t border-zinc-900 md:hidden flex items-center justify-around z-50">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={`flex flex-col items-center gap-1 w-full py-2 ${
              isActive ? "text-white" : "text-zinc-500"
            }`}
          >
            {isActive ? (
              <tab.iconFilled className="text-2xl" />
            ) : (
              <tab.iconOutlined className="text-2xl" />
            )}
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
