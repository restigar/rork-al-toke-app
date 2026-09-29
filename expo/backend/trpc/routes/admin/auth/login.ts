import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { supabaseServer } from "@/lib/supabase-server";

export const adminLoginProcedure = publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string().min(6),
    })
  )
  .mutation(async ({ input }) => {
    console.log("🔐 Intentando login de admin:", input.email);

    try {
      const { data: authData, error: authError } = await supabaseServer.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (authError || !authData.user) {
        throw new Error("Credenciales inválidas");
      }

      const { data: adminData, error: adminError } = await supabaseServer
        .from("administradores")
        .select("*")
        .eq("email", input.email)
        .eq("activo", true)
        .maybeSingle();

      if (adminError || !adminData) {
        console.error("❌ Usuario sin registro de administrador:", input.email);
        throw new Error("Usuario no es administrador");
      }

      await supabaseServer
        .from("administradores")
        .update({ ultimo_acceso: new Date().toISOString() })
        .eq("id", adminData.id);

      console.log("✅ Login exitoso:", adminData.nombre);

      return {
        token: authData.session?.access_token ?? "",
        id: adminData.id,
        email: adminData.email as string,
        nombre: adminData.nombre as string,
        rol: adminData.rol as string,
        permisos: adminData.permisos ?? [],
      };
    } catch (error: any) {
      console.error("❌ Error en login:", error);
      throw new Error(error.message || "Error al iniciar sesión");
    }
  });
