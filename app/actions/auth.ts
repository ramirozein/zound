"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";

// Definimos interfaces para estado básico de acciones
export type FormState = {
  error?: string;
  success?: boolean;
};

export async function registerAction(prevState: FormState, formData: FormData): Promise<FormState> {
  const email = formData.get("email") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!email || !username || !password) {
    return { error: "Todos los campos son requeridos." };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "El formato del correo es inválido." };
  }

  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }

  try {
    // Check if user exists
    const existing = await db.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existing) {
      return { error: "Usuario o correo ya están en uso." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
    });

    // Create session
    await createSession(user.id, user.email, user.username);
  } catch (error) {
    console.error(error);
    return { error: "Error interno del servidor." };
  }

  // Redirect to home
  redirect("/");
}

export async function loginAction(prevState: FormState, formData: FormData): Promise<FormState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email y contraseña requeridos." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "El formato del correo es inválido." };
  }

  let user = null;
  try {
    user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { error: "Credenciales inválidas." };
    }

    const passwordsMatch = await bcrypt.compare(password, user.password);

    if (!passwordsMatch) {
      return { error: "Credenciales inválidas." };
    }

    await createSession(user.id, user.email, user.username);
  } catch (err) {
    console.error(err);
    return { error: "Error validando credenciales." };
  }

  redirect("/");
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
