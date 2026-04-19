"use client";
import dynamic from "next/dynamic";

// Exportamos IonIcon forzando que no se renderice en el servidor (SSR)
// para evitar el Hydration Mismatch cuando los Web Components de Ionic
// agregan la clase "md hydrated" antes de que React despierte.
export const IonIcon = dynamic(
  () => import("@ionic/react").then((mod) => mod.IonIcon),
  { ssr: false }
);
