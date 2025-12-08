import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, SlidersHorizontal, MapPin, Navigation, Clock, Store, MessageCircle, Map as MapIcon } from 'lucide-react-native';
import * as Location from 'expo-location';
import { useBusiness } from '../../context/BusinessContext';
import { generateText } from '@rork-ai/toolkit-sdk';
import type { Comercio } from '../../types';

interface ComercioConDistancia extends Comercio {
  distancia?: number;
  estaAbierto?: boolean;
}

type OrdenType = 'distancia' | 'relevancia';
type FiltroType = 'todos' | 'abiertos' | 'farmacias';

export default function BuscarComercios() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const searchQuery = (params.q as string) || '';
  const insets = useSafeAreaInsets();
  
  const { comercios } = useBusiness();
  
  const [resultados, setResultados] = useState<ComercioConDistancia[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [orden, setOrden] = useState<OrdenType>('relevancia');
  const [filtro, setFiltro] = useState<FiltroType>('todos');
  const [showOrdenMenu, setShowOrdenMenu] = useState<boolean>(false);
  const [showFiltroMenu, setShowFiltroMenu] = useState<boolean>(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      loadUserLocation();
    }
  }, []);

  useEffect(() => {
    if (searchQuery) {
      buscarConIA();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, userLocation]);

  useEffect(() => {
    ordenarYFiltrarResultados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orden, filtro]);

  const loadUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location);
        console.log('Ubicación del usuario:', location.coords);
      }
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
    }
  };

  const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const estaAbierto = (comercio: Comercio): boolean => {
    if (!comercio.horarios || comercio.horarios.length === 0) return true;

    const now = new Date();
    const diaNombre = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][now.getDay()];
    const horarioHoy = comercio.horarios.find(h => h.dia === diaNombre);

    if (!horarioHoy || !horarioHoy.abierto) return false;

    const horaActual = now.getHours() * 60 + now.getMinutes();

    const parseHora = (hora: string): number => {
      const [h, m] = hora.split(':').map(Number);
      return h * 60 + m;
    };

    if (horarioHoy.horarioCorrido && horarioHoy.manana) {
      const inicio = parseHora(horarioHoy.manana.inicio);
      const fin = parseHora(horarioHoy.manana.fin);
      return horaActual >= inicio && horaActual <= fin;
    }

    if (horarioHoy.manana) {
      const inicio = parseHora(horarioHoy.manana.inicio);
      const fin = parseHora(horarioHoy.manana.fin);
      if (horaActual >= inicio && horaActual <= fin) return true;
    }

    if (horarioHoy.tarde) {
      const inicio = parseHora(horarioHoy.tarde.inicio);
      const fin = parseHora(horarioHoy.tarde.fin);
      if (horaActual >= inicio && horaActual <= fin) return true;
    }

    return false;
  };

  const buscarConIA = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Buscando comercios con IA:', searchQuery);

      const prompt = `Analiza la siguiente búsqueda del usuario: "${searchQuery}"

Los comercios disponibles son:
${comercios.map((c, i) => `${i + 1}. ${c.nombre} - ${c.rubro} (${c.subRubro || ''})`).join('\n')}

Devuelve SOLO los números de los comercios que coincidan semánticamente con la búsqueda. 
Por ejemplo, si busca "farmacia", incluye farmacias.
Si busca "comida", incluye restaurantes, pizzerías, panaderías, etc.
Si busca "ropa", incluye tiendas de ropa, boutiques, etc.

Responde SOLO con los números separados por comas (ej: 1,3,5) o "ninguno" si no hay coincidencias.`;

      const respuesta = await generateText(prompt);
      console.log('Respuesta IA:', respuesta);

      let comerciosSeleccionados: ComercioConDistancia[] = [];

      if (respuesta.toLowerCase().includes('ninguno')) {
        comerciosSeleccionados = [];
      } else {
        const indices = respuesta.match(/\d+/g)?.map(n => parseInt(n) - 1) || [];
        comerciosSeleccionados = indices
          .filter(i => i >= 0 && i < comercios.length)
          .map(i => comercios[i]);
      }

      const comerciosConDatos = comerciosSeleccionados.map(comercio => {
        let distancia: number | undefined;

        if (comercio.ubicacion && userLocation) {
          distancia = calcularDistancia(
            userLocation.coords.latitude,
            userLocation.coords.longitude,
            comercio.ubicacion.latitud,
            comercio.ubicacion.longitud
          );
        }

        return {
          ...comercio,
          distancia,
          estaAbierto: estaAbierto(comercio),
        };
      });

      setResultados(comerciosConDatos);
      setIsLoading(false);
    } catch (error) {
      console.error('Error en búsqueda con IA:', error);
      setIsLoading(false);
    }
  }, [searchQuery, comercios, userLocation]);

  const ordenarYFiltrarResultados = useCallback(() => {
    setResultados((prevResultados) => {
      let filtrados = [...prevResultados];

      if (filtro === 'abiertos') {
        filtrados = filtrados.filter(c => c.estaAbierto === true);
      } else if (filtro === 'farmacias') {
        filtrados = filtrados.filter(c => c.rubro?.toLowerCase().includes('farmacia'));
      }

      filtrados.sort((a, b) => {
        if (orden === 'distancia' && a.distancia !== undefined && b.distancia !== undefined) {
          return a.distancia - b.distancia;
        }
        return 0;
      });

      return filtrados;
    });
  }, [orden, filtro]);

  const abrirMapa = (comercio: ComercioConDistancia) => {
    if (!comercio.ubicacion) return;

    const { latitud, longitud } = comercio.ubicacion;
    const url = `https://www.google.com/maps/search/?api=1&query=${latitud},${longitud}`;
    Linking.openURL(url);
  };

  const abrirMapaTodosLosComerciosTodos = () => {
    console.log('🗺️ Intentando abrir mapa con todos los comercios');
    console.log('📊 Total de resultados:', resultados.length);
    
    if (resultados.length === 0) {
      console.log('❌ No hay resultados para mostrar en el mapa');
      return;
    }

    const comerciosConUbicacion = resultados.filter(c => c.ubicacion);
    console.log('📍 Comercios con ubicación:', comerciosConUbicacion.length);
    
    if (comerciosConUbicacion.length === 0) {
      console.log('❌ No hay comercios con ubicación válida');
      return;
    }

    if (comerciosConUbicacion.length === 1) {
      const comercio = comerciosConUbicacion[0];
      const { latitud, longitud } = comercio.ubicacion!;
      const nombreEncoded = encodeURIComponent(comercio.nombre);
      const url = `https://www.google.com/maps/search/?api=1&query=${nombreEncoded}+${latitud},${longitud}`;
      console.log('✅ Abriendo mapa con 1 comercio:', comercio.nombre);
      Linking.openURL(url);
      return;
    }

    const centerLat = comerciosConUbicacion.reduce((sum, c) => sum + c.ubicacion!.latitud, 0) / comerciosConUbicacion.length;
    const centerLng = comerciosConUbicacion.reduce((sum, c) => sum + c.ubicacion!.longitud, 0) / comerciosConUbicacion.length;

    const markers = comerciosConUbicacion
      .map((c) => {
        const nombreEncoded = encodeURIComponent(c.nombre.substring(0, 20));
        return `&markers=color:red%7Clabel:${nombreEncoded}%7C${c.ubicacion!.latitud},${c.ubicacion!.longitud}`;
      })
      .join('');

    const url = `https://www.google.com/maps/search/?api=1&query=${centerLat},${centerLng}${markers}`;
    
    console.log('✅ Abriendo mapa con múltiples comercios:', comerciosConUbicacion.length);
    console.log('📍 Comercios en el mapa:', comerciosConUbicacion.map((c, i) => `${i + 1}. ${c.nombre}`).join(', '));
    console.log('🔗 URL del mapa:', url);
    
    Linking.openURL(url).catch(error => {
      console.error('❌ Error al abrir el mapa:', error);
    });
  };

  const abrirWhatsApp = (comercio: ComercioConDistancia) => {
    if (!comercio.telefono) return;

    const phoneNumber = comercio.telefono.replace(/[^\d]/g, '');
    const url = `https://wa.me/${phoneNumber}`;
    Linking.openURL(url);
  };

  const verOfertas = (comercioId: string) => {
    router.push(`/cliente/ofertas-comercio?id=${comercioId}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerWrapper}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Resultados: &quot;{searchQuery}&quot;</Text>
        </View>
      </View>

      <View style={styles.controls}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => setShowOrdenMenu(!showOrdenMenu)}
          >
            <SlidersHorizontal size={20} color="#6b7280" />
            <Text style={styles.controlButtonText}>Ordenar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => setShowFiltroMenu(!showFiltroMenu)}
          >
            <SlidersHorizontal size={20} color="#6b7280" />
            <Text style={styles.controlButtonText}>Filtrar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.controlButton}
            onPress={abrirMapaTodosLosComerciosTodos}
            disabled={resultados.length === 0}
          >
            <MapIcon size={20} color={resultados.length === 0 ? "#d1d5db" : "#6b7280"} />
            <Text style={[styles.controlButtonText, resultados.length === 0 && { color: '#d1d5db' }]}>Mapa</Text>
          </TouchableOpacity>
        </View>

        {showOrdenMenu && (
          <View style={styles.menu}>
            <TouchableOpacity 
              style={[styles.menuItem, orden === 'relevancia' && styles.menuItemActive]}
              onPress={() => { setOrden('relevancia'); setShowOrdenMenu(false); }}
            >
              <Text style={styles.menuItemText}>Relevancia</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.menuItem, orden === 'distancia' && styles.menuItemActive]}
              onPress={() => { setOrden('distancia'); setShowOrdenMenu(false); }}
            >
              <Text style={styles.menuItemText}>Más cercano</Text>
            </TouchableOpacity>
          </View>
        )}

        {showFiltroMenu && (
          <View style={styles.menu}>
            <TouchableOpacity 
              style={[styles.menuItem, filtro === 'todos' && styles.menuItemActive]}
              onPress={() => { setFiltro('todos'); setShowFiltroMenu(false); }}
            >
              <Text style={styles.menuItemText}>Todos</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.menuItem, filtro === 'abiertos' && styles.menuItemActive]}
              onPress={() => { setFiltro('abiertos'); setShowFiltroMenu(false); }}
            >
              <Text style={styles.menuItemText}>Solo abiertos</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.menuItem, filtro === 'farmacias' && styles.menuItemActive]}
              onPress={() => { setFiltro('farmacias'); setShowFiltroMenu(false); }}
            >
              <Text style={styles.menuItemText}>Farmacias</Text>
            </TouchableOpacity>
          </View>
        )}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#9dd9c1" />
            <Text style={styles.loadingText}>Buscando comercios inteligentemente...</Text>
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {resultados.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No se encontraron comercios para &quot;{searchQuery}&quot;</Text>
              </View>
            ) : (
              <View style={styles.resultados}>
                {resultados.map((comercio) => (
                  <View key={comercio.id} style={styles.comercioCard}>
                    {comercio.fotoPerfil && (
                      <Image
                        source={{ uri: comercio.fotoPerfil }}
                        style={styles.comercioImagen}
                        resizeMode="cover"
                      />
                    )}
                    
                    <View style={styles.comercioContent}>
                      <View style={styles.comercioHeader}>
                        <Text style={styles.comercioNombre}>{comercio.nombre}</Text>
                        {comercio.distancia !== undefined && (
                          <View style={styles.distanciaContainer}>
                            <MapPin size={14} color="#6b7280" />
                            <Text style={styles.distanciaText}>
                              {comercio.distancia < 1 
                                ? `${Math.round(comercio.distancia * 1000)}m`
                                : `${comercio.distancia.toFixed(1)}km`
                              }
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.comercioRubro}>{comercio.rubro}</Text>
                      {comercio.subRubro && (
                        <Text style={styles.comercioSubRubro}>{comercio.subRubro}</Text>
                      )}
                      
                      <View style={styles.estadoRow}>
                        {comercio.estaAbierto !== undefined && (
                          <View style={[styles.estadoBadge, comercio.estaAbierto ? styles.abiertoChip : styles.cerradoChip]}>
                            <Clock size={14} color={comercio.estaAbierto ? '#059669' : '#dc2626'} />
                            <Text style={[styles.estadoText, comercio.estaAbierto ? styles.abiertoText : styles.cerradoText]}>
                              {comercio.estaAbierto ? 'Abierto' : 'Cerrado'}
                            </Text>
                          </View>
                        )}
                        
                        {comercio.rubro?.toLowerCase().includes('farmacia') && comercio.estaDeTurno && (
                          <View style={styles.turnoChip}>
                            <Text style={styles.turnoText}>De turno</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.botonesRow}>
                        <TouchableOpacity 
                          style={styles.botonSecundario}
                          onPress={() => verOfertas(comercio.id)}
                        >
                          <Store size={18} color="#9dd9c1" />
                          <Text style={styles.botonSecundarioText}>Ofertas</Text>
                        </TouchableOpacity>

                        {comercio.telefono && (
                          <TouchableOpacity 
                            style={styles.botonWhatsApp}
                            onPress={() => abrirWhatsApp(comercio)}
                          >
                            <MessageCircle size={18} color="#25D366" />
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity 
                          style={styles.botonPrimario}
                          onPress={() => abrirMapa(comercio)}
                        >
                          <Navigation size={18} color="#fff" />
                          <Text style={styles.botonPrimarioText}>Cómo llegar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  headerWrapper: {
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#111',
    flex: 1,
  },
  controls: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#6b7280',
  },
  controlButtonActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#9dd9c1',
  },
  controlButtonTextActive: {
    color: '#9dd9c1',
  },
  controlButtonDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  controlButtonDisabledText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#d1d5db',
  },
  menu: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemActive: {
    backgroundColor: '#f0fdf4',
  },
  menuItemText: {
    fontSize: 16,
    color: '#111',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  resultados: {
    padding: 16,
    gap: 16,
  },
  comercioCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  comercioImagen: {
    width: '100%',
    height: 200,
  },
  comercioContent: {
    padding: 16,
  },
  comercioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  comercioNombre: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#111',
    flex: 1,
  },
  distanciaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanciaText: {
    fontSize: 14,
    color: '#6b7280',
  },
  comercioRubro: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6b7280',
    marginBottom: 4,
  },
  comercioSubRubro: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 12,
  },
  estadoRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  abiertoChip: {
    backgroundColor: '#d1fae5',
  },
  cerradoChip: {
    backgroundColor: '#fee2e2',
  },
  estadoText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  abiertoText: {
    color: '#059669',
  },
  cerradoText: {
    color: '#dc2626',
  },
  turnoChip: {
    backgroundColor: '#dbeafe',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  turnoText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#2563eb',
  },
  botonesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  botonSecundario: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#9dd9c1',
  },
  botonSecundarioText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#9dd9c1',
  },
  botonWhatsApp: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#25D366',
  },
  botonPrimario: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#9dd9c1',
  },
  botonPrimarioText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
