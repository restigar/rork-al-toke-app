import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Comercio, Oferta, OfertaDelDia } from '../types';

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
    } catch (error) {
      console.error('Error loading business data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
  }, [ofertas]);

  const deleteOferta = useCallback(async (ofertaId: string) => {
    const updated = ofertas.filter(o => o.id !== ofertaId);
    setOfertas(updated);
    await AsyncStorage.setItem(OFERTAS_KEY, JSON.stringify(updated));
  }, [ofertas]);

  const getOfertasByComercio = useCallback((comercioId: string): Oferta[] => {
    return ofertas.filter(o => o.comercioId === comercioId);
  }, [ofertas]);

  const getOfertasActivas = useCallback((): Oferta[] => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return ofertas.filter(o => {
      const inicioDate = new Date(o.vigenciaInicio);
      const inicio = new Date(inicioDate.getFullYear(), inicioDate.getMonth(), inicioDate.getDate());
      
      const finDate = new Date(o.vigenciaFin);
      const fin = new Date(finDate.getFullYear(), finDate.getMonth(), finDate.getDate());
      
      return todayStart >= inicio && todayStart <= fin;
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
    const updated = [...ofertasDia, oferta];
    setOfertasDia(updated);
    await AsyncStorage.setItem(OFERTAS_DIA_KEY, JSON.stringify(updated));
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
  }), [comercios, ofertas, ofertasDia, saveComercio, getComercio, saveOferta, deleteOferta, getOfertasByComercio, getOfertasActivas, getNextClienteNumber, getNextComercioNumber, saveOfertaDia, getOfertasDiaByCliente, getOfertasDiaActivas, canClienteAddOfertaDia]);
});
