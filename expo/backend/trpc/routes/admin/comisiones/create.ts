import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { supabaseServer } from "@/lib/supabase-server";

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
      const { data: comisionCreada, error } = await supabaseServer
        .from("comisiones")
        .insert({
          nombre: input.nombre,
          tipo: input.tipo,
          valor: input.valor,
          descripcion: input.descripcion ?? null,
          aplicable_a: input.aplicable_a,
          activa: true,
        })
        .select("*")
        .single();

      if (error || !comisionCreada) {
        console.error("❌ Error creando comisión:", error?.message);
        throw new Error("Error al crear comisión");
      }

      // Auditoría: no bloquea la operación si falla.
      try {
        await supabaseServer.from("auditoria_admin").insert({
          admin_id: input.adminId,
          accion: "crear_comision",
          entidad_tipo: "comision",
          entidad_id: comisionCreada.id,
          datos_nuevos: comisionCreada,
        });
      } catch (auditoriaError) {
        console.warn("⚠️ No se pudo registrar auditoría:", auditoriaError);
      }

      console.log("✅ Comisión creada:", comisionCreada.nombre);

      return comisionCreada;
    } catch (error: any) {
      console.error("❌ Error creando comisión:", error);
      throw new Error(error.message || "Error al crear comisión");
    }
  });
