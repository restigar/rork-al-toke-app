import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getDocument } from '@/lib/firebase-firestore';

interface VersionConfig {
  minVersion: string;
  recommendedVersion: string;
  forceUpdate: boolean;
  updateMessage: {
    es: string;
    en: string;
    pt: string;
    fr: string;
  };
  storeUrls: {
    ios: string;
    android: string;
  };
}

export const [VersionProvider, useVersion] = createContextHook(() => {
  const [isVersionValid, setIsVersionValid] = useState<boolean>(true);
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
  const [versionConfig, setVersionConfig] = useState<VersionConfig | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  const currentVersion = Constants.expoConfig?.version || '1.0.0';

  const compareVersions = (current: string, minimum: string): boolean => {
    const currentParts = current.split('.').map(Number);
    const minimumParts = minimum.split('.').map(Number);

    for (let i = 0; i < Math.max(currentParts.length, minimumParts.length); i++) {
      const currentPart = currentParts[i] || 0;
      const minimumPart = minimumParts[i] || 0;

      if (currentPart > minimumPart) return true;
      if (currentPart < minimumPart) return false;
    }

    return true;
  };

  const checkVersion = async () => {
    if (Platform.OS === 'web') {
      setIsChecking(false);
      setIsVersionValid(true);
      return;
    }

    try {
      console.log('🔍 Verificando versión de la app:', currentVersion);

      const { data, error } = await getDocument<VersionConfig>('config', 'version');

      if (error || !data) {
        console.log('⚠️ No se encontró configuración de versión, permitiendo acceso');
        setIsVersionValid(true);
        setIsChecking(false);
        return;
      }

      setVersionConfig(data);

      const isValid = compareVersions(currentVersion, data.minVersion);
      console.log(`📱 Versión actual: ${currentVersion}`);
      console.log(`📋 Versión mínima: ${data.minVersion}`);
      console.log(`✅ Versión válida: ${isValid}`);

      setIsVersionValid(isValid);
      
      if (!isValid && data.forceUpdate) {
        setShowUpdateModal(true);
      }

      setIsChecking(false);
    } catch (error) {
      console.error('❌ Error verificando versión:', error);
      setIsVersionValid(true);
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkVersion();
  }, []);

  const recheckVersion = useCallback(() => {
    setIsChecking(true);
    checkVersion();
  }, []);

  return useMemo(() => ({
    isVersionValid,
    showUpdateModal,
    versionConfig,
    isChecking,
    currentVersion,
    recheckVersion,
  }), [isVersionValid, showUpdateModal, versionConfig, isChecking, currentVersion, recheckVersion]);
});
