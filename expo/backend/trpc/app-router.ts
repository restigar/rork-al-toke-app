import { createTRPCRouter } from "@/backend/trpc/create-context";
import hiRoute from "@/backend/trpc/routes/example/hi/route";
import { adminLoginProcedure } from "@/backend/trpc/routes/admin/auth/login";
import { listComerciosProcedure } from "@/backend/trpc/routes/admin/comercios/list";
import { updateComercioProcedure } from "@/backend/trpc/routes/admin/comercios/update";
import { listClientesProcedure } from "@/backend/trpc/routes/admin/clientes/list";
import { listComisionesProcedure } from "@/backend/trpc/routes/admin/comisiones/list";
import { createComisionProcedure } from "@/backend/trpc/routes/admin/comisiones/create";
import { dashboardStatsProcedure } from "@/backend/trpc/routes/admin/stats/dashboard";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  admin: createTRPCRouter({
    auth: createTRPCRouter({
      login: adminLoginProcedure,
    }),
    comercios: createTRPCRouter({
      list: listComerciosProcedure,
      update: updateComercioProcedure,
    }),
    clientes: createTRPCRouter({
      list: listClientesProcedure,
    }),
    comisiones: createTRPCRouter({
      list: listComisionesProcedure,
      create: createComisionProcedure,
    }),
    stats: createTRPCRouter({
      dashboard: dashboardStatsProcedure,
    }),
  }),
});

export type AppRouter = typeof appRouter;
