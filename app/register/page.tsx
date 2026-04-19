"use client";

import { useActionState } from "react";
import { registerAction } from "@/app/actions/auth";
import Link from "next/link";
import { MdOutlineMail, MdOutlineLock, MdOutlinePerson, MdRocketLaunch } from "react-icons/md";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, {});

  return (
    <div className="flex min-h-screen flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-black z-0">
        <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--color-primary)_0%,_transparent_40%)] blur-3xl"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-sm bg-surface/80 p-8 rounded-3xl border border-zinc-800 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <MdRocketLaunch className="text-black text-4xl" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Join Zound</h1>
        </div>

        {state?.error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 font-medium p-3 rounded-xl mb-6 text-sm text-center">
            {state.error}
          </div>
        )}

        <form action={action} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-zinc-400 ml-1">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MdOutlinePerson className="text-zinc-500 text-xl" />
              </div>
              <input 
                name="username"
                type="text"
                required
                placeholder="Choose a username" 
                className="w-full bg-zinc-900/50 border border-zinc-700 text-white rounded-full py-3 h-12 pl-11 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-zinc-600"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-zinc-400 ml-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MdOutlineMail className="text-zinc-500 text-xl" />
              </div>
              <input 
                name="email"
                type="email"
                required
                placeholder="Email address" 
                className="w-full bg-zinc-900/50 border border-zinc-700 text-white rounded-full py-3 h-12 pl-11 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-zinc-600"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-zinc-400 ml-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MdOutlineLock className="text-zinc-500 text-xl" />
              </div>
              <input 
                name="password"
                type="password"
                required
                placeholder="Secure password" 
                className="w-full bg-zinc-900/50 border border-zinc-700 text-white rounded-full py-3 h-12 pl-11 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-zinc-600"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={pending}
            className="w-full bg-white hover:bg-zinc-200 text-black font-extrabold py-3.5 h-12 rounded-full mt-8 shadow-[0_0_15px_rgba(255,255,255,0.2)] disabled:opacity-50 transition-all tracking-wide"
          >
            {pending ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-zinc-800/50 pt-6">
          <span className="text-zinc-400 text-sm">Already have an account? </span>
          <Link href="/login" className="text-white hover:text-primary font-bold transition-colors">
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
}
