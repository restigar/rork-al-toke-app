import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Globe, Check } from 'lucide-react-native';
import { useLanguage, Language } from '../context/LanguageContext';

export default function LanguageSelector() {
  const [showModal, setShowModal] = useState(false);
  const { currentLanguage, changeLanguage, languages } = useLanguage();

  const handleLanguageSelect = async (lang: Language) => {
    await changeLanguage(lang);
    setShowModal(false);
  };

  const currentLang = languages.find((l) => l.code === currentLanguage);

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowModal(true)}
      >
        <Globe size={22} color="#1a2332" />
        <Text style={styles.flagText}>{currentLang?.flag}</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowModal(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Globe size={24} color="#1a2332" />
              <Text style={styles.modalTitle}>Seleccionar idioma</Text>
            </View>

            <View style={styles.languageList}>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageItem,
                    currentLanguage === lang.code && styles.languageItemSelected,
                  ]}
                  onPress={() => handleLanguageSelect(lang.code)}
                >
                  <View style={styles.languageInfo}>
                    <Text style={styles.flag}>{lang.flag}</Text>
                    <Text
                      style={[
                        styles.languageName,
                        currentLanguage === lang.code && styles.languageNameSelected,
                      ]}
                    >
                      {lang.name}
                    </Text>
                  </View>
                  {currentLanguage === lang.code && (
                    <Check size={20} color="#1a2332" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
  },
  flagText: {
    fontSize: 18,
    color: '#000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 350,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1a2332',
  },
  languageList: {
    gap: 8,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  languageItemSelected: {
    backgroundColor: '#e0f2fe',
    borderWidth: 2,
    borderColor: '#1a2332',
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flag: {
    fontSize: 28,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#374151',
  },
  languageNameSelected: {
    color: '#1a2332',
    fontWeight: '700' as const,
  },
});
