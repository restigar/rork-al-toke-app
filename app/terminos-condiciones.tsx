import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

export default function TerminosCondiciones() {
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
        <Text style={styles.headerTitle}>Términos y Condiciones</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdate}>Última actualización: {new Date().toLocaleDateString('es-AR')}</Text>

        <Text style={styles.sectionTitle}>1. Aceptación de los Términos</Text>
        <Text style={styles.paragraph}>
          Al acceder y utilizar Al Toke App, usted acepta estar sujeto a estos Términos y Condiciones. 
          Si no está de acuerdo con alguno de estos términos, no debe utilizar nuestra aplicación.
        </Text>

        <Text style={styles.sectionTitle}>2. Descripción del Servicio</Text>
        <Text style={styles.paragraph}>
          Al Toke App es una plataforma que conecta comercios locales con clientes, permitiendo a los comercios 
          publicar ofertas y promociones, y a los clientes descubrir y aprovechar dichas ofertas en su área local.
        </Text>

        <Text style={styles.sectionTitle}>3. Registro de Usuario</Text>
        <Text style={styles.paragraph}>
          Para utilizar ciertas funciones de la aplicación, debe registrarse y crear una cuenta. Usted se compromete a:
        </Text>
        <Text style={styles.bulletPoint}>• Proporcionar información veraz, exacta y actualizada</Text>
        <Text style={styles.bulletPoint}>• Mantener la confidencialidad de su contraseña</Text>
        <Text style={styles.bulletPoint}>• Notificar inmediatamente cualquier uso no autorizado de su cuenta</Text>
        <Text style={styles.bulletPoint}>• No crear más de una cuenta personal</Text>

        <Text style={styles.sectionTitle}>4. Tipos de Usuarios</Text>
        <Text style={styles.subsectionTitle}>4.1 Clientes</Text>
        <Text style={styles.paragraph}>
          Los clientes pueden explorar ofertas, buscar comercios cercanos, y aprovechar promociones publicadas 
          por los comercios registrados en la plataforma.
        </Text>
        <Text style={styles.subsectionTitle}>4.2 Comercios</Text>
        <Text style={styles.paragraph}>
          Los comercios pueden crear un perfil, publicar ofertas con fechas de inicio y fin, gestionar información 
          de contacto, horarios de atención, y visualizar estadísticas de sus publicaciones.
        </Text>

        <Text style={styles.sectionTitle}>5. Uso Permitido</Text>
        <Text style={styles.paragraph}>Usted se compromete a utilizar Al Toke App únicamente para:</Text>
        <Text style={styles.bulletPoint}>• Fines legales y legítimos</Text>
        <Text style={styles.bulletPoint}>• Buscar o publicar ofertas reales y válidas</Text>
        <Text style={styles.bulletPoint}>• Interactuar de manera respetuosa con otros usuarios</Text>

        <Text style={styles.sectionTitle}>6. Conductas Prohibidas</Text>
        <Text style={styles.paragraph}>Está estrictamente prohibido:</Text>
        <Text style={styles.bulletPoint}>• Publicar información falsa, engañosa o fraudulenta</Text>
        <Text style={styles.bulletPoint}>• Usar la aplicación para actividades ilegales</Text>
        <Text style={styles.bulletPoint}>• Acosar, amenazar o intimidar a otros usuarios</Text>
        <Text style={styles.bulletPoint}>• Intentar acceder a cuentas de otros usuarios</Text>
        <Text style={styles.bulletPoint}>• Utilizar bots o sistemas automatizados</Text>
        <Text style={styles.bulletPoint}>• Publicar contenido ofensivo, discriminatorio o inapropiado</Text>

        <Text style={styles.sectionTitle}>7. Ofertas y Promociones</Text>
        <Text style={styles.paragraph}>
          Los comercios son totalmente responsables de la validez, exactitud y cumplimiento de las ofertas que publican. 
          Al Toke App no garantiza la disponibilidad ni la validez de ninguna oferta publicada por terceros.
        </Text>
        <Text style={styles.paragraph}>
          Las ofertas deben incluir fechas de inicio y fin claras. Una vez expiradas, las ofertas se mostrarán como 
          inactivas en la plataforma.
        </Text>

        <Text style={styles.sectionTitle}>8. Comisiones y Pagos</Text>
        <Text style={styles.paragraph}>
          Al Toke App puede cobrar comisiones por el uso de ciertos servicios. Las tarifas aplicables se 
          comunicarán claramente antes de que el usuario acepte utilizarlos. Los términos de pago se establecen 
          de manera individual con cada comercio.
        </Text>

        <Text style={styles.sectionTitle}>9. Ubicación y Datos</Text>
        <Text style={styles.paragraph}>
          La aplicación utiliza servicios de ubicación para mostrar comercios y ofertas cercanas. Al utilizar Al Toke App, 
          usted acepta compartir su ubicación con nosotros según lo descrito en nuestra Política de Privacidad.
        </Text>

        <Text style={styles.sectionTitle}>10. Autenticación Biométrica</Text>
        <Text style={styles.paragraph}>
          La aplicación ofrece autenticación mediante huella dactilar o reconocimiento facial. Esta función es opcional 
          y está diseñada para facilitar el acceso seguro a su cuenta. La información biométrica se procesa 
          localmente en su dispositivo y no se almacena en nuestros servidores.
        </Text>

        <Text style={styles.sectionTitle}>11. Propiedad Intelectual</Text>
        <Text style={styles.paragraph}>
          Todos los derechos de propiedad intelectual relacionados con Al Toke App, incluidos el diseño, 
          logotipos, código fuente y contenido, son propiedad exclusiva de Al Toke App o sus licenciantes.
        </Text>

        <Text style={styles.sectionTitle}>12. Limitación de Responsabilidad</Text>
        <Text style={styles.paragraph}>
          Al Toke App actúa como intermediario entre comercios y clientes. No somos responsables de:
        </Text>
        <Text style={styles.bulletPoint}>• La calidad de productos o servicios ofrecidos por los comercios</Text>
        <Text style={styles.bulletPoint}>• Disputas entre usuarios y comercios</Text>
        <Text style={styles.bulletPoint}>• Pérdidas o daños derivados del uso de la aplicación</Text>
        <Text style={styles.bulletPoint}>• Interrupciones del servicio o errores técnicos</Text>

        <Text style={styles.sectionTitle}>13. Modificación del Servicio</Text>
        <Text style={styles.paragraph}>
          Nos reservamos el derecho de modificar, suspender o discontinuar cualquier aspecto de Al Toke App 
          en cualquier momento, con o sin previo aviso.
        </Text>

        <Text style={styles.sectionTitle}>14. Terminación de Cuenta</Text>
        <Text style={styles.paragraph}>
          Podemos suspender o eliminar su cuenta si:
        </Text>
        <Text style={styles.bulletPoint}>• Viola estos Términos y Condiciones</Text>
        <Text style={styles.bulletPoint}>• Realiza actividades fraudulentas o ilegales</Text>
        <Text style={styles.bulletPoint}>• Lo solicita mediante contacto directo con soporte</Text>

        <Text style={styles.sectionTitle}>15. Jurisdicción y Ley Aplicable</Text>
        <Text style={styles.paragraph}>
          Estos términos se rigen por las leyes de la República Argentina. Cualquier disputa será resuelta 
          en los tribunales competentes de Argentina.
        </Text>

        <Text style={styles.sectionTitle}>16. Cambios en los Términos</Text>
        <Text style={styles.paragraph}>
          Nos reservamos el derecho de actualizar estos Términos y Condiciones en cualquier momento. 
          Los cambios entrarán en vigor inmediatamente después de su publicación en la aplicación. 
          Su uso continuado de Al Toke App después de dichos cambios constituye su aceptación de los nuevos términos.
        </Text>

        <Text style={styles.sectionTitle}>17. Contacto</Text>
        <Text style={styles.paragraph}>
          Si tiene preguntas sobre estos Términos y Condiciones, puede contactarnos a través de:
        </Text>
        <Text style={styles.bulletPoint}>• Email: soporte@altoke.app</Text>
        <Text style={styles.bulletPoint}>• Desde la aplicación: Perfil → Soporte</Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Al Toke App © {new Date().getFullYear()}</Text>
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
  },
});
