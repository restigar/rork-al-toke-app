import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";

export const adminLoginProcedure = publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string().min(6),
    })
  )
  .mutation(async ({ input }) => {
    console.log("🔐 Intentando login de admin:", input.email);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, input.email, input.password);
      const user = userCredential.user;

      if (!user) {
        throw new Error("Credenciales inválidas");
      }

      const adminRef = collection(db, "administradores");
      const q = query(
        adminRef,
        where("email", "==", input.email),
        where("activo", "==", true)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error("Usuario no es administrador");
      }

      const adminDoc = querySnapshot.docs[0];
      const adminData = adminDoc.data();
      const admin = { id: adminDoc.id, ...adminData };

      await updateDoc(doc(db, "administradores", admin.id), {
        ultimo_acceso: new Date().toISOString()
      });

      console.log("✅ Login exitoso:", adminData.nombre);

      const token = await user.getIdToken();

      return {
        token,
        id: admin.id,
        email: adminData.email as string,
        nombre: adminData.nombre as string,
        rol: adminData.rol as string,
        permisos: adminData.permisos as any,
      };
    } catch (error: any) {
      console.error("❌ Error en login:", error);
      throw new Error(error.message || "Error al iniciar sesión");
    }
  });
