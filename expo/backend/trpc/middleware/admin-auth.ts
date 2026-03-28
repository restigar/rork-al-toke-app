import { TRPCError } from "@trpc/server";
import { publicProcedure } from "../create-context";

export const isAdmin = publicProcedure.use(async ({ ctx, next }) => {
  const adminHeader = ctx.req.headers.get("x-admin-id");
  
  if (!adminHeader) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "No autenticado como administrador",
    });
  }

  return next({
    ctx: {
      ...ctx,
      adminId: adminHeader,
    },
  });
});

export const requirePermission = (permission: string) => {
  return isAdmin.use(async ({ ctx, next }) => {
    return next();
  });
};

export type AdminContext = {
  adminId: string;
};
