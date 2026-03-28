import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

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
      const clientesRef = collection(db, "clientes");
      let q = query(
        clientesRef,
        orderBy("created_at", "desc"),
        limit(input.limit)
      );

      const querySnapshot = await getDocs(q);
      let clientes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (input.search) {
        const searchLower = input.search.toLowerCase();
        clientes = clientes.filter((cliente: any) => 
          cliente.nombre?.toLowerCase().includes(searchLower) ||
          cliente.email?.toLowerCase().includes(searchLower) ||
          cliente.numero_cliente?.toLowerCase().includes(searchLower)
        );
      }

      const totalQuery = query(clientesRef);
      const totalSnapshot = await getDocs(totalQuery);
      const total = totalSnapshot.size;

      console.log(`✅ Clientes obtenidos: ${clientes.length}/${total}`);

      return {
        clientes,
        total,
      };
    } catch (error: any) {
      console.error("❌ Error listando clientes:", error);
      throw new Error("Error al obtener clientes");
    }
  });
