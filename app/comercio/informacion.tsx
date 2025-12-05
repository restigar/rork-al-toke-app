import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { MapPin, Clock, Save, ImageIcon, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useBusiness } from '../../context/BusinessContext';
import type { Comercio, DiaHorario } from '../../types';
import { RUBROS_COMERCIO, RUBROS_SERVICIO, RUBROS_ORGANIZACION, DIAS_SEMANA } from '../../constants/businessData';

export default function InformacionComercio() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const { getComercio, saveComercio } = useBusiness();
  const comercio = getComercio(user?.id || '');

  const [nombre, setNombre] = useState<string>(comercio?.nombre || '');
  const [telefono, setTelefono] = useState<string>(comercio?.telefono || '');
  const [fotoPerfil, setFotoPerfil] = useState<string>(comercio?.fotoPerfil || '');
  const [tipo, setTipo] = useState<string>(comercio?.tipo || 'Comercio');
  const [rubro, setRubro] = useState<string>(comercio?.rubro || '');
  const [subRubro, setSubRubro] = useState<string>(comercio?.subRubro || '');
  const [facebook, setFacebook] = useState<string>(comercio?.facebook || '');
  const [instagram, setInstagram] = useState<string>(comercio?.instagram || '');
  const [website, setWebsite] = useState<string>(comercio?.website || '');
  const [calle, setCalle] = useState<string>(comercio?.ubicacion?.calle || '');
  const [ciudad, setCiudad] = useState<string>(comercio?.ubicacion?.ciudad || '');
  const [latitud, setLatitud] = useState<number | undefined>(comercio?.ubicacion?.latitud);
  const [longitud, setLongitud] = useState<number | undefined>(comercio?.ubicacion?.longitud);
  const [horarios, setHorarios] = useState<DiaHorario[]>(
    comercio?.horarios || DIAS_SEMANA.map(dia => ({
      dia,
      abierto: false,
      horarioCorrido: true,
      manana: { inicio: '09:00', fin: '13:00' },
      tarde: { inicio: '17:00', fin: '21:00' },
    }))
  );

  const getRubrosOptions = () => {
    switch (tipo) {
      case 'Comercio':
        return Object.keys(RUBROS_COMERCIO);
      case 'Servicio':
        return RUBROS_SERVICIO;
      case 'Organización Pública':
        return RUBROS_ORGANIZACION;
      default:
        return [];
    }
  };

  const getSubRubrosOptions = () => {
    if (tipo === 'Comercio' && rubro) {
      return (RUBROS_COMERCIO as any)[rubro] || [];
    }
    return [];
  };

  const obtenerUbicacion = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tu ubicación');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLatitud(location.coords.latitude);
      setLongitud(location.coords.longitude);

      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocode) {
        setCalle(`${geocode.street || ''} ${geocode.streetNumber || ''}`);
        setCiudad(geocode.city || geocode.region || '');
      }

      Alert.alert('Éxito', 'Ubicación obtenida correctamente');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo obtener la ubicación');
    }
  };

  const toggleDiaAbierto = (index: number) => {
    const newHorarios = [...horarios];
    newHorarios[index].abierto = !newHorarios[index].abierto;
    setHorarios(newHorarios);
  };

  const toggleHorarioCorrido = (index: number) => {
    const newHorarios = [...horarios];
    newHorarios[index].horarioCorrido = !newHorarios[index].horarioCorrido;
    setHorarios(newHorarios);
  };

  const formatTimeInput = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length === 0) return '';
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) return `${numbers.slice(0, 2)}:${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}:${numbers.slice(2, 4)}`;
  };

  const updateHorario = (index: number, field: 'manana' | 'tarde', subField: 'inicio' | 'fin', value: string) => {
    const formattedValue = formatTimeInput(value);
    const newHorarios = [...horarios];
    if (field === 'manana' && newHorarios[index].manana) {
      newHorarios[index].manana![subField] = formattedValue;
    } else if (field === 'tarde' && newHorarios[index].tarde) {
      newHorarios[index].tarde![subField] = formattedValue;
    }
    setHorarios(newHorarios);
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
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFotoPerfil(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!nombre || !tipo) {
      Alert.alert('Error', 'Por favor complete los campos obligatorios');
      return;
    }

    const updatedComercio: Comercio = {
      ...(comercio || {}),
      id: user?.id || Date.now().toString(),
      name: nombre,
      nombre,
      email: user?.email || '',
      type: 'comercio',
      numeroComercio: comercio?.numeroComercio || `COM-${Date.now().toString().slice(-8)}`,
      telefono,
      fotoPerfil,
      tipo: tipo as any,
      rubro,
      subRubro: tipo === 'Comercio' ? subRubro : rubro,
      facebook,
      instagram,
      website,
      ubicacion: latitud && longitud ? {
        latitud,
        longitud,
        calle,
        ciudad,
      } : undefined,
      horarios,
    };

    await saveComercio(updatedComercio);
    await updateUser({ name: nombre });
    Alert.alert('Éxito', 'Información guardada correctamente');
    router.push('/comercio/dashboard');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#1a2332" />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Información de Comercio</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos Básicos</Text>

          <Text style={styles.label}>Nombre del Comercio *</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Nombre de tu negocio"
            placeholderTextColor="#9ca3af"
          />

          <Text style={styles.label}>Logo del Comercio</Text>
          <TouchableOpacity style={styles.imagePickerButton} onPress={handlePickImage}>
            {fotoPerfil ? (
              <Image source={{ uri: fotoPerfil }} style={styles.logoPreview} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <ImageIcon size={40} color="#9ca3af" />
                <Text style={styles.logoPlaceholderText}>Seleccionar logo</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}
            value={telefono}
            onChangeText={setTelefono}
            placeholder="+54 11 1234-5678"
            placeholderTextColor="#9ca3af"
            keyboardType="phone-pad"
          />


        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo y Rubro</Text>

          <Text style={styles.label}>Tipo *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={tipo}
              onValueChange={(value) => {
                setTipo(value);
                setRubro('');
                setSubRubro('');
              }}
              style={styles.picker}
            >
              <Picker.Item label="Comercio" value="Comercio" />
              <Picker.Item label="Servicio" value="Servicio" />
              <Picker.Item label="Organización Pública" value="Organización Pública" />
            </Picker>
          </View>

          <Text style={styles.label}>Rubro *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={rubro}
              onValueChange={setRubro}
              style={styles.picker}
            >
              <Picker.Item label="Seleccionar..." value="" />
              {getRubrosOptions().map((r) => (
                <Picker.Item key={r} label={r} value={r} />
              ))}
            </Picker>
          </View>

          {tipo === 'Comercio' && rubro && (
            <>
              <Text style={styles.label}>Sub Rubro</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={subRubro}
                  onValueChange={setSubRubro}
                  style={styles.picker}
                >
                  <Picker.Item label="Seleccionar..." value="" />
                  {getSubRubrosOptions().map((sr: string) => (
                    <Picker.Item key={sr} label={sr} value={sr} />
                  ))}
                </Picker>
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Redes Sociales</Text>

          <Text style={styles.label}>Facebook</Text>
          <TextInput
            style={styles.input}
            value={facebook}
            onChangeText={setFacebook}
            placeholder="https://facebook.com/tu-negocio"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Instagram</Text>
          <TextInput
            style={styles.input}
            value={instagram}
            onChangeText={setInstagram}
            placeholder="@tu_negocio"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Sitio Web</Text>
          <TextInput
            style={styles.input}
            value={website}
            onChangeText={setWebsite}
            placeholder="https://tu-sitio.com"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ubicación</Text>

          <TouchableOpacity style={styles.locationButton} onPress={obtenerUbicacion}>
            <MapPin size={20} color="#fff" />
            <Text style={styles.locationButtonText}>Obtener ubicación actual</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Calle</Text>
          <TextInput
            style={styles.input}
            value={calle}
            onChangeText={setCalle}
            placeholder="Av. Principal 123"
            placeholderTextColor="#9ca3af"
          />

          <Text style={styles.label}>Ciudad</Text>
          <TextInput
            style={styles.input}
            value={ciudad}
            onChangeText={setCiudad}
            placeholder="Buenos Aires"
            placeholderTextColor="#9ca3af"
          />

          {latitud && longitud && (
            <Text style={styles.coordinates}>
              📍 {latitud.toFixed(6)}, {longitud.toFixed(6)}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={24} color="#374151" />
            <Text style={styles.sectionTitle}>Horarios de Atención</Text>
          </View>

          {horarios.map((horario, index) => (
            <View key={horario.dia} style={styles.horarioCard}>
              <View style={styles.horarioHeader}>
                <Text style={styles.horarioDia}>{horario.dia}</Text>
                <TouchableOpacity
                  style={[styles.toggle, horario.abierto && styles.toggleActive]}
                  onPress={() => toggleDiaAbierto(index)}
                >
                  <Text style={[styles.toggleText, horario.abierto && styles.toggleTextActive]}>
                    {horario.abierto ? 'Abierto' : 'Cerrado'}
                  </Text>
                </TouchableOpacity>
              </View>

              {horario.abierto && (
                <View style={styles.horarioBody}>
                  <TouchableOpacity
                    style={styles.corridoToggle}
                    onPress={() => toggleHorarioCorrido(index)}
                  >
                    <Text style={styles.label}>
                      {horario.horarioCorrido ? 'Horario Corrido' : 'Horario Partido'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.timeInputs}>
                    <View style={styles.timeGroup}>
                      <Text style={styles.timeLabel}>
                        {horario.horarioCorrido ? 'Apertura' : 'Mañana'}
                      </Text>
                      <TextInput
                        style={styles.timeInput}
                        value={horario.manana?.inicio}
                        onChangeText={(value) => updateHorario(index, 'manana', 'inicio', value)}
                        placeholder="0900"
                        placeholderTextColor="#9ca3af"
                        keyboardType="numeric"
                        maxLength={5}
                      />
                      <Text style={styles.timeSeparator}>-</Text>
                      <TextInput
                        style={styles.timeInput}
                        value={horario.manana?.fin}
                        onChangeText={(value) => updateHorario(index, 'manana', 'fin', value)}
                        placeholder="1300"
                        placeholderTextColor="#9ca3af"
                        keyboardType="numeric"
                        maxLength={5}
                      />
                    </View>

                    {!horario.horarioCorrido && (
                      <View style={styles.timeGroup}>
                        <Text style={styles.timeLabel}>Tarde</Text>
                        <TextInput
                          style={styles.timeInput}
                          value={horario.tarde?.inicio}
                          onChangeText={(value) => updateHorario(index, 'tarde', 'inicio', value)}
                          placeholder="1700"
                          placeholderTextColor="#9ca3af"
                          keyboardType="numeric"
                          maxLength={5}
                        />
                        <Text style={styles.timeSeparator}>-</Text>
                        <TextInput
                          style={styles.timeInput}
                          value={horario.tarde?.fin}
                          onChangeText={(value) => updateHorario(index, 'tarde', 'fin', value)}
                          placeholder="2100"
                          placeholderTextColor="#9ca3af"
                          keyboardType="numeric"
                          maxLength={5}
                        />
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Save size={20} color="#fff" />
          <Text style={styles.saveButtonText}>Guardar Cambios</Text>
        </TouchableOpacity>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 12,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#111',
  },
  section: {
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#111',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 8,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f9fafb',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#f9fafb',
    overflow: 'hidden',
  },
  picker: {
    height: Platform.OS === 'ios' ? 180 : 50,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a2332',
    padding: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  coordinates: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  horarioCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  horarioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  horarioDia: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#111',
  },
  toggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  toggleActive: {
    backgroundColor: '#059669',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6b7280',
  },
  toggleTextActive: {
    color: '#fff',
  },
  horarioBody: {
    marginTop: 16,
  },
  corridoToggle: {
    marginBottom: 12,
  },
  timeInputs: {
    gap: 12,
  },
  timeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6b7280',
    width: 80,
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  timeSeparator: {
    fontSize: 16,
    color: '#6b7280',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a2332',
    padding: 18,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
    marginBottom: 32,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold' as const,
  },
  imagePickerButton: {
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 12,
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: 16,
  },
  logoPreview: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  logoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#f9fafb',
  },
  logoPlaceholderText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },

});
