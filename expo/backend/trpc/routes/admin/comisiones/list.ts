import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { supabaseServer } from "@/lib/supabase-server";

export const listComisionesProcedure = publicProcedure
  .input(
    z.object({
      adminId: z.string(),
      activa: z.boolean().optional(),
    })
  )
  .query(async ({ input }) => {
    console.log("📋 Listando comisiones para admin:", input.adminId);

    try {
      let consulta = supabaseServer
        .from("comisiones")
        .select("*")
        .order("created_at", { ascending: false });

      if (input.activa !== undefined) {
        consulta = consulta.eq("activa", input.activa);
      }

      const { data: comisiones, error } = await consulta;

      if (error) {
        console.error("❌ Error listando comisiones:", error.message);
        throw new Error("Error al obtener comisiones");
      }

      console.log(`✅ Comisiones obtenidas: ${comisiones?.length ?? 0}`);

      return comisiones ?? [];
    } catch (error: any) {
      console.error("❌ Error listando comisiones:", error);
      throw new Error("Error al obtener comisiones");
    }
  });
