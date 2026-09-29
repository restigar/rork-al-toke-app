import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { supabaseServer } from "@/lib/supabase-server";

export const listComerciosProcedure = publicProcedure
  .input(
    z.object({
      adminId: z.string(),
      search: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    })
  )
  .query(async ({ input }) => {
    console.log("📋 Listando comercios para admin:", input.adminId);

    try {
      let consulta = supabaseServer
        .from("comercios")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (input.search) {
        const patron = `%${input.search}%`;
        consulta = consulta.or(
          `nombre.ilike.${patron},email.ilike.${patron},numero_comercio.ilike.${patron}`
        );
      }

      const { data: comercios, error, count } = await consulta;

      if (error) {
        console.error("❌ Error listando comercios:", error.message);
        throw new Error("Error al obtener comercios");
      }

      const total = count ?? comercios?.length ?? 0;

      console.log(`✅ Comercios obtenidos: ${comercios?.length ?? 0}/${total}`);

      return {
        comercios: comercios ?? [],
        total,
      };
    } catch (error: any) {
      console.error("❌ Error listando comercios:", error);
      throw new Error("Error al obtener comercios");
    }
  });
