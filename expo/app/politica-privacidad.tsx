import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

export default function PoliticaPrivacidad() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1a2332" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Política de Privacidad</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdate}>Última actualización: {new Date().toLocaleDateString('es-AR')}</Text>

        <Text style={styles.paragraph}>
          En Al Toke App, nos tomamos muy en serio la privacidad de nuestros usuarios. Esta Política de Privacidad 
          explica cómo recopilamos, usamos, compartimos y protegemos su información personal cuando utiliza nuestra aplicación.
        </Text>

        <Text style={styles.sectionTitle}>1. Información que Recopilamos</Text>
        
        <Text style={styles.subsectionTitle}>1.1 Información de Registro</Text>
        <Text style={styles.paragraph}>Cuando crea una cuenta, recopilamos:</Text>
        <Text style={styles.bulletPoint}>• Nombre completo</Text>
        <Text style={styles.bulletPoint}>• Dirección de correo electrónico</Text>
        <Text style={styles.bulletPoint}>• Número de teléfono</Text>
        <Text style={styles.bulletPoint}>• Contraseña (almacenada de forma cifrada)</Text>
        <Text style={styles.bulletPoint}>• Tipo de usuario (Cliente o Comercio)</Text>

        <Text style={styles.subsectionTitle}>1.2 Información del Comercio</Text>
        <Text style={styles.paragraph}>Si se registra como comercio, también recopilamos:</Text>
        <Text style={styles.bulletPoint}>• Nombre del comercio</Text>
        <Text style={styles.bulletPoint}>• Dirección física</Text>
        <Text style={styles.bulletPoint}>• Rubro o categoría de negocio</Text>
        <Text style={styles.bulletPoint}>• Horarios de atención</Text>
        <Text style={styles.bulletPoint}>• Información de contacto adicional</Text>
        <Text style={styles.bulletPoint}>• Logo o imagen del comercio</Text>

        <Text style={styles.subsectionTitle}>1.3 Datos de Ubicación</Text>
        <Text style={styles.paragraph}>
          Recopilamos datos de ubicación geográfica para:
        </Text>
        <Text style={styles.bulletPoint}>• Mostrar comercios y ofertas cercanas a su ubicación</Text>
        <Text style={styles.bulletPoint}>• Calcular distancias entre usted y los comercios</Text>
        <Text style={styles.bulletPoint}>• Mejorar la relevancia de las búsquedas</Text>
        <Text style={styles.paragraph}>
          La recopilación de datos de ubicación se solicita al iniciar sesión y puede ser configurada en la 
          configuración de su dispositivo en cualquier momento.
        </Text>

        <Text style={styles.subsectionTitle}>1.4 Datos de Uso</Text>
        <Text style={styles.paragraph}>Recopilamos información sobre cómo utiliza la aplicación:</Text>
        <Text style={styles.bulletPoint}>• Ofertas que visualiza o marca como favoritas</Text>
        <Text style={styles.bulletPoint}>• Comercios que visita o busca</Text>
        <Text style={styles.bulletPoint}>• Búsquedas realizadas</Text>
        <Text style={styles.bulletPoint}>• Fecha y hora de uso</Text>

        <Text style={styles.subsectionTitle}>1.5 Información del Dispositivo</Text>
        <Text style={styles.paragraph}>Recopilamos información técnica sobre su dispositivo:</Text>
        <Text style={styles.bulletPoint}>• Modelo del dispositivo</Text>
        <Text style={styles.bulletPoint}>• Sistema operativo y versión</Text>
        <Text style={styles.bulletPoint}>• Identificadores únicos del dispositivo</Text>
        <Text style={styles.bulletPoint}>• Dirección IP</Text>
        <Text style={styles.bulletPoint}>• Configuración de idioma</Text>

        <Text style={styles.subsectionTitle}>1.6 Datos Biométricos</Text>
        <Text style={styles.paragraph}>
          Si activa la autenticación biométrica (huella dactilar o reconocimiento facial), esta información se 
          procesa localmente en su dispositivo mediante las APIs de seguridad del sistema operativo. 
          No almacenamos ni tenemos acceso a sus datos biométricos en nuestros servidores.
        </Text>

        <Text style={styles.sectionTitle}>2. Cómo Utilizamos su Información</Text>
        <Text style={styles.paragraph}>Utilizamos la información recopilada para:</Text>
        <Text style={styles.bulletPoint}>• Crear y gestionar su cuenta de usuario</Text>
        <Text style={styles.bulletPoint}>• Autenticar su identidad y proporcionar acceso seguro</Text>
        <Text style={styles.bulletPoint}>• Mostrar ofertas y comercios relevantes según su ubicación</Text>
        <Text style={styles.bulletPoint}>• Permitir que los comercios publiquen y gestionen ofertas</Text>
        <Text style={styles.bulletPoint}>• Procesar transacciones y comisiones</Text>
        <Text style={styles.bulletPoint}>• Enviar notificaciones sobre ofertas, actualizaciones y cambios</Text>
        <Text style={styles.bulletPoint}>• Mejorar y personalizar su experiencia en la aplicación</Text>
        <Text style={styles.bulletPoint}>• Analizar el uso de la aplicación para mejoras técnicas</Text>
        <Text style={styles.bulletPoint}>• Prevenir fraudes y actividades ilícitas</Text>
        <Text style={styles.bulletPoint}>• Cumplir con obligaciones legales</Text>

        <Text style={styles.sectionTitle}>3. Compartir su Información</Text>
        <Text style={styles.paragraph}>
          No vendemos su información personal a terceros. Podemos compartir su información en las siguientes circunstancias:
        </Text>
        
        <Text style={styles.subsectionTitle}>3.1 Con Otros Usuarios</Text>
        <Text style={styles.paragraph}>
          Los comercios pueden ver cierta información agregada sobre el rendimiento de sus ofertas 
          (visualizaciones, interacciones), pero no información personal identificable de clientes individuales.
        </Text>

        <Text style={styles.subsectionTitle}>3.2 Proveedores de Servicios</Text>
        <Text style={styles.paragraph}>
          Compartimos información con proveedores de servicios que nos ayudan a operar la aplicación:
        </Text>
        <Text style={styles.bulletPoint}>• Servicios de alojamiento en la nube</Text>
        <Text style={styles.bulletPoint}>• Servicios de análisis de datos</Text>
        <Text style={styles.bulletPoint}>• Servicios de mapas y geolocalización</Text>
        <Text style={styles.bulletPoint}>• Procesadores de pago</Text>

        <Text style={styles.subsectionTitle}>3.3 Requisitos Legales</Text>
        <Text style={styles.paragraph}>
          Podemos divulgar su información si es requerido por ley, orden judicial, o para:
        </Text>
        <Text style={styles.bulletPoint}>• Cumplir con procesos legales</Text>
        <Text style={styles.bulletPoint}>• Proteger los derechos y seguridad de Al Toke App y sus usuarios</Text>
        <Text style={styles.bulletPoint}>• Investigar actividades fraudulentas o ilegales</Text>

        <Text style={styles.sectionTitle}>4. Seguridad de los Datos</Text>
        <Text style={styles.paragraph}>
          Implementamos medidas de seguridad técnicas y organizativas para proteger su información:
        </Text>
        <Text style={styles.bulletPoint}>• Cifrado de datos en tránsito y en reposo</Text>
        <Text style={styles.bulletPoint}>• Contraseñas almacenadas con algoritmos de hash seguros</Text>
        <Text style={styles.bulletPoint}>• Acceso restringido a información personal</Text>
        <Text style={styles.bulletPoint}>• Monitoreo de seguridad y detección de amenazas</Text>
        <Text style={styles.bulletPoint}>• Auditorías de seguridad periódicas</Text>
        <Text style={styles.paragraph}>
          Sin embargo, ningún sistema es completamente seguro. Le recomendamos proteger sus credenciales de acceso 
          y notificarnos inmediatamente si sospecha de un acceso no autorizado.
        </Text>

        <Text style={styles.sectionTitle}>5. Retención de Datos</Text>
        <Text style={styles.paragraph}>
          Conservamos su información personal mientras su cuenta esté activa o según sea necesario para 
          proporcionar nuestros servicios. Puede solicitar la eliminación de su cuenta en cualquier momento, 
          tras lo cual eliminaremos su información dentro de los 30 días, excepto cuando debamos retenerla por 
          obligaciones legales o contables.
        </Text>

        <Text style={styles.sectionTitle}>6. Sus Derechos</Text>
        <Text style={styles.paragraph}>Usted tiene derecho a:</Text>
        <Text style={styles.bulletPoint}>• Acceder a su información personal</Text>
        <Text style={styles.bulletPoint}>• Corregir información inexacta o incompleta</Text>
        <Text style={styles.bulletPoint}>• Solicitar la eliminación de su cuenta y datos</Text>
        <Text style={styles.bulletPoint}>• Oponerse al procesamiento de su información</Text>
        <Text style={styles.bulletPoint}>• Revocar el consentimiento de uso de ubicación</Text>
        <Text style={styles.bulletPoint}>• Exportar sus datos en un formato portable</Text>

        <Text style={styles.sectionTitle}>7. Permisos de la Aplicación</Text>
        
        <Text style={styles.subsectionTitle}>7.1 Ubicación</Text>
        <Text style={styles.paragraph}>
          Solicitamos acceso a su ubicación para mostrar comercios cercanos. Puede revocar este permiso en la 
          configuración de su dispositivo, pero esto limitará algunas funcionalidades de la aplicación.
        </Text>

        <Text style={styles.subsectionTitle}>7.2 Autenticación Biométrica</Text>
        <Text style={styles.paragraph}>
          El acceso a la huella dactilar o Face ID es opcional y solo se utiliza para autenticación local en su dispositivo.
        </Text>

        <Text style={styles.subsectionTitle}>7.3 Notificaciones</Text>
        <Text style={styles.paragraph}>
          Solicitamos permiso para enviar notificaciones push sobre ofertas y actualizaciones. Puede desactivar 
          las notificaciones en la configuración de su dispositivo.
        </Text>

        <Text style={styles.sectionTitle}>8. Privacidad de Menores</Text>
        <Text style={styles.paragraph}>
          Al Toke App no está dirigida a menores de 18 años. No recopilamos intencionalmente información 
          de menores. Si descubrimos que hemos recopilado información de un menor, la eliminaremos inmediatamente.
        </Text>

        <Text style={styles.sectionTitle}>9. Cookies y Tecnologías Similares</Text>
        <Text style={styles.paragraph}>
          Utilizamos tecnologías de seguimiento para mejorar la experiencia del usuario, analizar tendencias y 
          administrar la aplicación. Puede gestionar las preferencias de cookies en la configuración de su navegador o dispositivo.
        </Text>

        <Text style={styles.sectionTitle}>10. Transferencias Internacionales</Text>
        <Text style={styles.paragraph}>
          Su información puede ser transferida y procesada en servidores ubicados fuera de Argentina. 
          Nos aseguramos de que dichas transferencias cumplan con las leyes de protección de datos aplicables 
          y que se implementen salvaguardias adecuadas.
        </Text>

        <Text style={styles.sectionTitle}>11. Cambios a esta Política</Text>
        <Text style={styles.paragraph}>
          Podemos actualizar esta Política de Privacidad periódicamente. Le notificaremos sobre cambios 
          significativos mediante un aviso en la aplicación o por correo electrónico. La fecha de la última 
          actualización se mostrará al inicio de este documento.
        </Text>

        <Text style={styles.sectionTitle}>12. Contacto</Text>
        <Text style={styles.paragraph}>
          Si tiene preguntas, inquietudes o solicitudes relacionadas con esta Política de Privacidad o el 
          manejo de su información personal, puede contactarnos:
        </Text>
        <Text style={styles.bulletPoint}>• Email: privacidad@altoke.app</Text>
        <Text style={styles.bulletPoint}>• Email de soporte: soporte@altoke.app</Text>
        <Text style={styles.bulletPoint}>• Desde la aplicación: Perfil → Soporte</Text>

        <Text style={styles.sectionTitle}>13. Legislación Aplicable</Text>
        <Text style={styles.paragraph}>
          Esta Política de Privacidad se rige por la Ley de Protección de Datos Personales Nº 25.326 de la 
          República Argentina y las regulaciones aplicables de la Agencia de Acceso a la Información Pública.
        </Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Al Toke App © {new Date().getFullYear()}</Text>
          <Text style={styles.footerSubtext}>Protegiendo tu privacidad</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1a2332',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  lastUpdate: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 24,
    fontStyle: 'italic' as const,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a2332',
    marginTop: 24,
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a2332',
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    color: '#374151',
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 15,
    lineHeight: 24,
    color: '#374151',
    marginBottom: 8,
    paddingLeft: 12,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
