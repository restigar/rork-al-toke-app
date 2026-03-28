import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, addDoc } from "firebase/firestore";

export const updateComercioProcedure = publicProcedure
  .input(
    z.object({
      adminId: z.string(),
      comercioId: z.string(),
      data: z.object({
        nombre: z.string().optional(),
        telefono: z.string().optional(),
        tipo: z.enum(["Comercio", "Servicio", "Organización Pública"]).optional(),
        rubro: z.string().optional(),
        sub_rubro: z.string().optional(),
        foto_perfil: z.string().optional(),
        facebook: z.string().optional(),
        instagram: z.string().optional(),
        website: z.string().optional(),
        ubicacion: z.any().optional(),
        horarios: z.any().optional(),
        esta_de_turno: z.boolean().optional(),
      }),
    })
  )
  .mutation(async ({ input }) => {
    console.log("✏️ Actualizando comercio:", input.comercioId);

    try {
      const comercioRef = doc(db, "comercios", input.comercioId);
      const comercioSnap = await getDoc(comercioRef);

      if (!comercioSnap.exists()) {
        throw new Error("Comercio no encontrado");
      }

      const comercioAntes = comercioSnap.data();

      await updateDoc(comercioRef, input.data as any);

      const comercioActualizado = await getDoc(comercioRef);
      const comercioData = comercioActualizado.data();
      const data = { id: comercioActualizado.id, ...comercioData };

      await addDoc(collection(db, "auditoria_admin"), {
        admin_id: input.adminId,
        accion: "actualizar_comercio",
        entidad_tipo: "comercio",
        entidad_id: input.comercioId,
        datos_anteriores: comercioAntes,
        datos_nuevos: data,
        created_at: new Date().toISOString(),
      });

      console.log("✅ Comercio actualizado:", comercioData?.nombre);

      return data;
    } catch (error: any) {
      console.error("❌ Error actualizando comercio:", error);
      throw new Error("Error al actualizar comercio");
    }
  });
