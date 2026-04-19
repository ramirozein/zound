"use client";

import { useTransition, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { logoutAction } from "@/app/actions/auth";
import { MdLogout } from "react-icons/md";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LogoutModal({ isOpen, onClose }: LogoutModalProps) {
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <div className="relative bg-[#121212]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 w-full max-w-sm shadow-[0_20px_40px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <MdLogout className="text-red-500 text-4xl" />
        </div>
        
        <h2 className="text-2xl font-bold text-white text-center mb-3">¿Cerrar sesión?</h2>
        <p className="text-zinc-400 text-sm text-center mb-8 px-2 leading-relaxed">
          Tendrás que volver a ingresar tu usuario y contraseña la próxima vez que quieras escuchar música.
        </p>

        <div className="flex flex-col gap-3">
          <button 
            onClick={() => startTransition(() => logoutAction())}
            disabled={isPending}
            className="w-full py-4 bg-primary hover:scale-[1.02] text-black font-bold rounded-full transition-transform flex justify-center items-center gap-2"
          >
            {isPending ? "Saliendo..." : "Sí, cerrar sesión"}
          </button>
          <button 
            onClick={onClose}
            disabled={isPending}
            className="w-full py-4 bg-transparent hover:text-white text-zinc-400 font-bold rounded-full transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
