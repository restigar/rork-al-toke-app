import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Calendar, LogOut, Settings, Tag, Mic, MicOff, User, MessageCircle, Mail, Map } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { useAuth } from '../../context/AuthContext';
import { useBusiness } from '../../context/BusinessContext';
import * as Location from 'expo-location';


export default function ClientePerfil() {
  const router = useRouter();
  const { user, logout, isComercio } = useAuth();
  const { comercios } = useBusiness();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchMode, setSearchMode] = useState<'ofertas' | 'comercios'>('ofertas');

  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const firstName = user?.name?.split(' ')[0] || user?.name || 'Usuario';

  const handleSearch = () => {
    if (searchQuery.trim()) {
      if (searchMode === 'ofertas') {
        router.push(`/cliente/buscar-ofertas?q=${encodeURIComponent(searchQuery)}`);
      } else {
        router.push(`/cliente/buscar-comercios?q=${encodeURIComponent(searchQuery)}`);
      }
    }
  };

  const handleLogout = async () => {
    if (isComercio) {
      router.push('/comercio/dashboard');
    } else {
      await logout();
      router.replace('/');
    }
  };

  const startRecording = async () => {
    try {
      console.log('Solicitando permisos de grabación...');
      const permission = await Audio.requestPermissionsAsync();
      
      if (permission.status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita permiso para grabar audio');
        return;
      }

      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      }

      console.log('Iniciando grabación...');
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Platform.OS === 'web'
          ? Audio.RecordingOptionsPresets.HIGH_QUALITY
          : {
              android: {
                extension: '.m4a',
                outputFormat: Audio.AndroidOutputFormat.MPEG_4,
                audioEncoder: Audio.AndroidAudioEncoder.AAC,
                sampleRate: 44100,
                numberOfChannels: 2,
                bitRate: 128000,
              },
              ios: {
                extension: '.wav',
                outputFormat: Audio.IOSOutputFormat.LINEARPCM,
                audioQuality: Audio.IOSAudioQuality.HIGH,
                sampleRate: 44100,
                numberOfChannels: 1,
                bitRate: 128000,
                linearPCMBitDepth: 16,
                linearPCMIsBigEndian: false,
                linearPCMIsFloat: false,
              },
              web: {},
            }
      );

      setRecording(newRecording);
      setIsRecording(true);
      console.log('Grabación iniciada');
    } catch (err) {
      console.error('Error al iniciar grabación:', err);
      Alert.alert('Error', 'No se pudo iniciar la grabación');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      console.log('Deteniendo grabación...');
      await recording.stopAndUnloadAsync();
      
      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
      }

      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);
      console.log('Grabación detenida, URI:', uri);

      if (uri) {
        await transcribeAudio(uri);
      }
    } catch (err) {
      console.error('Error al detener grabación:', err);
      Alert.alert('Error', 'No se pudo detener la grabación');
    }
  };

  const transcribeAudio = async (uri: string) => {
    try {
      console.log('Transcribiendo audio...');
      setIsSearching(true);

      const formData = new FormData();
      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append('audio', blob, `recording.${fileType}`);
      } else {
        const audioFile: any = {
          uri,
          name: `recording.${fileType}`,
          type: `audio/${fileType}`,
        };
        formData.append('audio', audioFile);
      }

      const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error en la transcripción');
      }

      const data = await response.json();
      console.log('Transcripción:', data.text);
      setSearchQuery(data.text);
      setIsSearching(false);
      
      if (searchMode === 'ofertas') {
        setTimeout(() => {
          router.push(`/cliente/buscar-ofertas?q=${encodeURIComponent(data.text)}`);
        }, 300);
      } else {
        setTimeout(() => {
          handleSearch();
        }, 300);
      }
    } catch (err) {
      console.error('Error en transcripción:', err);
      Alert.alert('Error', 'No se pudo transcribir el audio');
      setIsSearching(false);
    }
  };

  const handleVoiceButton = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const abrirMapaComerciosCercanos = async () => {
    console.log('🗺️ Intentando abrir mapa con todos los comercios registrados');
    console.log('📊 Total de comercios:', comercios.length);
    
    const comerciosConUbicacion = comercios.filter(c => c.ubicacion);
    console.log('📍 Comercios con ubicación:', comerciosConUbicacion.length);
    
    if (comerciosConUbicacion.length === 0) {
      Alert.alert('Sin comercios', 'No hay comercios con ubicación registrada en el sistema');
      return;
    }

    try {
      let userLocation = null;
      if (Platform.OS !== 'web') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          userLocation = await Location.getCurrentPositionAsync({});
          console.log('📍 Ubicación del usuario obtenida:', userLocation.coords);
        }
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

      const centerLat = userLocation
        ? userLocation.coords.latitude
        : comerciosConUbicacion.reduce((sum, c) => sum + c.ubicacion!.latitud, 0) / comerciosConUbicacion.length;
      const centerLng = userLocation
        ? userLocation.coords.longitude
        : comerciosConUbicacion.reduce((sum, c) => sum + c.ubicacion!.longitud, 0) / comerciosConUbicacion.length;

      const markers = comerciosConUbicacion
        .slice(0, 10)
        .map((c) => {
          const nombreEncoded = encodeURIComponent(c.nombre.substring(0, 20));
          return `&markers=color:red%7Clabel:${nombreEncoded.substring(0, 1)}%7C${c.ubicacion!.latitud},${c.ubicacion!.longitud}`;
        })
        .join('');

      const url = `https://www.google.com/maps/search/?api=1&query=${centerLat},${centerLng}${markers}`;
      
      console.log('✅ Abriendo mapa con múltiples comercios:', comerciosConUbicacion.length);
      console.log('📍 Comercios en el mapa:', comerciosConUbicacion.slice(0, 10).map((c, i) => `${i + 1}. ${c.nombre}`).join(', '));
      console.log('🔗 URL del mapa:', url);
      
      Linking.openURL(url).catch(error => {
        console.error('❌ Error al abrir el mapa:', error);
        Alert.alert('Error', 'No se pudo abrir el mapa');
      });
    } catch (error) {
      console.error('❌ Error al abrir mapa:', error);
      Alert.alert('Error', 'No se pudo obtener tu ubicación');
    }
  };

  return (
    <View style={styles.backgroundImage}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerRow}>
              <View style={styles.leftSection}>
                <View style={styles.profileSection}>
                  {(user as any)?.fotoPerfil ? (
                    <Image
                      source={{ uri: (user as any).fotoPerfil }}
                      style={styles.profilePhoto}
                    />
                  ) : (
                    <View style={styles.profilePhotoPlaceholder}>
                      <User size={32} color="#9ca3af" />
                    </View>
                  )}
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user?.name}</Text>
                    <Text style={styles.userNumber}>N° de Cliente: {(user as any)?.numeroCliente}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.rightSection}>
                <Image
                  source={{ uri: 'https://i.imgur.com/zpjLZai.png' }}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                  <LogOut size={20} color="#fff" />
                  {isComercio && (
                    <Text style={styles.logoutButtonText}>Volver al perfil de comercio</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.headerButtons}>
              {!isComercio && (
                <>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => router.push('/cliente/editar-perfil')}
                  >
                    <Settings size={22} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => {
                      const phoneNumber = '5493756441056';
                      Linking.openURL(`https://wa.me/${phoneNumber}`);
                    }}
                  >
                    <MessageCircle size={22} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => {
                      Linking.openURL('mailto:info@al-toke.com');
                    }}
                  >
                    <Mail size={22} color="#fff" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.searchSection}>
            <Text style={styles.greeting}>Hola {firstName}, ¿qué estás buscando hoy?</Text>

            <View style={styles.modeButtons}>
              <TouchableOpacity
                style={[styles.modeButton, searchMode === 'ofertas' && styles.modeButtonActive]}
                onPress={() => setSearchMode('ofertas')}
              >
                <Text style={[styles.modeButtonText, searchMode === 'ofertas' && styles.modeButtonTextActive]}>
                  Ofertas
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, searchMode === 'comercios' && styles.modeButtonActive]}
                onPress={() => setSearchMode('comercios')}
              >
                <Text style={[styles.modeButtonText, searchMode === 'comercios' && styles.modeButtonTextActive]}>
                  Comercios
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.ofertasButtons}>
              <TouchableOpacity
                style={styles.ofertasLink}
                onPress={() => router.push('/cliente/ofertas-del-dia')}
              >
                <Calendar size={18} color="#9dd9c1" />
                <Text style={styles.ofertasLinkText}>Ver Ofertas del Día</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cargarOfertaButton}
                onPress={() => router.push('/cliente/cargar-oferta-dia')}
              >
                <Tag size={18} color="#fff" />
                <Text style={styles.cargarOfertaButtonText}>Cargar Oferta del Día</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mapaButton}
                onPress={abrirMapaComerciosCercanos}
              >
                <Map size={18} color="#fff" />
                <Text style={styles.mapaButtonText}>Ver Comercios en Mapa</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchBar}>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={`Buscar ${searchMode}...`}
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity 
                style={[styles.voiceButton, isRecording && styles.voiceButtonActive]} 
                onPress={handleVoiceButton}
              >
                {isRecording ? (
                  <MicOff size={24} color="#fff" />
                ) : (
                  <Mic size={24} color="#fff" />
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                <Search size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {isSearching && (
              <View style={styles.loading}>
                <ActivityIndicator size="large" color="#9dd9c1" />
              </View>
            )}


          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 24,
    backgroundColor: '#fff',
  },
  headerContent: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  leftSection: {
    flex: 1,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 8,
  },
  logo: {
    width: 100,
    height: 40,
  },
  userInfo: {
    alignItems: 'flex-start',
  },
  userName: {
    fontSize: 20,
    color: '#111',
    fontWeight: 'bold' as const,
    marginBottom: 4,
  },
  userNumber: {
    fontSize: 14,
    color: '#6b7280',
    opacity: 0.9,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    backgroundColor: '#9dd9c1',
    padding: 10,
    borderRadius: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9dd9c1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  content: {
    flex: 1,
  },
  searchSection: {
    padding: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#111',
    marginBottom: 20,
    textAlign: 'center',
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#1a2332',
    borderColor: '#1a2332',
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6b7280',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  ofertasButtons: {
    gap: 12,
    marginBottom: 20,
  },
  ofertasLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
  },
  ofertasLinkText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600' as const,
  },
  cargarOfertaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#9dd9c1',
    borderRadius: 12,
  },
  cargarOfertaButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600' as const,
  },
  mapaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#1a2332',
    borderRadius: 12,
  },
  mapaButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600' as const,
  },
  searchBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  voiceButton: {
    backgroundColor: '#6b7280',
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButtonActive: {
    backgroundColor: '#ef4444',
  },
  searchButton: {
    backgroundColor: '#9dd9c1',
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    padding: 40,
    alignItems: 'center',
  },

  logoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#9dd9c1',
  },
  profilePhotoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#9dd9c1',
  },
});
