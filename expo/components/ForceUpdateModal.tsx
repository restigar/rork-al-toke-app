import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  Linking,
} from 'react-native';
import { useVersion } from '@/context/VersionContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Download } from 'lucide-react-native';

export default function ForceUpdateModal() {
  const { showUpdateModal, versionConfig, currentVersion } = useVersion();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();

  if (!showUpdateModal || !versionConfig) return null;

  const updateMessage =
    versionConfig.updateMessage[currentLanguage as keyof typeof versionConfig.updateMessage] ||
    versionConfig.updateMessage.es;

  const handleUpdate = async () => {
    const storeUrl =
      Platform.OS === 'ios'
        ? versionConfig.storeUrls.ios
        : versionConfig.storeUrls.android;

    try {
      const supported = await Linking.canOpenURL(storeUrl);
      if (supported) {
        await Linking.openURL(storeUrl);
      } else {
        console.error('No se puede abrir la URL de la tienda:', storeUrl);
      }
    } catch (error) {
      console.error('Error al abrir la tienda:', error);
    }
  };

  return (
    <Modal
      visible={showUpdateModal}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <AlertCircle size={64} color="#FF6B6B" />
          </View>

          <Text style={styles.title}>{t('updateRequired')}</Text>

          <Text style={styles.message}>{updateMessage}</Text>

          <View style={styles.versionInfo}>
            <Text style={styles.versionLabel}>{t('currentVersion')}:</Text>
            <Text style={styles.versionText}>{currentVersion}</Text>
          </View>

          <View style={styles.versionInfo}>
            <Text style={styles.versionLabel}>{t('requiredVersion')}:</Text>
            <Text style={styles.versionTextRequired}>
              {versionConfig.minVersion}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.updateButton}
            onPress={handleUpdate}
            activeOpacity={0.8}
          >
            <Download size={20} color="#FFFFFF" />
            <Text style={styles.updateButtonText}>{t('updateNow')}</Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>{t('updateFooter')}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  versionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  versionLabel: {
    fontSize: 14,
    color: '#999999',
    marginRight: 8,
  },
  versionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  versionTextRequired: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  updateButton: {
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 24,
    width: '100%',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});
