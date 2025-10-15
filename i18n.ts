// Define the structure for our translations
type Translations = {
  [key: string]: { [key: string]: string };
};

// Store all translations here
const translations: Translations = {
  en: {
    featuredSermons: 'Featured Sermons',
    viewAll: 'View All',
    welcome: 'Welcome',
    home: 'Home',
    sermons: 'Sermons',
    prayer: 'Prayer',
    bible: 'Bible',
    profile: 'Profile',
    settings: 'Settings',
    // Add all other English translations here
  },
  kn: {
    featuredSermons: 'ವೈಶಿಷ್ಟ್ಯಗೊಳಿಸಿದ ಧರ್ಮೋಪದೇಶಗಳು',
    viewAll: 'ಎಲ್ಲವನ್ನೂ ವೀಕ್ಷಿಸಿ',
    welcome: 'ಸ್ವಾಗತ',
    home: 'ಮುಖಪುಟ',
    sermons: 'ಧರ್ಮೋಪದೇಶಗಳು',
    prayer: 'ಪ್ರಾರ್ಥನೆ',
    bible: 'ಬೈಬಲ್',
    profile: 'ಪ್ರೊಫೈಲ್',
    settings: 'ಸಂಯೋಜನೆಗಳು',
    // Add all other Kannada translations here
  },
};

const i18n = {
  // The locale property that was missing
  locale: 'en', // Default language

  // The translation function
  t: function(key: string): string {
    // Check if the key exists for the current locale, otherwise fallback to English
    const translation = translations[this.locale]?.[key] || translations['en']?.[key] || key;
    return translation;
  },
};

export default i18n;

