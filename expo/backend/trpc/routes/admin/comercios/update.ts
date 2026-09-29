import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { supabaseServer } from "@/lib/supabase-server";

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
        calle: z.string().optional(),
        ciudad: z.string().optional(),
        latitud: z.number().optional(),
        longitud: z.number().optional(),
        horarios: z.any().optional(),
        esta_de_turno: z.boolean().optional(),
      }),
    })
  )
  .mutation(async ({ input }) => {
    console.log("✏️ Actualizando comercio:", input.comercioId);

    try {
      const { data: comercioAntes } = await supabaseServer
        .from("comercios")
        .select("*")
        .eq("id", input.comercioId)
        .maybeSingle();

      if (!comercioAntes) {
        throw new Error("Comercio no encontrado");
      }

      const { data: comercioActualizado, error: updateError } = await supabaseServer
        .from("comercios")
        .update(input.data)
        .eq("id", input.comercioId)
        .select("*")
        .single();

      if (updateError || !comercioActualizado) {
        console.error("❌ Error actualizando comercio:", updateError?.message);
        throw new Error("Error al actualizar comercio");
      }

      // Auditoría: no bloquea la operación si falla.
      try {
        await supabaseServer.from("auditoria_admin").insert({
          admin_id: input.adminId,
          accion: "actualizar_comercio",
          entidad_tipo: "comercio",
          entidad_id: input.comercioId,
          datos_anteriores: comercioAntes,
          datos_nuevos: comercioActualizado,
        });
      } catch (auditoriaError) {
        console.warn("⚠️ No se pudo registrar auditoría:", auditoriaError);
      }

      console.log("✅ Comercio actualizado:", comercioActualizado.nombre);

      return comercioActualizado;
    } catch (error: any) {
      console.error("❌ Error actualizando comercio:", error);
      throw new Error(error.message || "Error al actualizar comercio");
    }
  });
