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
import { useRouter } from 'expo-router';
import { Tag, Calendar, DollarSign, FileText, ImageIcon, ArrowLeft, MapPin, Navigation, Phone } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import { useBusiness } from '../../context/BusinessContext';
import type { OfertaDelDia } from '../../types';

export default function CargarOfertaDia() {
  const router = useRouter();
  const { user } = useAuth();
  const { saveOfertaDia, canClienteAddOfertaDia } = useBusiness();

  const [titulo, setTitulo] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [precio, setPrecio] = useState<string>('');
  const [fecha, setFecha] = useState<Date>(new Date());
  const [imagenUrl, setImagenUrl] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [direccion, setDireccion] = useState<string>('');
  const [numeroContacto, setNumeroContacto] = useState<string>('');
  const [ubicacion, setUbicacion] = useState<{ latitud: number; longitud: number; ciudad: string } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState<boolean>(false);

  const handlePublicar = async () => {
    if (!titulo || !descripcion || !precio) {
      Alert.alert('Error', 'Por favor complete todos los campos');
      return;
    }

    const precioNumero = parseFloat(precio);
    if (isNaN(precioNumero)) {
      Alert.alert('Error', 'El precio debe ser un número válido');
      return;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaSeleccionada = new Date(fecha);
    fechaSeleccionada.setHours(0, 0, 0, 0);

    if (fechaSeleccionada < hoy) {
      Alert.alert('Error', 'La fecha no puede ser anterior a hoy');
      return;
    }

    const fechaStr = fecha.toISOString().split('T')[0];
    if (!canClienteAddOfertaDia(user?.id || '', fechaStr)) {
      Alert.alert(
        'Límite alcanzado',
        'Ya has publicado 2 ofertas para esta fecha. Solo puedes publicar 2 ofertas por día.'
      );
      return;
    }

    const nuevaOferta: OfertaDelDia = {
      id: Date.now().toString(),
      clienteId: user?.id || '',
      clienteNombre: user?.name || '',
      titulo,
      descripcion,
      precio: precioNumero,
      fecha: fecha.toISOString(),
      imagenUrl,
      direccion: direccion || undefined,
      numeroContacto: numeroContacto || undefined,
      ubicacion: ubicacion || undefined,
    };

    await saveOfertaDia(nuevaOferta);
    
    Alert.alert('Éxito', 'Oferta del día publicada correctamente', [
      { text: 'OK', onPress: () => router.back() },
    ]);
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
      setImagenUrl(result.assets[0].uri);
    }
  };

  const onChangeFecha = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setFecha(selectedDate);
      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
    }
  };

  const formatearFecha = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleGetLocation = async () => {
    try {
      setLoadingLocation(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tu ubicación para cargar la dirección automáticamente');
        setLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocode) {
        const addressParts = [
          geocode.street,
          geocode.streetNumber,
          geocode.city,
          geocode.region,
        ].filter(Boolean);
        const fullAddress = addressParts.join(', ');
        
        setDireccion(fullAddress);
        setUbicacion({
          latitud: location.coords.latitude,
          longitud: location.coords.longitude,
          ciudad: geocode.city || geocode.region || 'Sin ciudad',
        });
      }
    } catch (error) {
      console.error('Error al obtener ubicación:', error);
      Alert.alert('Error', 'No se pudo obtener la ubicación');
    } finally {
      setLoadingLocation(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#9dd9c1" />
          </TouchableOpacity>
          <View style={styles.headerTextContent}>
            <Tag size={32} color="#9dd9c1" />
            <Text style={styles.title}>Nueva Oferta del Día</Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.note}>
            <Text style={styles.noteText}>
              💡 Solo puedes publicar 2 ofertas por fecha específica
            </Text>
          </View>

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

          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Calendar size={20} color="#374151" />
              <Text style={styles.label}>Fecha Específica</Text>
            </View>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>{formatearFecha(fecha)}</Text>
              <Calendar size={20} color="#9dd9c1" />
            </TouchableOpacity>
            {showDatePicker && (
              <View style={Platform.OS === 'ios' ? styles.iosDatePickerContainer : undefined}>
                <DateTimePicker
                  value={fecha}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onChangeFecha}
                  minimumDate={new Date()}
                  style={Platform.OS === 'ios' ? styles.iosDatePicker : undefined}
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={styles.iosDatePickerDone}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.iosDatePickerDoneText}>Listo</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            <Text style={styles.helperText}>
              Selecciona la fecha en la que quieres que aparezca tu oferta
            </Text>
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <ImageIcon size={20} color="#374151" />
              <Text style={styles.label}>Foto de la Oferta</Text>
            </View>
            <TouchableOpacity style={styles.imagePickerButton} onPress={handlePickImage}>
              {imagenUrl ? (
                <Image source={{ uri: imagenUrl }} style={styles.imagePreview} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <ImageIcon size={40} color="#9ca3af" />
                  <Text style={styles.imagePlaceholderText}>Seleccionar imagen</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <MapPin size={20} color="#374151" />
              <Text style={styles.label}>Dirección</Text>
            </View>
            <TextInput
              style={styles.input}
              value={direccion}
              onChangeText={setDireccion}
              placeholder="Escribe la dirección manualmente o usa tu ubicación"
              placeholderTextColor="#9ca3af"
              multiline
            />
            <TouchableOpacity
              style={styles.locationButton}
              onPress={handleGetLocation}
              disabled={loadingLocation}
            >
              {loadingLocation ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Navigation size={20} color="#fff" />
                  <Text style={styles.locationButtonText}>Usar mi ubicación actual</Text>
                </>
              )}
            </TouchableOpacity>
            {ubicacion && (
              <Text style={styles.helperText}>
                📍 Ubicación guardada: {ubicacion.ciudad}
              </Text>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Phone size={20} color="#374151" />
              <Text style={styles.label}>Número de Contacto (WhatsApp)</Text>
            </View>
            <TextInput
              style={styles.input}
              value={numeroContacto}
              onChangeText={setNumeroContacto}
              placeholder="Ej: 5491112345678"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
            />
            <Text style={styles.helperText}>
              Ingresa tu número con código de país sin el símbolo +
            </Text>
          </View>

          <View style={styles.note}>
            <Text style={styles.noteText}>
              ℹ️ Las ofertas del día aparecerán en la sección &quot;Ofertas del Día&quot; solo en la fecha seleccionada
            </Text>
          </View>

          <TouchableOpacity
            style={styles.publishButton}
            onPress={handlePublicar}
          >
            <Text style={styles.publishButtonText}>Publicar Oferta del Día</Text>
          </TouchableOpacity>
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
  helperText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic' as const,
  },
  note: {
    backgroundColor: '#dbeafe',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  noteText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  publishButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#9dd9c1',
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
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#f9fafb',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#111',
    fontWeight: '500' as const,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#9dd9c1',
  },
  locationButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  iosDatePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  iosDatePicker: {
    height: 180,
  },
  iosDatePickerDone: {
    backgroundColor: '#9dd9c1',
    padding: 12,
    alignItems: 'center',
  },
  iosDatePickerDoneText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
