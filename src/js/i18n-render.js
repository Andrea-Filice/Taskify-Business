class I18n {
  constructor() {
    this.translations = {};
    this.currentLanguage = 'en';
    this.fallbackLanguage = 'en';
  }

  async loadTranslations(language) {
    try {
      const translations = await window.api.getTranslations(language);
      this.translations[language] = translations;
      this.currentLanguage = language;
      return true;
    } 
    catch (error) {
      console.error('Error loading translations:', error);
      return false;
    }
  }

  async changeLanguage(language) {
    if (!this.translations[language]) {
      await this.loadTranslations(language);
    }
    this.currentLanguage = language;
    localStorage.setItem('language', language);
    this.translatePage();
  }

  t(key, params = {}) {
    const keys = key.split('.');
    let value = this.translations[this.currentLanguage];

    for (const k of keys) {
      if (value && typeof value === 'object') 
        value = value[k];
        else 
            break;
    }

    if (!value || typeof value === 'object') 
      value = this._getFallback(key);

    if (typeof value === 'string' && params) {
      Object.keys(params).forEach(param => {
        value = value.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
      });
    }

    return value || key;
  }

  _getFallback(key) {
    const keys = key.split('.');
    let value = this.translations[this.fallbackLanguage];
    
    for (const k of keys) {
      if (value && typeof value === 'object') 
        value = value[k];
      else 
        break;
    }
    
    return value || key;
  }

  translatePage() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.t(key);
      
      if (element.tagName === 'INPUT' && element.type !== 'button') 
        element.value = translation;
      else 
        element.textContent = translation;
      
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      element.placeholder = this.t(key);
    });

    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      element.title = this.t(key);
    });

    document.querySelectorAll('[data-i18n-alt]').forEach(element => {
      const key = element.getAttribute('data-i18n-alt');
      element.alt = this.t(key);
    });
  }

  async init() {
    let language = localStorage.getItem('language');
    
    if (!language) {
      language = await window.api.getSystemLanguage();
      localStorage.setItem('language', language);
    }

    await this.loadTranslations(language);
    this.translatePage();
    
    return language;
  }

  getCurrentLanguage() {return this.currentLanguage;}
}

window.i18n = new I18n();