import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Comercio, Oferta, OfertaDelDia } from '../types';
import {
  cargarOfertas,
  cargarOfertasDia,
  guardarOfertaRemota,
  guardarOfertaDiaRemota,
  eliminarOfertaRemota,
} from '../lib/supabase-ofertas';

const COMERCIOS_KEY = '@altoke_comercios';
const OFERTAS_KEY = '@altoke_ofertas';
const OFERTAS_DIA_KEY = '@altoke_ofertas_dia';
const CLIENTES_KEY = '@altoke_clientes';
const COUNTER_KEY = '@altoke_counter';

export const [BusinessProvider, useBusiness] = createContextHook(() => {
  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [ofertasDia, setOfertasDia] = useState<OfertaDelDia[]>([]);
  const [clienteCounter, setClienteCounter] = useState<number>(0);
  const [comercioCounter, setComercioCounter] = useState<number>(0);

  const loadData = useCallback(async () => {
    try {
      const [comerciosJson, ofertasJson, ofertasDiaJson, , counterJson] = await Promise.all([
        AsyncStorage.getItem(COMERCIOS_KEY),
        AsyncStorage.getItem(OFERTAS_KEY),
        AsyncStorage.getItem(OFERTAS_DIA_KEY),
        AsyncStorage.getItem(CLIENTES_KEY),
        AsyncStorage.getItem(COUNTER_KEY),
      ]);

      if (comerciosJson) {
        setComercios(JSON.parse(comerciosJson));
      }
      if (ofertasJson) {
        setOfertas(JSON.parse(ofertasJson));
      }
      if (ofertasDiaJson) {
        setOfertasDia(JSON.parse(ofertasDiaJson));
      }
      if (counterJson) {
        const counter = JSON.parse(counterJson);
        setClienteCounter(counter.cliente || 0);
        setComercioCounter(counter.comercio || 0);
      }

      // Sincronizar con Supabase: la nube es la fuente de verdad,
      // así lo que publica un celular lo ven todos los demás.
      try {
        const remotas = await cargarOfertas();
        const remotasDia = await cargarOfertasDia();

        if (remotas !== null && remotasDia !== null) {
          const localesOfertas: Oferta[] = ofertasJson ? JSON.parse(ofertasJson) : [];
          const localesDia: OfertaDelDia[] = ofertasDiaJson ? JSON.parse(ofertasDiaJson) : [];

          // A subir: las ofertas que no están en la nube y también las remotas
          // cuya media quedó como archivo local (reintenta la subida al bucket).
          const remotaPorId = new Map(remotas.map(o => [o.id, o] as const));
          const remotaDiaPorId = new Map(remotasDia.map(o => [o.id, o] as const));
          const mediaPendiente = (remota?: { imagenUrl?: string }) =>
            Boolean(remota?.imagenUrl?.startsWith('file:'));

          const paraSubir = localesOfertas.filter(
            o => !remotaPorId.has(o.id) || mediaPendiente(remotaPorId.get(o.id))
          );
          const paraSubirDia = localesDia.filter(
            o => !remotaDiaPorId.has(o.id) || mediaPendiente(remotaDiaPorId.get(o.id))
          );

          const urlFinal = new Map<string, string>();
          for (const o of paraSubir) {
            try {
              const url = await guardarOfertaRemota(o);
              if (url) {
                urlFinal.set(o.id, url);
              }
            } catch (e) {
              console.log('ℹ️ No se pudo migrar una oferta local:', e instanceof Error ? e.message : e);
            }
          }
          for (const o of paraSubirDia) {
            try {
              const url = await guardarOfertaDiaRemota(o);
              if (url) {
                urlFinal.set(o.id, url);
              }
            } catch (e) {
              console.log('ℹ️ No se pudo migrar una oferta del día local:', e instanceof Error ? e.message : e);
            }
          }

          const mapa = new Map(remotas.map(o => [o.id, o] as const));
          for (const o of paraSubir) {
            mapa.set(o.id, { ...o, imagenUrl: urlFinal.get(o.id) ?? o.imagenUrl });
          }
          const mapaDia = new Map(remotasDia.map(o => [o.id, o] as const));
          for (const o of paraSubirDia) {
            mapaDia.set(o.id, { ...o, imagenUrl: urlFinal.get(o.id) ?? o.imagenUrl });
          }

          const finales = Array.from(mapa.values());
          const finalesDia = Array.from(mapaDia.values());
          setOfertas(finales);
          setOfertasDia(finalesDia);
          await AsyncStorage.setItem(OFERTAS_KEY, JSON.stringify(finales));
          await AsyncStorage.setItem(OFERTAS_DIA_KEY, JSON.stringify(finalesDia));
        }
      } catch (error) {
        console.log('ℹ️ No se pudo sincronizar con Supabase (se usa la copia local):', error instanceof Error ? error.message : error);
      }
    } catch (error) {
      console.error('Error loading business data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const limpiarOfertasExpiradas = useCallback(async () => {
    const now = new Date();
    const ofertasValidas = ofertas.filter(o => {
      const finDate = new Date(o.vigenciaFin);
      return finDate > now;
    });

    if (ofertasValidas.length !== ofertas.length) {
      console.log(`🗑️ Limpiando ${ofertas.length - ofertasValidas.length} ofertas expiradas`);
      setOfertas(ofertasValidas);
      await AsyncStorage.setItem(OFERTAS_KEY, JSON.stringify(ofertasValidas));
    }
  }, [ofertas]);

  useEffect(() => {
    const interval = setInterval(() => {
      limpiarOfertasExpiradas();
    }, 60000);

    limpiarOfertasExpiradas();

    return () => clearInterval(interval);
  }, [limpiarOfertasExpiradas]);

  const saveComercio = useCallback(async (comercio: Comercio) => {
    const existingIndex = comercios.findIndex(c => c.id === comercio.id);
    let updated: Comercio[];
    
    if (existingIndex >= 0) {
      updated = [...comercios];
      updated[existingIndex] = comercio;
    } else {
      updated = [...comercios, comercio];
    }

    setComercios(updated);
    await AsyncStorage.setItem(COMERCIOS_KEY, JSON.stringify(updated));
  }, [comercios]);

  const getComercio = useCallback((id: string): Comercio | undefined => {
    return comercios.find(c => c.id === id);
  }, [comercios]);

  const saveOferta = useCallback(async (oferta: Oferta) => {
    const existingIndex = ofertas.findIndex(o => o.id === oferta.id);
    let updated: Oferta[];
    
    if (existingIndex >= 0) {
      updated = [...ofertas];
      updated[existingIndex] = oferta;
    } else {
      updated = [...ofertas, oferta];
    }
    
    setOfertas(updated);
    await AsyncStorage.setItem(OFERTAS_KEY, JSON.stringify(updated));
    try {
      await guardarOfertaRemota(oferta);
    } catch (error) {
      console.log('ℹ️ No se pudo sincronizar la oferta con Supabase:', error instanceof Error ? error.message : error);
    }
  }, [ofertas]);

  const deleteOferta = useCallback(async (ofertaId: string) => {
    const updated = ofertas.filter(o => o.id !== ofertaId);
    setOfertas(updated);
    await AsyncStorage.setItem(OFERTAS_KEY, JSON.stringify(updated));
    try {
      await eliminarOfertaRemota(ofertaId);
    } catch (error) {
      console.log('ℹ️ No se pudo eliminar la oferta en Supabase:', error instanceof Error ? error.message : error);
    }
  }, [ofertas]);

  const getOfertasByComercio = useCallback((comercioId: string): Oferta[] => {
    return ofertas.filter(o => o.comercioId === comercioId);
  }, [ofertas]);

  const getOfertasActivas = useCallback((): Oferta[] => {
    const now = new Date();
    
    return ofertas.filter(o => {
      const inicioDate = new Date(o.vigenciaInicio);
      const finDate = new Date(o.vigenciaFin);
      
      console.log('🔍 Validando oferta:', o.titulo);
      console.log('⏰ Ahora:', now.toLocaleString('es-AR'));
      console.log('📅 Inicio:', inicioDate.toLocaleString('es-AR'));
      console.log('📅 Fin:', finDate.toLocaleString('es-AR'));
      console.log('✅ Activa:', now >= inicioDate && now <= finDate);
      
      return now >= inicioDate && now <= finDate;
    });
  }, [ofertas]);

  const getNextClienteNumber = useCallback(async () => {
    const newNumber = clienteCounter + 1;
    setClienteCounter(newNumber);
    await AsyncStorage.setItem(COUNTER_KEY, JSON.stringify({ cliente: newNumber, comercio: comercioCounter }));
    return newNumber;
  }, [clienteCounter, comercioCounter]);

  const getNextComercioNumber = useCallback(async () => {
    const newNumber = comercioCounter + 1;
    setComercioCounter(newNumber);
    await AsyncStorage.setItem(COUNTER_KEY, JSON.stringify({ cliente: clienteCounter, comercio: newNumber }));
    return newNumber;
  }, [clienteCounter, comercioCounter]);

  const saveOfertaDia = useCallback(async (oferta: OfertaDelDia) => {
    const updated = [...ofertasDia.filter(o => o.id !== oferta.id), oferta];
    setOfertasDia(updated);
    await AsyncStorage.setItem(OFERTAS_DIA_KEY, JSON.stringify(updated));
    try {
      await guardarOfertaDiaRemota(oferta);
    } catch (error) {
      console.log('ℹ️ No se pudo sincronizar la oferta del día con Supabase:', error instanceof Error ? error.message : error);
    }
  }, [ofertasDia]);

  const getOfertasDiaByCliente = useCallback((clienteId: string): OfertaDelDia[] => {
    return ofertasDia.filter(o => o.clienteId === clienteId);
  }, [ofertasDia]);

  const getOfertasDiaActivas = useCallback((clienteId: string): OfertaDelDia[] => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return ofertasDia.filter(o => {
      if (o.clienteId !== clienteId) return false;
      const fechaOferta = new Date(o.fecha);
      fechaOferta.setHours(0, 0, 0, 0);
      return fechaOferta >= now;
    });
  }, [ofertasDia]);

  const canClienteAddOfertaDia = useCallback((clienteId: string, fecha: string): boolean => {
    const ofertasEnFecha = ofertasDia.filter(o => {
      if (o.clienteId !== clienteId) return false;
      const ofertaDate = new Date(o.fecha);
      const targetDate = new Date(fecha);
      ofertaDate.setHours(0, 0, 0, 0);
      targetDate.setHours(0, 0, 0, 0);
      return ofertaDate.getTime() === targetDate.getTime();
    });
    return ofertasEnFecha.length < 2;
  }, [ofertasDia]);

  return useMemo(() => ({
    comercios,
    ofertas,
    ofertasDia,
    saveComercio,
    getComercio,
    saveOferta,
    deleteOferta,
    getOfertasByComercio,
    getOfertasActivas,
    getNextClienteNumber,
    getNextComercioNumber,
    saveOfertaDia,
    getOfertasDiaByCliente,
    getOfertasDiaActivas,
    canClienteAddOfertaDia,
    limpiarOfertasExpiradas,
  }), [comercios, ofertas, ofertasDia, saveComercio, getComercio, saveOferta, deleteOferta, getOfertasByComercio, getOfertasActivas, getNextClienteNumber, getNextComercioNumber, saveOfertaDia, getOfertasDiaByCliente, getOfertasDiaActivas, canClienteAddOfertaDia, limpiarOfertasExpiradas]);
});
