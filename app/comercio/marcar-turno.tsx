import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Clock, Save } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useBusiness } from '../../context/BusinessContext';
import type { Comercio } from '../../types';

export default function MarcarTurno() {
  const router = useRouter();
  const { user } = useAuth();
  const { getComercio, saveComercio } = useBusiness();
  const comercio = getComercio(user?.id || '') as Comercio;

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [horaInicio, setHoraInicio] = useState<string>('');
  const [horaFin, setHoraFin] = useState<string>('');

  const getCurrentMonth = () => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${months[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
  };

  const getDaysInMonth = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setSelectedDate(newDate);
  };

  const formatTimeInput = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length === 0) return '';
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) return `${numbers.slice(0, 2)}:${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}:${numbers.slice(2, 4)}`;
  };

  const handleSave = async () => {
    if (!horaInicio || !horaFin) {
      Alert.alert('Error', 'Por favor ingrese la hora de inicio y fin del turno');
      return;
    }

    const turnos = comercio?.turnos || [];
    const dateString = selectedDate.toISOString().split('T')[0];
    
    const existingTurnoIndex = turnos.findIndex(t => t.fecha === dateString);
    
    const updatedTurnos = [...turnos];
    const newTurno = { fecha: dateString, horaInicio, horaFin };
    
    if (existingTurnoIndex >= 0) {
      updatedTurnos[existingTurnoIndex] = newTurno;
    } else {
      updatedTurnos.push(newTurno);
    }

    const updatedComercio: Comercio = {
      ...comercio,
      turnos: updatedTurnos,
    };

    await saveComercio(updatedComercio);
    Alert.alert('Éxito', 'Turno guardado correctamente');
    router.back();
  };

  const isTurnoDay = (day: number) => {
    if (!comercio?.turnos) return false;
    const dateString = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      day
    ).toISOString().split('T')[0];
    return comercio.turnos.some(t => t.fecha === dateString);
  };

  const getTurnoForDay = (day: number) => {
    if (!comercio?.turnos) return null;
    const dateString = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      day
    ).toISOString().split('T')[0];
    return comercio.turnos.find(t => t.fecha === dateString);
  };

  const isSelectedDay = (day: number) => {
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === new Date().getMonth()
    );
  };

  const handleDayPress = (day: number) => {
    const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
    setSelectedDate(newDate);
    
    const turno = getTurnoForDay(day);
    if (turno) {
      setHoraInicio(turno.horaInicio);
      setHoraFin(turno.horaFin);
    } else {
      setHoraInicio('');
      setHoraFin('');
    }
  };

  const days = getDaysInMonth();
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Marcar de Turno</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthButton}>
              <Text style={styles.monthButtonText}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{getCurrentMonth()}</Text>
            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthButton}>
              <Text style={styles.monthButtonText}>{'>'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dayNamesRow}>
            {dayNames.map((name) => (
              <Text key={name} style={styles.dayName}>
                {name}
              </Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {days.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  day === null && styles.emptyCell,
                  day !== null && isSelectedDay(day) && styles.selectedDay,
                  day !== null && isTurnoDay(day) && styles.turnoDay,
                ]}
                onPress={() => day !== null && handleDayPress(day)}
                disabled={day === null}
              >
                {day !== null && (
                  <Text
                    style={[
                      styles.dayText,
                      isSelectedDay(day) && styles.selectedDayText,
                      isTurnoDay(day) && styles.turnoDayText,
                    ]}
                  >
                    {day}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={24} color="#374151" />
            <Text style={styles.sectionTitle}>Horario de Turno</Text>
          </View>

          <Text style={styles.selectedDateText}>
            <Calendar size={16} color="#6b7280" />
            {' '}Fecha seleccionada: {selectedDate.toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'long',
              year: 'numeric'
            })}
          </Text>

          <Text style={styles.label}>Hora de Inicio</Text>
          <TextInput
            style={styles.input}
            value={horaInicio}
            onChangeText={(value) => setHoraInicio(formatTimeInput(value))}
            placeholder="0900"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
            maxLength={5}
          />

          <Text style={styles.label}>Hora de Fin</Text>
          <TextInput
            style={styles.input}
            value={horaFin}
            onChangeText={(value) => setHoraFin(formatTimeInput(value))}
            placeholder="2100"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
            maxLength={5}
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Save size={20} color="#fff" />
            <Text style={styles.saveButtonText}>Guardar Turno</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1a2332',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
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
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthButton: {
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  monthButtonText: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#374151',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#111',
  },
  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  emptyCell: {
    backgroundColor: 'transparent',
  },
  selectedDay: {
    backgroundColor: '#1a2332',
    borderRadius: 8,
  },
  turnoDay: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  dayText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500' as const,
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: 'bold' as const,
  },
  turnoDayText: {
    color: '#f59e0b',
    fontWeight: 'bold' as const,
  },
  selectedDateText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
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
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a2332',
    padding: 18,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold' as const,
  },
});
