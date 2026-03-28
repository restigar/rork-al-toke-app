import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";

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
      const comisionesRef = collection(db, "comisiones");
      let q;

      if (input.activa !== undefined) {
        q = query(
          comisionesRef,
          where("activa", "==", input.activa),
          orderBy("created_at", "desc")
        );
      } else {
        q = query(comisionesRef, orderBy("created_at", "desc"));
      }

      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      console.log(`✅ Comisiones obtenidas: ${data.length}`);

      return data;
    } catch (error: any) {
      console.error("❌ Error listando comisiones:", error);
      throw new Error("Error al obtener comisiones");
    }
  });
