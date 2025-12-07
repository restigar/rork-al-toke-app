import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "../context/AuthContext";
import { BusinessProvider } from "../context/BusinessContext";
import { LanguageProvider } from "../context/LanguageContext";
import { VersionProvider } from "../context/VersionContext";
import { trpc, trpcClient } from "@/lib/trpc";
import ForceUpdateModal from "../components/ForceUpdateModal";
import '../i18n';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Atrás" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="registro-cliente" options={{ title: "Registro Cliente" }} />
      <Stack.Screen name="registro-comercio" options={{ title: "Registro Comercio" }} />
      <Stack.Screen name="cliente/perfil" options={{ headerShown: false }} />
      <Stack.Screen name="cliente/ofertas-del-dia" options={{ title: "Ofertas del Día" }} />
      <Stack.Screen name="comercio/dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="comercio/informacion" options={{ title: "Información" }} />
      <Stack.Screen name="comercio/cargar-oferta" options={{ title: "Cargar Oferta" }} />
      <Stack.Screen name="comercio/ofertas-activas" options={{ title: "Ofertas Activas" }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <VersionProvider>
            <AuthProvider>
              <BusinessProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <RootLayoutNav />
                  <ForceUpdateModal />
                </GestureHandlerRootView>
              </BusinessProvider>
            </AuthProvider>
          </VersionProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
