const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')

let mainWindow = null
let categoryModifyTask, indexModifyTask
const dataPath = path.join(app.getPath('userData'), 'todos.json')

let todos = {
  softwareComponents: [],
  fuoriManutenzione: [],
  taskCreated: 0,
  taskCompleted: 0,
  autoClose: false,
  companyName: undefined,
  chartData: { labels: [], created: [], completed: [] }
}

function loadTodosFromDisk() {
  try {
    if (fs.existsSync(dataPath)) {
      const raw = fs.readFileSync(dataPath, 'utf-8')
      todos = JSON.parse(raw)
      todos.taskCreated = todos.taskCreated || 0
      todos.taskCompleted = todos.taskCompleted || 0
      todos.autoClose = todos.autoClose || false
      todos.companyName = todos.companyName || undefined
      todos.chartData = todos.chartData || { labels: [], created: [], completed: [] }
    }
  } catch (err) {
    console.error(err)
    todos = {
      softwareComponents: [],
      fuoriManutenzione: [],
      taskCreated: 0,
      taskCompleted: 0,
      autoClose: false,
      companyName: undefined,
      chartData: { labels: [], created: [], completed: [] }
    }
  }
}

function saveTodosToDisk() {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(todos, null, 2), 'utf-8')
  } catch (err) {
    console.error(err)
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
    icon: 'src/assets/icon.ico'
  })

  mainWindow.setMenu(null)
  mainWindow.loadFile('src/boot.html')

  ipcMain.handle('show-confirm', async (event, message) => {
    const result = await dialog.showMessageBox({
      type: 'question',
      buttons: ['OK', 'Cancel'],
      defaultId: 1,
      cancelId: 0,
      message,
      title: 'Taskify Business',
      noLink: true
    })
    return result.response === 0
  })

  ipcMain.handle('show-alert', async (event, message) => {
    await dialog.showMessageBox({
      type: 'info',
      buttons: ['OK'],
      defaultId: 0,
      message,
      title: 'Taskify Business',
      noLink: true
    })
  })

  ipcMain.handle('show-input-alert', (event, category, index) => {
    categoryModifyTask = category
    indexModifyTask = index
    createInputPopUp()
    const task = todos[categoryModifyTask][indexModifyTask]
    if (task) {
      setTimeout(() => {
        mainWindow.webContents.send('populate-input', task.text)
      }, 500)
    }
  })

  ipcMain.on('inputName-submitted', (event, updatedText) => {
    todos[categoryModifyTask][indexModifyTask].text = updatedText.trim();
    saveTodosToDisk();
    mainWindow.webContents.send('task-modified', categoryModifyTask, indexModifyTask, {
        text: todos[categoryModifyTask][indexModifyTask].text,
        prevVersion: todos[categoryModifyTask][indexModifyTask].prevVersion,
        nextVersion: todos[categoryModifyTask][indexModifyTask].nextVersion
    });
  })

  ipcMain.on('inputPV-submitted', (event, updatedText) => {
    todos[categoryModifyTask][indexModifyTask].prevVersion = updatedText.trim();
    saveTodosToDisk();
    mainWindow.webContents.send('task-modified', categoryModifyTask, indexModifyTask, {
        text: todos[categoryModifyTask][indexModifyTask].text,
        prevVersion: todos[categoryModifyTask][indexModifyTask].prevVersion,
        nextVersion: todos[categoryModifyTask][indexModifyTask].nextVersion
    });
  });

  ipcMain.on('inputNV-submitted', (event, updatedText) => {
    todos[categoryModifyTask][indexModifyTask].nextVersion = updatedText.trim();
    saveTodosToDisk();
    mainWindow.webContents.send('task-modified', categoryModifyTask, indexModifyTask, {
        text: todos[categoryModifyTask][indexModifyTask].text,
        prevVersion: todos[categoryModifyTask][indexModifyTask].prevVersion,
        nextVersion: todos[categoryModifyTask][indexModifyTask].nextVersion
    });
  });

  ipcMain.on('deleteTask', () =>{
    mainWindow.webContents.send('delete-task', categoryModifyTask, indexModifyTask);
  });

  ipcMain.on('load-todos', event => {
    event.returnValue = todos
  })

  ipcMain.on('save-todos', (event, newTodos) => {
    todos = { ...todos, ...newTodos }
    saveTodosToDisk()
  })

  ipcMain.on('quit-app', () => {
    app.quit()
  })

  ipcMain.on('save-companyName', (event, companyName) => {
    todos.companyName = companyName;
    saveTodosToDisk();
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key.toLowerCase() === 'r' && input.control) {
      event.preventDefault()
      mainWindow.reload()
    }
    if (input.key.toLowerCase() === 'i' && input.control && input.shift) {
      mainWindow.webContents.openDevTools()
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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    saveTodosToDisk()
    app.quit()
  }
})

app.on('activate', () => {
  if (!mainWindow) createWindow()
})

function createInputPopUp() {
  const inputWindow = new BrowserWindow({
    width: 600,
    height: 450,
    fullscreenable: false,
    resizable: false,
    show: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
    icon: 'src/assets/icon.ico'
  })

  //DEBUG
  //inputWindow.webContents.openDevTools(); 
  inputWindow.setMenu(null)
  inputWindow.loadFile('src/popUp.html')
}