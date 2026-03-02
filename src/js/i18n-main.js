const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const path = require('path');
const { app } = require('electron');

const isDev = !app.isPackaged;

const i18nMainConfig = {
    backend: {
        loadPath: isDev ? path.join(__dirname, "../locales/{{lng}}/translations.json") : path.join(process.resourcesPath, 'app.asar/src/locales/{{lng}}/translations.json')
    },
    interpolation: {
        escapeValue: false
    },
    lng: 'en'
}

i18next
    .use(Backend)
    .init(i18nMainConfig);

module.exports = i18next;