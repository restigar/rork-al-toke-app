import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Calendar, DollarSign, Trash2, Edit2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useBusiness } from '../../context/BusinessContext';

export default function OfertasActivas() {
  const router = useRouter();
  const { user } = useAuth();
  const { getOfertasByComercio, deleteOferta } = useBusiness();
  const ofertas = getOfertasByComercio(user?.id || '');

  const isOfertaActiva = (oferta: any) => {
    const now = new Date();
    const inicioDate = new Date(oferta.vigenciaInicio);
    const finDate = new Date(oferta.vigenciaFin);
    
    console.log('🔍 Verificando oferta:', oferta.titulo);
    console.log('⏰ Ahora:', now.toLocaleString('es-AR'));
    console.log('📅 Inicio:', inicioDate.toLocaleString('es-AR'));
    console.log('📅 Fin:', finDate.toLocaleString('es-AR'));
    console.log('✅ Activa:', now >= inicioDate && now <= finDate);
    
    return now >= inicioDate && now <= finDate;
  };

  const ofertasActivas = ofertas.filter(isOfertaActiva);
  const ofertasExpiradas = ofertas.filter(o => !isOfertaActiva(o));

  const handleEdit = (oferta: any) => {
    router.push({
      pathname: '/comercio/cargar-oferta',
      params: { 
        editMode: 'true',
        ofertaId: oferta.id,
        titulo: oferta.titulo,
        descripcion: oferta.descripcion,
        precio: oferta.precio.toString(),
        vigenciaInicio: oferta.vigenciaInicio,
        vigenciaFin: oferta.vigenciaFin,
        imagenUrl: oferta.imagenUrl || '',
      }
    });
  };

  const handleDelete = (ofertaId: string) => {
    Alert.alert(
      'Eliminar Oferta',
      '¿Estás seguro de que deseas eliminar esta oferta?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteOferta(ofertaId);
            Alert.alert('Éxito', 'Oferta eliminada correctamente');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ofertas Activas</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{ofertasActivas.length}</Text>
            </View>
          </View>

          {ofertasActivas.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No hay ofertas activas</Text>
            </View>
          ) : (
            ofertasActivas.map((oferta) => (
              <View key={oferta.id} style={[styles.ofertaCard, styles.activeCard]}>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>ACTIVA</Text>
                </View>
                
                <Text style={styles.ofertaTitulo}>{oferta.titulo}</Text>
                <Text style={styles.ofertaDescripcion}>{oferta.descripcion}</Text>
                
                <View style={styles.ofertaFooter}>
                  <View style={styles.priceContainer}>
                    <DollarSign size={20} color="#059669" />
                    <Text style={styles.ofertaPrecio}>${oferta.precio}</Text>
                  </View>
                  
                  <View style={styles.dateContainer}>
                    <Calendar size={16} color="#6b7280" />
                    <Text style={styles.dateText}>
                      {new Date(oferta.vigenciaInicio).toLocaleDateString('es-AR')} - {new Date(oferta.vigenciaFin).toLocaleDateString('es-AR')}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => handleEdit(oferta)}
                  >
                    <Edit2 size={18} color="#2563eb" />
                    <Text style={styles.editText}>Editar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDelete(oferta.id)}
                  >
                    <Trash2 size={18} color="#dc2626" />
                    <Text style={styles.deleteText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {ofertasExpiradas.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: '#9ca3af' }]}>
                Ofertas Expiradas
              </Text>
              <View style={[styles.badge, { backgroundColor: '#f3f4f6' }]}>
                <Text style={[styles.badgeText, { color: '#6b7280' }]}>
                  {ofertasExpiradas.length}
                </Text>
              </View>
            </View>

            {ofertasExpiradas.map((oferta) => (
              <View key={oferta.id} style={[styles.ofertaCard, styles.expiredCard]}>
                <View style={[styles.statusBadge, { backgroundColor: '#f3f4f6' }]}>
                  <Text style={[styles.statusText, { color: '#6b7280' }]}>EXPIRADA</Text>
                </View>
                
                <Text style={[styles.ofertaTitulo, { color: '#9ca3af' }]}>{oferta.titulo}</Text>
                <Text style={[styles.ofertaDescripcion, { color: '#d1d5db' }]}>
                  {oferta.descripcion}
                </Text>
                
                <View style={styles.ofertaFooter}>
                  <View style={styles.priceContainer}>
                    <DollarSign size={20} color="#9ca3af" />
                    <Text style={[styles.ofertaPrecio, { color: '#9ca3af' }]}>
                      ${oferta.precio}
                    </Text>
                  </View>
                  
                  <View style={styles.dateContainer}>
                    <Calendar size={16} color="#9ca3af" />
                    <Text style={[styles.dateText, { color: '#9ca3af' }]}>
                      Expiró {new Date(oferta.vigenciaFin).toLocaleDateString('es-AR')}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    color: '#111',
  },
  badge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: '#2563eb',
  },
  empty: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  ofertaCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  expiredCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#e5e7eb',
    opacity: 0.7,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold' as const,
    color: '#059669',
    letterSpacing: 0.5,
  },
  ofertaTitulo: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#111',
    marginBottom: 8,
  },
  ofertaDescripcion: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 24,
  },
  ofertaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ofertaPrecio: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#059669',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#6b7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563eb',
    gap: 6,
  },
  editText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dc2626',
    gap: 6,
  },
  deleteText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
