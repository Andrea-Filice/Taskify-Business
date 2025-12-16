const { contextBridge, ipcRenderer, shell, app } = require('electron');

//*API CALLS FOR AVOID NODEINTEGRATION
contextBridge.exposeInMainWorld('api', {
  saveTodos: (payload) => ipcRenderer.send('save-todos', payload),
  checkForDebug: () => ipcRenderer.sendSync('checkForDebug'),
  loadTodosSync: () => ipcRenderer.sendSync('load-todos'),
  showAlert: (message, title) => ipcRenderer.invoke('show-alert', message, title),
  showConfirm: (message) => ipcRenderer.invoke('show-confirm', message),
  newVersion: (message) => ipcRenderer.invoke('new-version', message),
  downloadProgress: (url, latest) => ipcRenderer.invoke('downloadProgress', url, latest),
  shareSettings: (settings) => ipcRenderer.invoke('shareSettings', settings),
  showInputAlert: (category, index) => ipcRenderer.invoke('show-input-alert', category, index),
  inputSend: (updatedText, category) => ipcRenderer.send('inputSend', updatedText, category),
  deleteTask: () => ipcRenderer.send('deleteTask'),
  quitApp: () => ipcRenderer.send('quit-app'),
  saveCompanyName: (name) => ipcRenderer.send('save-companyName', name),
  onTaskModified: (listener) => {
    const wrapped = (event, category, index, taskData) => listener(category, index, taskData);
    ipcRenderer.on('task-modified', wrapped);
    return () => ipcRenderer.removeListener('task-modified', wrapped);
  },
  onDeleteTask: (listener) => {
    const wrapped = (event, category, index) => listener(category, index);
    ipcRenderer.on('delete-task', wrapped);
    return () => ipcRenderer.removeListener('delete-task', wrapped);
  },
  onRetrieveTaskName: (listener) => {
    const wrapped = (event, name) => listener(name);
    ipcRenderer.on('retrieveTaskName', wrapped);
    return () => ipcRenderer.removeListener('retrieveTaskName', wrapped);
  },
  onRetrieveVersion: (listener) => {
    const wrapped = (event, version, elementID) => listener(version, elementID);
    ipcRenderer.on('retrieveVersion', wrapped);
    return () => ipcRenderer.removeListener('retrieveVersion', wrapped);
  },
  onRetrieveSetting: (listener) => {
    const wrapped = (event, characterLimit) => listener(characterLimit);
    ipcRenderer.on('retrieveSetting', wrapped);
    return () => ipcRenderer.removeListener('retrieveSetting', wrapped);
  },
  openExternal: (url) => shell.openExternal(url),
  platform: process.platform,
  arch: process.arch,
  getResourcesPath: () => process.resourcesPath,
  analyzeContent: (input) => ipcRenderer.invoke('analyze-content', input)
});
