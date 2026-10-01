import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Calendar, DollarSign, Trash2, Edit2, List } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useBusiness } from '../../context/BusinessContext';
import type { Oferta } from '../../types';

interface GrupoConfig {
  texto: string;
  cardEstilo: object;
  badgeEstilo: object;
  badgeTextoEstilo: object;
}

export default function OfertasActivas() {
  const router = useRouter();
  const { user } = useAuth();
  const { getOfertasByComercio, deleteOferta } = useBusiness();
  const ofertas = getOfertasByComercio(user?.id || '');

  const ahora = new Date();
  const activas: Oferta[] = [];
  const proximas: Oferta[] = [];
  const finalizadas: Oferta[] = [];

  for (const oferta of ofertas) {
    const inicio = new Date(oferta.vigenciaInicio);
    const fin = new Date(oferta.vigenciaFin);
    if (ahora < inicio) {
      proximas.push(oferta);
    } else if (ahora > fin) {
      finalizadas.push(oferta);
    } else {
      activas.push(oferta);
    }
  }

  const handleEdit = (oferta: Oferta) => {
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

  const renderOferta = (oferta: Oferta, config: GrupoConfig) => (
    <View key={oferta.id} style={[styles.ofertaCard, config.cardEstilo]}>
      <View style={[styles.statusBadge, config.badgeEstilo]}>
        <Text style={[styles.statusText, config.badgeTextoEstilo]}>{config.texto}</Text>
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
  );

  const renderGrupo = (titulo: string, lista: Oferta[], config: GrupoConfig) => {
    if (lista.length === 0) return null;
    return (
      <View>
        <Text style={styles.groupTitle}>{titulo} ({lista.length})</Text>
        {lista.map((oferta) => renderOferta(oferta, config))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <List size={24} color="#f59e0b" />
            <Text style={styles.sectionTitle}>Mis Ofertas</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{ofertas.length}</Text>
            </View>
          </View>

          {ofertas.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Todavía no cargaste ninguna oferta</Text>
              <Text style={styles.emptySubtext}>Usá el botón &quot;Cargar Ofertas&quot; para publicar la primera</Text>
            </View>
          ) : (
            <>
              {renderGrupo('Activas ahora', activas, CONFIG_ACTIVA)}
              {renderGrupo('Próximas', proximas, CONFIG_PROXIMA)}
              {renderGrupo('Finalizadas', finalizadas, CONFIG_FINALIZADA)}
            </>
          )}
        </View>
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
  groupTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 12,
    marginTop: 4,
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
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#c4c9d0',
    textAlign: 'center',
    marginTop: 8,
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
  proximaCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  expiredCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#e5e7eb',
    opacity: 0.7,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  statusBadgeActiva: {
    backgroundColor: '#dcfce7',
  },
  statusBadgeProxima: {
    backgroundColor: '#dbeafe',
  },
  statusBadgeFinalizada: {
    backgroundColor: '#f3f4f6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold' as const,
    letterSpacing: 0.5,
  },
  statusTextActiva: {
    color: '#059669',
  },
  statusTextProxima: {
    color: '#2563eb',
  },
  statusTextFinalizada: {
    color: '#9ca3af',
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

const CONFIG_ACTIVA: GrupoConfig = {
  texto: 'ACTIVA',
  cardEstilo: styles.activeCard,
  badgeEstilo: styles.statusBadgeActiva,
  badgeTextoEstilo: styles.statusTextActiva,
};

const CONFIG_PROXIMA: GrupoConfig = {
  texto: 'PRÓXIMA',
  cardEstilo: styles.proximaCard,
  badgeEstilo: styles.statusBadgeProxima,
  badgeTextoEstilo: styles.statusTextProxima,
};

const CONFIG_FINALIZADA: GrupoConfig = {
  texto: 'FINALIZADA',
  cardEstilo: styles.expiredCard,
  badgeEstilo: styles.statusBadgeFinalizada,
  badgeTextoEstilo: styles.statusTextFinalizada,
};
