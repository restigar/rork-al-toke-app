import React, { useState, useEffect } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Href } from 'expo-router';
import { ArrowLeft, SlidersHorizontal, MapPin, Navigation, Clock, Store } from 'lucide-react-native';
import * as Location from 'expo-location';
import { useBusiness } from '../../context/BusinessContext';
import { generateText } from '@rork-ai/toolkit-sdk';
import type { Oferta, Comercio } from '../../types';

interface OfertaConDistancia extends Oferta {
  comercio?: Comercio;
  distancia?: number;
  estaAbierto?: boolean;
  estaDeTurno?: boolean;
}

type OrdenType = 'distancia' | 'precio' | 'relevancia';
type FiltroType = 'todos' | 'abiertos' | 'farmacias';

export default function BuscarOfertas() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const searchQuery = (params.q as string) || '';
  
  const { comercios, getOfertasActivas } = useBusiness();
  
  const [resultados, setResultados] = useState<OfertaConDistancia[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [orden, setOrden] = useState<OrdenType>('relevancia');
  const [filtro, setFiltro] = useState<FiltroType>('todos');
  const [showOrdenMenu, setShowOrdenMenu] = useState<boolean>(false);
  const [showFiltroMenu, setShowFiltroMenu] = useState<boolean>(false);

  useEffect(() => {
    loadUserLocation();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      buscarConIA();
    }
  }, [searchQuery, userLocation]);

  useEffect(() => {
    ordenarYFiltrarResultados();
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

  const buscarConIA = async () => {
    try {
      setIsLoading(true);
      console.log('Buscando con IA:', searchQuery);

      const ofertasActivas = getOfertasActivas();
      
      const prompt = `Analiza la siguiente búsqueda del usuario: "${searchQuery}"

Las ofertas disponibles son:
${ofertasActivas.map((o, i) => `${i + 1}. ${o.titulo} - ${o.descripcion} (Comercio: ${o.comercioNombre}, Precio: $${o.precio})`).join('\n')}

Devuelve SOLO los números de las ofertas que coincidan semánticamente con la búsqueda. 
Por ejemplo, si busca "pan", incluye ofertas de panadería, facturas, medialunas, etc.
Si busca "medicina", incluye ofertas de farmacias y medicamentos.
Si busca "comida", incluye ofertas de restaurantes, pizzas, empanadas, etc.

Responde SOLO con los números separados por comas (ej: 1,3,5) o "ninguna" si no hay coincidencias.`;

      const respuesta = await generateText(prompt);
      console.log('Respuesta IA:', respuesta);

      let ofertasSeleccionadas: OfertaConDistancia[] = [];

      if (respuesta.toLowerCase().includes('ninguna')) {
        ofertasSeleccionadas = [];
      } else {
        const indices = respuesta.match(/\d+/g)?.map(n => parseInt(n) - 1) || [];
        ofertasSeleccionadas = indices
          .filter(i => i >= 0 && i < ofertasActivas.length)
          .map(i => ofertasActivas[i]);
      }

      const ofertasConDatos = ofertasSeleccionadas.map(oferta => {
        const comercio = comercios.find(c => c.id === oferta.comercioId);
        let distancia: number | undefined;

        if (comercio?.ubicacion && userLocation) {
          distancia = calcularDistancia(
            userLocation.coords.latitude,
            userLocation.coords.longitude,
            comercio.ubicacion.latitud,
            comercio.ubicacion.longitud
          );
        }

        return {
          ...oferta,
          comercio,
          distancia,
          estaAbierto: comercio ? estaAbierto(comercio) : undefined,
          estaDeTurno: comercio?.estaDeTurno,
        };
      });

      setResultados(ofertasConDatos);
      setIsLoading(false);
    } catch (error) {
      console.error('Error en búsqueda con IA:', error);
      setIsLoading(false);
    }
  };

  const ordenarYFiltrarResultados = () => {
    let filtrados = [...resultados];

    if (filtro === 'abiertos') {
      filtrados = filtrados.filter(o => o.estaAbierto === true);
    } else if (filtro === 'farmacias') {
      filtrados = filtrados.filter(o => o.comercio?.rubro?.toLowerCase().includes('farmacia'));
    }

    filtrados.sort((a, b) => {
      if (orden === 'distancia' && a.distancia !== undefined && b.distancia !== undefined) {
        return a.distancia - b.distancia;
      } else if (orden === 'precio') {
        return a.precio - b.precio;
      }
      return 0;
    });

    setResultados(filtrados);
  };

  const abrirMapa = (oferta: OfertaConDistancia) => {
    if (!oferta.comercio?.ubicacion) return;

    const { latitud, longitud } = oferta.comercio.ubicacion;
    const url = Platform.select({
      ios: `maps:0,0?q=${latitud},${longitud}`,
      android: `geo:0,0?q=${latitud},${longitud}`,
      default: `https://www.google.com/maps/search/?api=1&query=${latitud},${longitud}`,
    });

    if (url) {
      Linking.openURL(url);
    }
  };

  const verMasOfertas = (comercioId: string) => {
    router.push(`/comercio/detalle?id=${comercioId}` as Href);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Resultados: &quot;{searchQuery}&quot;</Text>
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
            <TouchableOpacity 
              style={[styles.menuItem, orden === 'precio' && styles.menuItemActive]}
              onPress={() => { setOrden('precio'); setShowOrdenMenu(false); }}
            >
              <Text style={styles.menuItemText}>Menor precio</Text>
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
            <Text style={styles.loadingText}>Buscando ofertas inteligentemente...</Text>
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {resultados.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No se encontraron ofertas para &quot;{searchQuery}&quot;</Text>
              </View>
            ) : (
              <View style={styles.resultados}>
                {resultados.map((oferta, index) => (
                  <View key={oferta.id} style={styles.ofertaCard}>
                    {oferta.imagenUrl && (
                      <Image
                        source={{ uri: oferta.imagenUrl }}
                        style={styles.ofertaImagen}
                        resizeMode="cover"
                      />
                    )}
                    
                    <View style={styles.ofertaContent}>
                      <View style={styles.ofertaHeader}>
                        <Text style={styles.comercioNombre}>{oferta.comercioNombre}</Text>
                        {oferta.distancia !== undefined && (
                          <View style={styles.distanciaContainer}>
                            <MapPin size={14} color="#6b7280" />
                            <Text style={styles.distanciaText}>
                              {oferta.distancia < 1 
                                ? `${Math.round(oferta.distancia * 1000)}m`
                                : `${oferta.distancia.toFixed(1)}km`
                              }
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.ofertaTitulo}>{oferta.titulo}</Text>
                      <Text style={styles.ofertaDescripcion}>{oferta.descripcion}</Text>
                      
                      <View style={styles.precioRow}>
                        <Text style={styles.ofertaPrecio}>${oferta.precio}</Text>
                        
                        <View style={styles.estadoContainer}>
                          {oferta.estaAbierto !== undefined && (
                            <View style={[styles.estadoBadge, oferta.estaAbierto ? styles.abiertoChip : styles.cerradoChip]}>
                              <Clock size={14} color={oferta.estaAbierto ? '#059669' : '#dc2626'} />
                              <Text style={[styles.estadoText, oferta.estaAbierto ? styles.abiertoText : styles.cerradoText]}>
                                {oferta.estaAbierto ? 'Abierto' : 'Cerrado'}
                              </Text>
                            </View>
                          )}
                          
                          {oferta.comercio?.rubro?.toLowerCase().includes('farmacia') && oferta.estaDeTurno && (
                            <View style={styles.turnoChip}>
                              <Text style={styles.turnoText}>De turno</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={styles.botonesRow}>
                        <TouchableOpacity 
                          style={styles.botonSecundario}
                          onPress={() => verMasOfertas(oferta.comercioId)}
                        >
                          <Store size={18} color="#9dd9c1" />
                          <Text style={styles.botonSecundarioText}>Más ofertas</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={styles.botonPrimario}
                          onPress={() => abrirMapa(oferta)}
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
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  safeArea: {
    flex: 1,
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
  ofertaCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ofertaImagen: {
    width: '100%',
    height: 200,
  },
  ofertaContent: {
    padding: 16,
  },
  ofertaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  comercioNombre: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6b7280',
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
  ofertaTitulo: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#111',
    marginBottom: 6,
  },
  ofertaDescripcion: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  precioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ofertaPrecio: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: '#059669',
  },
  estadoContainer: {
    flexDirection: 'row',
    gap: 8,
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
    gap: 12,
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
