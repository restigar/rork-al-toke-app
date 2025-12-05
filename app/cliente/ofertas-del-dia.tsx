import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Modal, ActivityIndicator, Linking, Platform } from 'react-native';
import { Calendar as CalendarIcon, X, ChevronLeft, ChevronRight, ArrowLeft, MapPin, MessageCircle, Navigation } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useBusiness } from '../../context/BusinessContext';
import type { OfertaDelDia } from '../../types';

export default function OfertasDelDia() {
  const router = useRouter();
  const { ofertasDia } = useBusiness();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [userCity, setUserCity] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          const [geocode] = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          if (geocode) {
            setUserCity(geocode.city || geocode.region || null);
          }
        }
      } catch (error) {
        console.error('Error al obtener ubicación:', error);
      } finally {
        setLoadingLocation(false);
      }
    })();
  }, []);

  const ofertasDelDia = useMemo(() => {
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    
    return ofertasDia.filter((oferta: OfertaDelDia) => {
      const ofertaDate = new Date(oferta.fecha);
      ofertaDate.setHours(0, 0, 0, 0);
      
      const isSameDate = ofertaDate.getTime() === selected.getTime();
      
      if (!isSameDate) return false;
      
      if (userCity && oferta.ubicacion) {
        return oferta.ubicacion.ciudad.toLowerCase().includes(userCity.toLowerCase()) ||
               userCity.toLowerCase().includes(oferta.ubicacion.ciudad.toLowerCase());
      }
      
      return true;
    });
  }, [selectedDate, ofertasDia, userCity]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(newDate);
    setShowCalendar(false);
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
    const days: (number | null)[] = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    const isSelectedDay = (day: number) => {
      return (
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === currentMonth.getMonth() &&
        selectedDate.getFullYear() === currentMonth.getFullYear()
      );
    };

    return (
      <View style={styles.calendar}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.monthButton}>
            <ChevronLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {currentMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={handleNextMonth} style={styles.monthButton}>
            <ChevronRight size={24} color="#374151" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.weekDays}>
          {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, i) => (
            <Text key={i} style={styles.weekDayText}>{day}</Text>
          ))}
        </View>
        
        <View style={styles.daysGrid}>
          {days.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                day === null && styles.emptyDayCell,
                day && isSelectedDay(day) && styles.selectedDayCell,
              ]}
              onPress={() => day && handleDateSelect(day)}
              disabled={day === null}
            >
              {day && (
                <Text style={[
                  styles.dayText,
                  isSelectedDay(day) && styles.selectedDayText,
                ]}>
                  {day}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#2563eb" />
          </TouchableOpacity>
          <CalendarIcon size={32} color="#2563eb" />
        </View>
        <Text style={styles.title}>Ofertas del Día</Text>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowCalendar(true)}
        >
          <Text style={styles.dateButtonText}>
            {selectedDate.toLocaleDateString('es-AR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <CalendarIcon size={18} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {loadingLocation ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Cargando ubicación...</Text>
          </View>
        ) : ofertasDelDia.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No hay ofertas para la fecha seleccionada</Text>
            {userCity && (
              <Text style={styles.emptySubtext}>en {userCity}</Text>
            )}
          </View>
        ) : (
          <>
            {userCity && (
              <View style={styles.locationInfo}>
                <MapPin size={16} color="#6b7280" />
                <Text style={styles.locationInfoText}>Mostrando ofertas en {userCity}</Text>
              </View>
            )}
            {ofertasDelDia.map((oferta: OfertaDelDia) => (
              <View key={oferta.id} style={styles.ofertaCard}>
                {oferta.imagenUrl && (
                  <Image
                    source={{ uri: oferta.imagenUrl }}
                    style={styles.ofertaImage}
                    resizeMode="cover"
                  />
                )}
                <View style={styles.ofertaContent}>
                  <Text style={styles.ofertaTitle}>{oferta.titulo}</Text>
                  <Text style={styles.ofertaDescription}>{oferta.descripcion}</Text>
                  <Text style={styles.ofertaPrice}>${oferta.precio}</Text>
                  <Text style={styles.ofertaCliente}>Publicado por: {oferta.clienteNombre}</Text>
                  {oferta.direccion && (
                    <View style={styles.direccionRow}>
                      <MapPin size={16} color="#6b7280" />
                      <Text style={styles.ofertaDireccion}>{oferta.direccion}</Text>
                    </View>
                  )}
                  <Text style={styles.ofertaFecha}>
                    Válida para: {new Date(oferta.fecha).toLocaleDateString('es-AR')}
                  </Text>
                  
                  <View style={styles.actionsRow}>
                    {oferta.numeroContacto && (
                      <TouchableOpacity
                        style={styles.whatsappButton}
                        onPress={() => {
                          const url = `https://wa.me/${oferta.numeroContacto}`;
                          Linking.openURL(url);
                        }}
                      >
                        <MessageCircle size={20} color="#fff" />
                        <Text style={styles.buttonText}>WhatsApp</Text>
                      </TouchableOpacity>
                    )}
                    {oferta.ubicacion && (
                      <TouchableOpacity
                        style={styles.directionsButton}
                        onPress={() => {
                          const { latitud, longitud } = oferta.ubicacion!;
                          const url = Platform.select({
                            ios: `maps:?q=${latitud},${longitud}`,
                            android: `geo:${latitud},${longitud}?q=${latitud},${longitud}`,
                            default: `https://www.google.com/maps/search/?api=1&query=${latitud},${longitud}`,
                          });
                          Linking.openURL(url!);
                        }}
                      >
                        <Navigation size={20} color="#fff" />
                        <Text style={styles.buttonText}>Cómo llegar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
      </View>

      <Modal
        visible={showCalendar}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Fecha</Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <X size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            {renderCalendar()}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: '#111',
    marginBottom: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#374151',
    textTransform: 'capitalize' as const,
  },
  content: {
    padding: 20,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  ofertaCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  ofertaImage: {
    width: '100%',
    height: 200,
    marginBottom: 16,
  },
  ofertaTitle: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    color: '#111',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  ofertaDescription: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  ofertaPrice: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: '#059669',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  ofertaComercio: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
    paddingHorizontal: 20,
  },
  ofertaVigencia: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic' as const,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#111',
  },
  calendar: {
    gap: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#374151',
    textTransform: 'capitalize' as const,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekDayText: {
    width: 40,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6b7280',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  emptyDayCell: {
    backgroundColor: 'transparent',
  },
  selectedDayCell: {
    backgroundColor: '#2563eb',
    borderRadius: 20,
  },
  dayText: {
    fontSize: 16,
    color: '#374151',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: 'bold' as const,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  locationInfoText: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '500' as const,
  },
  ofertaContent: {
    paddingBottom: 20,
  },
  ofertaCliente: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  direccionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  ofertaDireccion: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  ofertaFecha: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic' as const,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
  },
  whatsappButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#25D366',
  },
  directionsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#2563eb',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
