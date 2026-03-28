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
  const [isChecking, setIsChecking] = useState<boolean>(false);

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

  const checkVersion = useCallback(async () => {
    if (Platform.OS === 'web') {
      setIsVersionValid(true);
      return;
    }

    setIsChecking(true);
    
    try {
      console.log('🔍 [VersionContext] Verificando versión de la app:', currentVersion);

      const timeoutPromise = new Promise<{ data: null; error: string }>((resolve) => {
        setTimeout(() => {
          console.log('⚠️ [VersionContext] Timeout al verificar versión, permitiendo acceso');
          resolve({ data: null, error: 'timeout' });
        }, 2000);
      });

      const result = await Promise.race([
        getDocument<VersionConfig>('config', 'version'),
        timeoutPromise,
      ]);

      const { data, error } = result;

      if (error || !data) {
        console.log('⚠️ [VersionContext] No se encontró configuración de versión, permitiendo acceso');
        setIsVersionValid(true);
        setIsChecking(false);
        return;
      }

      setVersionConfig(data);

      const isValid = compareVersions(currentVersion, data.minVersion);
      console.log(`📱 [VersionContext] Versión actual: ${currentVersion}`);
      console.log(`📋 [VersionContext] Versión mínima: ${data.minVersion}`);
      console.log(`✅ [VersionContext] Versión válida: ${isValid}`);

      setIsVersionValid(isValid);
      
      if (!isValid && data.forceUpdate) {
        setShowUpdateModal(true);
      }

      setIsChecking(false);
    } catch (error) {
      console.error('❌ [VersionContext] Error verificando versión:', error);
      setIsVersionValid(true);
      setIsChecking(false);
    }
  }, [currentVersion]);

  useEffect(() => {
    console.log('🚀 [VersionContext] Iniciando verificación de versión');
    const timer = setTimeout(() => {
      checkVersion();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [checkVersion]);

  const recheckVersion = useCallback(() => {
    setIsChecking(true);
    checkVersion();
  }, [checkVersion]);

  return useMemo(() => ({
    isVersionValid,
    showUpdateModal,
    versionConfig,
    isChecking,
    currentVersion,
    recheckVersion,
  }), [isVersionValid, showUpdateModal, versionConfig, isChecking, currentVersion, recheckVersion]);
});
