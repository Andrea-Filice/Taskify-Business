const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

let mainWindow = null
const dataPath = path.join(app.getPath('userData'), 'todos.json')

let todos = {
  softwareComponents: [],
  fuoriManutenzione: []
}

function loadTodosFromDisk() {
  try {
    if (fs.existsSync(dataPath)) {
      const raw = fs.readFileSync(dataPath, 'utf-8')
      todos = JSON.parse(raw)
    }
  } catch (err) {
    console.error('Errore nel caricamento di todos.json:', err)
    todos = {
      softwareComponents: [],
      fuoriManutenzione: []
    }
  }
}

function saveTodosToDisk() {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(todos, null, 2), 'utf-8')
  } catch (err) {
    console.error('Errore nel salvataggio di todos.json:', err)
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
  todos = newTodos
  saveTodosToDisk()
})

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