import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Tag, Calendar, DollarSign, FileText, ImageIcon, ArrowLeft } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { useBusiness } from '../../context/BusinessContext';
import type { Oferta, Comercio } from '../../types';
import { moderateImageContent } from '../../lib/content-moderation';

export default function CargarOferta() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { saveOferta, getComercio } = useBusiness();
  const comercio = getComercio(user?.id || '') as Comercio;

  const isEditMode = params.editMode === 'true';
  const ofertaId = params.ofertaId as string;

  const [titulo, setTitulo] = useState<string>((params.titulo as string) || '');
  const [descripcion, setDescripcion] = useState<string>((params.descripcion as string) || '');
  const [precio, setPrecio] = useState<string>((params.precio as string) || '');
  const [vigenciaInicio, setVigenciaInicio] = useState<Date | undefined>(
    params.vigenciaInicio ? new Date(params.vigenciaInicio as string) : undefined
  );
  const [vigenciaFin, setVigenciaFin] = useState<Date | undefined>(
    params.vigenciaFin ? new Date(params.vigenciaFin as string) : undefined
  );
  const [showDatePickerInicio, setShowDatePickerInicio] = useState<boolean>(false);
  const [showDatePickerFin, setShowDatePickerFin] = useState<boolean>(false);
  const [imagenUrl, setImagenUrl] = useState<string>((params.imagenUrl as string) || '');
  const [isModeratingImage, setIsModeratingImage] = useState<boolean>(false);

  const handlePublicar = async () => {
    if (!titulo || !descripcion || !precio || !vigenciaInicio || !vigenciaFin) {
      Alert.alert('Error', 'Por favor complete todos los campos');
      return;
    }

    const precioNumero = parseFloat(precio);
    if (isNaN(precioNumero)) {
      Alert.alert('Error', 'El precio debe ser un número válido');
      return;
    }

    const getHorarioForDate = (date: Date, isInicio: boolean) => {
      if (!comercio?.horarios || comercio.horarios.length === 0) {
        return isInicio ? '00:00' : '23:59';
      }

      const diaNombre = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][date.getDay()];
      const horarioDelDia = comercio.horarios.find(h => h.dia === diaNombre);

      if (!horarioDelDia || !horarioDelDia.abierto) {
        return isInicio ? '00:00' : '23:59';
      }

      if (isInicio) {
        return horarioDelDia.manana?.inicio || '00:00';
      } else {
        if (horarioDelDia.horarioCorrido) {
          return horarioDelDia.manana?.fin || '23:59';
        } else {
          return horarioDelDia.tarde?.fin || horarioDelDia.manana?.fin || '23:59';
        }
      }
    };

    const horarioInicio = getHorarioForDate(vigenciaInicio, true);
    const horarioFin = getHorarioForDate(vigenciaFin, false);

    console.log('📅 Configurando oferta con horarios:');
    console.log('Fecha inicio:', vigenciaInicio.toLocaleDateString('es-AR'));
    console.log('Horario inicio:', horarioInicio);
    console.log('Fecha fin:', vigenciaFin.toLocaleDateString('es-AR'));
    console.log('Horario fin:', horarioFin);

    const fechaInicioConHorario = new Date(vigenciaInicio.getFullYear(), vigenciaInicio.getMonth(), vigenciaInicio.getDate());
    const [horasInicio, minutosInicio] = horarioInicio.split(':').map(Number);
    fechaInicioConHorario.setHours(horasInicio, minutosInicio, 0, 0);

    const fechaFinConHorario = new Date(vigenciaFin.getFullYear(), vigenciaFin.getMonth(), vigenciaFin.getDate());
    const [horasFin, minutosFin] = horarioFin.split(':').map(Number);
    fechaFinConHorario.setHours(horasFin, minutosFin, 59, 999);

    const oferta: Oferta = {
      id: isEditMode ? ofertaId : Date.now().toString(),
      comercioId: user?.id || '',
      comercioNombre: comercio?.nombre || user?.name || '',
      titulo,
      descripcion,
      precio: precioNumero,
      vigenciaInicio: fechaInicioConHorario.toISOString(),
      vigenciaFin: fechaFinConHorario.toISOString(),
      imagenUrl,
    };

    console.log('✅ Oferta guardada:', oferta);
    console.log('ISO Inicio:', oferta.vigenciaInicio);
    console.log('ISO Fin:', oferta.vigenciaFin);
    console.log('🔍 Verificación inmediata:');
    console.log('Fecha actual:', new Date().toISOString());
    console.log('Es activa ahora?', new Date() >= new Date(oferta.vigenciaInicio) && new Date() <= new Date(oferta.vigenciaFin));

    await saveOferta(oferta);
    
    Alert.alert(
      'Éxito', 
      `${isEditMode ? 'Oferta actualizada' : 'Oferta publicada'} correctamente\n\nVigencia:\nDesde: ${fechaInicioConHorario.toLocaleString('es-AR')}\nHasta: ${fechaFinConHorario.toLocaleString('es-AR')}`,
      [
        { text: 'OK', onPress: () => router.back() },
      ]
    );
  };

  const handleChangeInicio = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePickerInicio(false);
    }
    if (selectedDate) {
      setVigenciaInicio(selectedDate);
      if (Platform.OS === 'ios') {
        setShowDatePickerInicio(false);
      }
    }
  };

  const handleChangeFin = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePickerFin(false);
    }
    if (selectedDate) {
      setVigenciaFin(selectedDate);
      if (Platform.OS === 'ios') {
        setShowDatePickerFin(false);
      }
    }
  };

  const formatDate = (date?: Date): string => {
    if (!date) return 'Seleccionar fecha';
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const handleGuardarBorrador = () => {
    Alert.alert('Función en desarrollo', 'Los borradores estarán disponibles próximamente');
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para seleccionar imágenes');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      
      setIsModeratingImage(true);
      const moderation = await moderateImageContent(imageUri);
      setIsModeratingImage(false);

      if (!moderation.isAppropriate) {
        Alert.alert(
          'Contenido no permitido',
          'La imagen seleccionada contiene contenido inapropiado y no puede ser utilizada. Por favor, selecciona una imagen diferente.',
          [{ text: 'Entendido' }]
        );
        return;
      }

      setImagenUrl(imageUri);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#1a2332" />
          </TouchableOpacity>
          <View style={styles.headerTextContent}>
            <Tag size={32} color="#1a2332" />
            <Text style={styles.title}>{isEditMode ? 'Editar' : 'Nueva'} Oferta / Promoción</Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <FileText size={20} color="#374151" />
              <Text style={styles.label}>Título de la Oferta</Text>
            </View>
            <TextInput
              style={styles.input}
              value={titulo}
              onChangeText={setTitulo}
              placeholder="Ej: 2x1 en pizzas grandes"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <FileText size={20} color="#374151" />
              <Text style={styles.label}>Descripción</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Describe los detalles de tu oferta..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <DollarSign size={20} color="#374151" />
              <Text style={styles.label}>Precio Promocional</Text>
            </View>
            <TextInput
              style={styles.input}
              value={precio}
              onChangeText={setPrecio}
              placeholder="1500"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.dateGroup}>
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Calendar size={20} color="#374151" />
                <Text style={styles.label}>Fecha de Inicio</Text>
              </View>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePickerInicio(true)}
              >
                <Text style={[styles.dateText, !vigenciaInicio && styles.placeholderText]}>
                  {formatDate(vigenciaInicio)}
                </Text>
                <Calendar size={20} color="#6b7280" />
              </TouchableOpacity>
              {showDatePickerInicio && Platform.OS === 'ios' && (
                <View style={styles.iosDatePickerContainer}>
                  <DateTimePicker
                    value={vigenciaInicio || new Date()}
                    mode="date"
                    display="spinner"
                    onChange={handleChangeInicio}
                    minimumDate={new Date()}
                    style={styles.iosDatePicker}
                  />
                  <TouchableOpacity
                    style={styles.iosDatePickerDone}
                    onPress={() => setShowDatePickerInicio(false)}
                  >
                    <Text style={styles.iosDatePickerDoneText}>Listo</Text>
                  </TouchableOpacity>
                </View>
              )}
              {showDatePickerInicio && Platform.OS === 'android' && (
                <DateTimePicker
                  value={vigenciaInicio || new Date()}
                  mode="date"
                  display="default"
                  onChange={handleChangeInicio}
                  minimumDate={new Date()}
                />
              )}
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Calendar size={20} color="#374151" />
                <Text style={styles.label}>Fecha de Fin</Text>
              </View>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePickerFin(true)}
              >
                <Text style={[styles.dateText, !vigenciaFin && styles.placeholderText]}>
                  {formatDate(vigenciaFin)}
                </Text>
                <Calendar size={20} color="#6b7280" />
              </TouchableOpacity>
              {showDatePickerFin && Platform.OS === 'ios' && (
                <View style={styles.iosDatePickerContainer}>
                  <DateTimePicker
                    value={vigenciaFin || vigenciaInicio || new Date()}
                    mode="date"
                    display="spinner"
                    onChange={handleChangeFin}
                    minimumDate={vigenciaInicio || new Date()}
                    style={styles.iosDatePicker}
                  />
                  <TouchableOpacity
                    style={styles.iosDatePickerDone}
                    onPress={() => setShowDatePickerFin(false)}
                  >
                    <Text style={styles.iosDatePickerDoneText}>Listo</Text>
                  </TouchableOpacity>
                </View>
              )}
              {showDatePickerFin && Platform.OS === 'android' && (
                <DateTimePicker
                  value={vigenciaFin || vigenciaInicio || new Date()}
                  mode="date"
                  display="default"
                  onChange={handleChangeFin}
                  minimumDate={vigenciaInicio || new Date()}
                />
              )}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <ImageIcon size={20} color="#374151" />
              <Text style={styles.label}>Foto de la Oferta</Text>
            </View>
            <TouchableOpacity 
              style={[styles.imagePickerButton, isModeratingImage && styles.buttonDisabled]} 
              onPress={handlePickImage}
              disabled={isModeratingImage}
            >
              {imagenUrl ? (
                <Image source={{ uri: imagenUrl }} style={styles.imagePreview} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  {isModeratingImage ? (
                    <>
                      <ActivityIndicator size="large" color="#1a2332" />
                      <Text style={styles.imagePlaceholderText}>Verificando imagen...</Text>
                    </>
                  ) : (
                    <>
                      <ImageIcon size={40} color="#9ca3af" />
                      <Text style={styles.imagePlaceholderText}>Seleccionar imagen</Text>
                    </>
                  )}
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.infoNote}>
            <Text style={styles.infoNoteTitle}>🕒 Vigencia de la Oferta</Text>
            <Text style={styles.infoNoteText}>
              La oferta iniciará en la fecha seleccionada al horario de apertura de tu comercio ese día, 
y finalizará en la fecha de fin al horario de cierre.
            </Text>
            <Text style={styles.infoNoteText}>
              💡 Las ofertas se mostrarán automáticamente a clientes que busquen en tu área durante este período.
            </Text>
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.draftButton}
              onPress={handleGuardarBorrador}
            >
              <Text style={styles.draftButtonText}>Guardar Borrador</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.publishButton}
              onPress={handlePublicar}
            >
              <Text style={styles.publishButtonText}>{isEditMode ? 'Actualizar' : 'Publicar'}</Text>
            </TouchableOpacity>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    marginRight: 12,
  },
  headerTextContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#111',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  dateGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  infoNote: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoNoteTitle: {
    fontSize: 15,
    fontWeight: 'bold' as const,
    color: '#1e40af',
    marginBottom: 8,
  },
  infoNoteText: {
    fontSize: 13,
    color: '#1e3a8a',
    lineHeight: 18,
    marginBottom: 6,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  draftButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  draftButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6b7280',
  },
  publishButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1a2332',
    alignItems: 'center',
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  imagePickerButton: {
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 12,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#f9fafb',
  },
  imagePlaceholderText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#f9fafb',
  },
  dateText: {
    fontSize: 16,
    color: '#111',
  },
  placeholderText: {
    color: '#9ca3af',
  },
  iosDatePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  iosDatePicker: {
    height: 200,
    width: '100%',
  },
  iosDatePickerDone: {
    backgroundColor: '#1a2332',
    padding: 12,
    alignItems: 'center',
  },
  iosDatePickerDoneText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
