import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

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
      const comerciosRef = collection(db, "comercios");
      let q = query(
        comerciosRef,
        orderBy("created_at", "desc"),
        limit(input.limit)
      );

      const querySnapshot = await getDocs(q);
      let comercios = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (input.search) {
        const searchLower = input.search.toLowerCase();
        comercios = comercios.filter((comercio: any) => 
          comercio.nombre?.toLowerCase().includes(searchLower) ||
          comercio.email?.toLowerCase().includes(searchLower) ||
          comercio.numero_comercio?.toLowerCase().includes(searchLower)
        );
      }

      const totalQuery = query(comerciosRef);
      const totalSnapshot = await getDocs(totalQuery);
      const total = totalSnapshot.size;

      console.log(`✅ Comercios obtenidos: ${comercios.length}/${total}`);

      return {
        comercios,
        total,
      };
    } catch (error: any) {
      console.error("❌ Error listando comercios:", error);
      throw new Error("Error al obtener comercios");
    }
  });
