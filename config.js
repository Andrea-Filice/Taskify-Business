const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const { json } = require('stream/consumers')

let mainWindow = null
const dataPath = path.join(app.getPath('userData'), 'todos.json')

let todos = {
  softwareComponents: [],
  fuoriManutenzione: [],
  taskCreated: 0,
  taskCompleted: 0,
  autoClose: false,
  companyName: undefined
}

function loadTodosFromDisk() {
  try {
    if (fs.existsSync(dataPath)) {
      const raw = fs.readFileSync(dataPath, 'utf-8');
      todos = JSON.parse(raw);
      todos.taskCreated = todos.taskCreated || 0;
      todos.taskCompleted = todos.taskCompleted || 0;
      todos.autoClose = todos.autoClose || false;
      todos.companyName = todos.companyName || undefined;
    }
  } catch (err) {
    console.error('Error: ', err);
    todos = {
      softwareComponents: [],
      fuoriManutenzione: [],
      taskCreated: 0,
      taskCompleted: 0,
      autoClose: false,
      companyName: undefined
    };
  }
}

function saveTodosToDisk() {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(todos, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving todos.json:', err);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    fullscreenable: false,
    resizable: false,
    show: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
    icon: 'src/assets/icon.ico',
  })

  mainWindow.setMenu(null)
  mainWindow.loadFile('src/boot.html')

  ipcMain.handle('show-confirm', async (event, message) => {
    const result = await dialog.showMessageBox({
      type: 'question',
      buttons: ['OK', 'Annulla'],
      defaultId: 1,
      cancelId: 0,
      message: message,
      title: 'Taskify Business',
      noLink: true
    });
    return result.response === 0;
  });

  ipcMain.handle('show-alert', async (event, message) => {
    const result = await dialog.showMessageBox({
      type: 'question',
      defaultId: 1,
      cancelId: 0,
      message: message,
      title: 'Taskify Business',
      noLink: true
    });
    return result.response === 0;
  });
  
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key.toLowerCase() === 'r' && input.control) {
      event.preventDefault()
      mainWindow.reload()
    }
    if (input.key.toLowerCase() === 'i' && input.control && input.shift) {
      mainWindow.webContents.openDevTools();
    }
  })
  
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  loadTodosFromDisk()
  createWindow()
})

ipcMain.on('load-todos', event => {
  event.returnValue = todos
})

ipcMain.on('save-todos', (event, newTodos) => {
  todos = {
    ...todos,
    ...newTodos
  };
  saveTodosToDisk();
});

ipcMain.on('save-companyName', (event, companyName) => {
  todos = {
    companyName: companyName
  }
  saveTodosToDisk();
});

ipcMain.on('quit-app', () => {
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    saveTodosToDisk()
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})