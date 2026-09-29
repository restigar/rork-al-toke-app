import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { supabaseServer } from "@/lib/supabase-server";

/** Cuenta filas de una tabla; devuelve 0 si la tabla no existe o RLS lo bloquea. */
const contar = async (tabla: string, filtros?: Record<string, unknown>): Promise<number> => {
  try {
    let consulta = supabaseServer.from(tabla).select("*", { count: "exact", head: true });
    for (const [columna, valor] of Object.entries(filtros ?? {})) {
      consulta = consulta.eq(columna, valor);
    }
    const { count, error } = await consulta;
    if (error) {
      console.warn(`⚠️ No se pudo contar ${tabla}:`, error.message);
      return 0;
    }
    return count ?? 0;
  } catch (error) {
    console.warn(`⚠️ No se pudo contar ${tabla}:`, error);
    return 0;
  }
};

export const dashboardStatsProcedure = publicProcedure
  .input(
    z.object({
      adminId: z.string(),
    })
  )
  .query(async ({ input }) => {
    console.log("📊 Obteniendo estadísticas del dashboard:", input.adminId);

    try {
      const [totalClientes, totalComercios, totalOfertas, totalOfertasDia] = await Promise.all([
        contar("clientes"),
        contar("comercios"),
        contar("ofertas", { activa: true }),
        contar("ofertas_dia"),
      ]);

      const stats = {
        totalClientes,
        totalComercios,
        totalOfertas,
        totalOfertasDia,
      };

      console.log("✅ Estadísticas obtenidas:", stats);

      return stats;
    } catch (error: any) {
      console.error("❌ Error obteniendo estadísticas:", error);
      throw new Error("Error al obtener estadísticas");
    }
  });
