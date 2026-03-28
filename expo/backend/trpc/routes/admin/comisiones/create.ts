import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export const createComisionProcedure = publicProcedure
  .input(
    z.object({
      adminId: z.string(),
      nombre: z.string(),
      tipo: z.enum(["porcentaje", "fijo", "plan"]),
      valor: z.number(),
      descripcion: z.string().optional(),
      aplicable_a: z.enum(["todos", "comercios", "clientes"]).default("todos"),
    })
  )
  .mutation(async ({ input }) => {
    console.log("➕ Creando comisión:", input.nombre);

    try {
      const comisionData = {
        nombre: input.nombre,
        tipo: input.tipo,
        valor: input.valor,
        descripcion: input.descripcion,
        aplicable_a: input.aplicable_a,
        activa: true,
        created_at: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, "comisiones"), comisionData);
      const data = { id: docRef.id, ...comisionData };

      await addDoc(collection(db, "auditoria_admin"), {
        admin_id: input.adminId,
        accion: "crear_comision",
        entidad_tipo: "comision",
        entidad_id: data.id,
        datos_nuevos: data,
        created_at: new Date().toISOString(),
      });

      console.log("✅ Comisión creada:", data.nombre);

      return data;
    } catch (error: any) {
      console.error("❌ Error creando comisión:", error);
      throw new Error("Error al crear comisión");
    }
  });
