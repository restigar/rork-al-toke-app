import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, Navigation, Clock, MessageCircle, Store } from 'lucide-react-native';
import { useBusiness } from '../../context/BusinessContext';
import type { Comercio, Oferta } from '../../types';

export default function OfertasComercio() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const comercioId = params.id as string;
  
  const { comercios, getOfertasByComercio } = useBusiness();
  
  const [comercio, setComercio] = useState<Comercio | null>(null);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);

  useEffect(() => {
    const comercioData = comercios.find(c => c.id === comercioId);
    if (comercioData) {
      setComercio(comercioData);
      const ofertasData = getOfertasByComercio(comercioId);
      const ofertasActivas = ofertasData.filter(o => {
        const now = new Date();
        const inicio = new Date(o.vigenciaInicio);
        const fin = new Date(o.vigenciaFin);
        return now >= inicio && now <= fin;
      });
      setOfertas(ofertasActivas);
    }
  }, [comercioId, comercios, getOfertasByComercio]);

  const estaAbierto = (): boolean => {
    if (!comercio || !comercio.horarios || comercio.horarios.length === 0) return true;

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

  const abrirMapa = () => {
    if (!comercio?.ubicacion) return;

    const { latitud, longitud } = comercio.ubicacion;
    const url = Platform.select({
      ios: `maps:0,0?q=${latitud},${longitud}`,
      android: `geo:0,0?q=${latitud},${longitud}`,
      default: `https://www.google.com/maps/search/?api=1&query=${latitud},${longitud}`,
    });

    if (url) {
      Linking.openURL(url);
    }
  };

  const abrirWhatsApp = () => {
    if (!comercio?.telefono) return;

    const phoneNumber = comercio.telefono.replace(/[^\d]/g, '');
    const url = `https://wa.me/${phoneNumber}`;
    Linking.openURL(url);
  };

  if (!comercio) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#111" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Comercio no encontrado</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const isOpen = estaAbierto();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{comercio.nombre}</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.comercioInfo}>
            {comercio.fotoPerfil && (
              <Image
                source={{ uri: comercio.fotoPerfil }}
                style={styles.comercioImagen}
                resizeMode="cover"
              />
            )}
            
            <View style={styles.comercioHeader}>
              <View style={styles.comercioTitulo}>
                <Text style={styles.comercioNombre}>{comercio.nombre}</Text>
                <Text style={styles.comercioRubro}>{comercio.rubro}</Text>
              </View>
              
              <View style={styles.estadoContainer}>
                <View style={[styles.estadoBadge, isOpen ? styles.abiertoChip : styles.cerradoChip]}>
                  <Clock size={14} color={isOpen ? '#059669' : '#dc2626'} />
                  <Text style={[styles.estadoText, isOpen ? styles.abiertoText : styles.cerradoText]}>
                    {isOpen ? 'Abierto' : 'Cerrado'}
                  </Text>
                </View>
                
                {comercio.rubro?.toLowerCase().includes('farmacia') && comercio.estaDeTurno && (
                  <View style={styles.turnoChip}>
                    <Text style={styles.turnoText}>De turno</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.accionesRow}>
              <TouchableOpacity 
                style={styles.accionButton}
                onPress={abrirMapa}
              >
                <Navigation size={20} color="#fff" />
                <Text style={styles.accionButtonText}>Cómo llegar</Text>
              </TouchableOpacity>

              {comercio.telefono && (
                <TouchableOpacity 
                  style={styles.whatsappButton}
                  onPress={abrirWhatsApp}
                >
                  <MessageCircle size={20} color="#fff" />
                  <Text style={styles.accionButtonText}>WhatsApp</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.ofertasSection}>
            <View style={styles.ofertasHeader}>
              <Store size={22} color="#111" />
              <Text style={styles.ofertasTitle}>Ofertas disponibles</Text>
            </View>

            {ofertas.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Este comercio no tiene ofertas activas en este momento</Text>
              </View>
            ) : (
              <View style={styles.ofertasGrid}>
                {ofertas.map((oferta) => (
                  <View key={oferta.id} style={styles.ofertaCard}>
                    {oferta.imagenUrl && (
                      <Image
                        source={{ uri: oferta.imagenUrl }}
                        style={styles.ofertaImagen}
                        resizeMode="cover"
                      />
                    )}
                    
                    <View style={styles.ofertaContent}>
                      <Text style={styles.ofertaTitulo}>{oferta.titulo}</Text>
                      <Text style={styles.ofertaDescripcion} numberOfLines={2}>
                        {oferta.descripcion}
                      </Text>
                      <Text style={styles.ofertaPrecio}>${oferta.precio}</Text>
                      
                      <View style={styles.ofertaVigencia}>
                        <Text style={styles.vigenciaText}>
                          Vigencia: {new Date(oferta.vigenciaInicio).toLocaleDateString()} - {new Date(oferta.vigenciaFin).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
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
  content: {
    flex: 1,
  },
  comercioInfo: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  comercioImagen: {
    width: '100%',
    height: 250,
  },
  comercioHeader: {
    padding: 20,
  },
  comercioTitulo: {
    marginBottom: 12,
  },
  comercioNombre: {
    fontSize: 26,
    fontWeight: 'bold' as const,
    color: '#111',
    marginBottom: 6,
  },
  comercioRubro: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500' as const,
  },
  estadoContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  abiertoChip: {
    backgroundColor: '#d1fae5',
  },
  cerradoChip: {
    backgroundColor: '#fee2e2',
  },
  estadoText: {
    fontSize: 14,
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
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  turnoText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#2563eb',
  },
  accionesRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  accionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#9dd9c1',
  },
  whatsappButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#25D366',
  },
  accionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  ofertasSection: {
    padding: 16,
  },
  ofertasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  ofertasTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#111',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  ofertasGrid: {
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
    height: 180,
  },
  ofertaContent: {
    padding: 16,
  },
  ofertaTitulo: {
    fontSize: 18,
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
  ofertaPrecio: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#059669',
    marginBottom: 8,
  },
  ofertaVigencia: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  vigenciaText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
