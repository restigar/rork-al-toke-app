import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { db } from "@/lib/firebase";
import { collection, query, where, getCountFromServer } from "firebase/firestore";

export const dashboardStatsProcedure = publicProcedure
  .input(
    z.object({
      adminId: z.string(),
    })
  )
  .query(async ({ input }) => {
    console.log("📊 Obteniendo estadísticas del dashboard:", input.adminId);

    try {
      const [clientesSnap, comerciosSnap, ofertasSnap, ofertasDiaSnap] = await Promise.all([
        getCountFromServer(collection(db, "clientes")),
        getCountFromServer(collection(db, "comercios")),
        getCountFromServer(query(collection(db, "ofertas"), where("activa", "==", true))),
        getCountFromServer(collection(db, "ofertas_dia")),
      ]);

      const stats = {
        totalClientes: clientesSnap.data().count,
        totalComercios: comerciosSnap.data().count,
        totalOfertas: ofertasSnap.data().count,
        totalOfertasDia: ofertasDiaSnap.data().count,
      };

      console.log("✅ Estadísticas obtenidas:", stats);

      return stats;
    } catch (error: any) {
      console.error("❌ Error obteniendo estadísticas:", error);
      throw new Error("Error al obtener estadísticas");
    }
  });
