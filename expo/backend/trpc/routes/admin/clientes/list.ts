import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { supabaseServer } from "@/lib/supabase-server";

export const listClientesProcedure = publicProcedure
  .input(
    z.object({
      adminId: z.string(),
      search: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    })
  )
  .query(async ({ input }) => {
    console.log("📋 Listando clientes para admin:", input.adminId);

    try {
      let consulta = supabaseServer
        .from("clientes")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (input.search) {
        const patron = `%${input.search}%`;
        consulta = consulta.or(
          `nombre.ilike.${patron},apellido.ilike.${patron},email.ilike.${patron},numero_cliente.ilike.${patron}`
        );
      }

      const { data: clientes, error, count } = await consulta;

      if (error) {
        console.error("❌ Error listando clientes:", error.message);
        throw new Error("Error al obtener clientes");
      }

      const total = count ?? clientes?.length ?? 0;

      console.log(`✅ Clientes obtenidos: ${clientes?.length ?? 0}/${total}`);

      return {
        clientes: clientes ?? [],
        total,
      };
    } catch (error: any) {
      console.error("❌ Error listando clientes:", error);
      throw new Error("Error al obtener clientes");
    }
  });
