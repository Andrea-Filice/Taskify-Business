const https = require('https');
const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const {spawn} = require('child_process');

const ProgressBar = require('electron-progressbar')

let mainWindow = null
let categoryModifyTask, indexModifyTask, characterLimit
const dataPath = path.join(app.getPath('userData'), 'todos.json')
const DEBUG = true

let todos = {
  softwareComponents: [],
  fuoriManutenzione: [],
  taskCreated: 0,
  taskCompleted: 0,
  autoClose: false,
  joinBeta: true,
  companyName: undefined,
  chartData: { labels: [], created: [], completed: [] },
  taskCompletedColor : "green",
  taskCreatedColor: "blue",
  characterLimit: true
}

function loadTodosFromDisk() {
  try {
    if (fs.existsSync(dataPath)) {
      const raw = fs.readFileSync(dataPath, 'utf-8')
      todos = JSON.parse(raw)
      todos.taskCreated = todos.taskCreated || 0
      todos.taskCompleted = todos.taskCompleted || 0
      todos.autoClose = todos.autoClose || false
      todos.joinBeta = todos.joinBeta || true
      todos.companyName = todos.companyName || undefined
      todos.chartData = todos.chartData || { labels: [], created: [], completed: [] }
      todos.taskCompletedColor = todos.taskCompletedColor || "green"
      todos.taskCreatedColor = todos.taskCreatedColor || "blue"
      todos.characterLimit = typeof todos.characterLimit === 'boolean' ? todos.characterLimit : true;
    }
  } catch (err) {
      console.error(err)
      todos = {
        softwareComponents: [],
        fuoriManutenzione: [],
        taskCreated: 0,
        taskCompleted: 0,
        autoClose: false,
        joinBeta: true,
        companyName: undefined,
        chartData: { labels: [], created: [], completed: [] },
        taskCompletedColor : "green",
        taskCreatedColor: "blue",
        characterLimit: true
      }
  }
}

function saveTodosToDisk() {try {fs.writeFileSync(dataPath, JSON.stringify(todos, null, 2), 'utf-8')} catch (err){console.log(err)}}

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
      webSecurity: true
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

  ipcMain.handle('new-version', async (event, message) => {
    const result = await dialog.showMessageBox({
      type: 'question',
      buttons: ['Install Now', 'Remind me Later'],
      defaultId: 1,
      cancelId: 0,
      message,
      title: 'Taskify Updater',
      noLink: true
    })
    return result.response === 0
  })

  function sanitizeFilename(name) {return name.replace(/[^a-zA-Z0-9._-]/g, '_');}

  function getSafeTempPathFromUrl(urlStr) {
    const parsed = new URL(urlStr);
    const rawName = path.basename(parsed.pathname) || 'installer.exe';
    let safeName = sanitizeFilename(rawName);
    if (!safeName.toLowerCase().endsWith('.exe')) {
      safeName += '.exe';
    }

    return path.join(app.getPath('temp'), safeName);
  }

  //* RETRIEVE HOW MANY MEGABYTES ARE THE NEWER VERSION
  async function retrieveLatestVersion(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const sizeBytes = response.headers.get('content-length');

      if (sizeBytes) {
        const sizeMB = (parseInt(sizeBytes, 10) / (1024 * 1024)).toFixed(2);
        console.log(`[DEBUG] Latest version size: ${sizeMB} MB`);
        return parseFloat(sizeMB);
      } else {
        console.warn('[DEBUG] Content-Length not available.');
        return 0;
      }
    } catch (error) {
      console.error('[DEBUG] Error retrieving version size:', error);
      return 0;
    }
  }

  //* DOWNLOAD FILE AND UPDATE PROGRESSBAR
  async function downloadFileWithProgress(url, totalMB, progressBar, mainWindow) {
    const maxRedirects = 10;

    function chooseFilenameFrom(response, requestedUrl) {
      const cd = response.headers['content-disposition'];
      if (cd) {
        const match = cd.match(/filename\*=UTF-8''([^;]+)|filename="([^"]+)"|filename=([^;]+)/i);
        if (match) {
          const fn = decodeURIComponent((match[1] || match[2] || match[3]).trim());
          return sanitizeFilename(path.basename(fn));
        }
      }
      try {
        const parsed = new URL(requestedUrl);
        const raw = path.basename(parsed.pathname) || 'installer.exe';
        return sanitizeFilename(raw);
      } catch (e) {
        return 'installer.exe';
      }
    }

    return new Promise((resolve, reject) => {
      let redirects = 0;
      let requestedUrl = url;

      function doRequest(currentUrl) {
        requestedUrl = currentUrl;
        let outputPath;
        try {
          const safeNameGuess = sanitizeFilename(path.basename(new URL(currentUrl).pathname) || 'installer.exe');
          outputPath = path.join(app.getPath('temp'), safeNameGuess + '.download');
        } catch (e) {
          outputPath = path.join(app.getPath('temp'), 'installer.tmp.download');
        }

        console.log('[DEBUG] request URL:', currentUrl);
        console.log('[DEBUG] provisional outputPath:', outputPath);

        try { fs.mkdirSync(path.dirname(outputPath), { recursive: true }); } catch (e) {}

        const file = fs.createWriteStream(outputPath, { flags: 'w' });

        const req = https.get(encodeURI(currentUrl), response => {
          console.log('[DEBUG] HTTP statusCode:', response.statusCode);
          if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            const loc = response.headers.location.startsWith('http') ? response.headers.location : new URL(response.headers.location, currentUrl).toString();
            console.log('[DEBUG] redirect to:', loc);
            file.close();
            req.destroy();
            redirects += 1;
            if (redirects > maxRedirects) {
              return reject(new Error('Too many redirects'));
            }
            return doRequest(loc);
          }

          if (response.statusCode !== 200) {
            file.close();
            fs.unlink(outputPath, () => {});
            return reject(new Error(`HTTP ${response.statusCode}`));
          }

          const chosenName = chooseFilenameFrom(response, currentUrl);
          const finalPath = path.join(app.getPath('temp'), chosenName);
          console.log('[DEBUG] chosen filename:', chosenName);
          console.log('[DEBUG] switching provisional path -> final path:', finalPath);

          const provisionalPath = outputPath;

          const totalBytes = parseInt(response.headers['content-length'], 10);
          let downloadedBytes = 0;

          if (!isNaN(totalBytes)) {
            try { progressBar.max = totalBytes / (1024 * 1024); } catch (e) {}
          } else if (totalMB) {
            try { progressBar.max = totalMB; } catch (e) {}
          }

          response.on('data', chunk => {
            downloadedBytes += chunk.length;
            const downloadedMB = downloadedBytes / (1024 * 1024);

            try {
              progressBar.value = downloadedMB;
            } catch (e) {
              if (mainWindow && mainWindow.webContents) {
                mainWindow.webContents.send('download-progress', { mb: downloadedMB, totalMB: isNaN(totalBytes) ? null : totalBytes / (1024 * 1024) });
              }
            }

            try { progressBar.detail = `Downloading ${downloadedMB.toFixed(2)}Mb out of ${totalMB}Mb...`; } 
            catch (e) {}
          });

          response.on('error', err => {
            file.destroy();
            fs.unlink(provisionalPath, () => {});
            reject(err);
          });

          file.on('error', err => {
            response.destroy();
            fs.unlink(provisionalPath, () => {});
            reject(err);
          });

          file.on('finish', () => {
            file.close(err => {
              if (err) return reject(err);
              try {
                const stats = fs.statSync(outputPath);
                console.log('[DEBUG] Download complete:', outputPath);
                console.log('[DEBUG] final file size:', stats.size);
                if (stats.size === 0) return reject(new Error('Downloaded file is empty'));

                let finalPath = outputPath;
                if (!finalPath.toLowerCase().endsWith('.exe')) {
                  finalPath += '.exe';
                  fs.renameSync(outputPath, finalPath);
                  console.log('[DEBUG] Renamed to:', finalPath);
                }

                resolve(finalPath);
              } catch (e) {
                reject(e);
              }
            });
          });
          response.pipe(file);
        });

        req.on('error', err => {
          fs.unlink(outputPath, () => {});
          reject(err);
        });
      }

      doRequest(requestedUrl);
    });
  }


  //* AFTER DOWNLOAD, CLOSE & RUN INSTALLER
  async function downloadAndInstallUpdate(filePath, latestVersion) {
    try {
      console.log(`[DEBUG] launching installer ${filePath}`);

      if (!fs.existsSync(filePath)) {
        console.error('[DEBUG] installer not found:', filePath);
        return { ok: false, message: 'installer not found' };
      }

      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        console.error('[DEBUG] installer is empty');
        return { ok: false, message: 'installer is empty' };
      }

      if (process.platform === 'win32') {
        const child = spawn('cmd', ['/c', 'start', '""', filePath], {
          detached: true,
          stdio: 'ignore',
          shell: false
        });
        child.on('error', err => console.error('[DEBUG] spawn error:', err));
        child.unref();
      } else {
        const child = spawn(filePath, [], {
          detached: true,
          stdio: 'ignore',
          shell: true
        });
        child.on('error', err => console.error('[DEBUG] spawn error:', err));
        child.unref();
      }

      app.quit();
      return { ok: true };
    } catch (error) {
      console.error('[DEBUG] Error launching installer:', error);
      return { ok: false, message: error.message };
    }
  }

  ipcMain.handle('downloadProgress', async (event, url, latestVersion) => {
    const megabytesTotal = await retrieveLatestVersion(url);

    const progressBar = new ProgressBar({
      indeterminate: false,
      maxValue: megabytesTotal,
      text: `Updating Taskify to ${latestVersion}`,
      detail: `Downloading 0Mb out of ${megabytesTotal}Mb...`
    });

    try {
      const downloadedPath = await downloadFileWithProgress(url, megabytesTotal, progressBar, null);
      console.log('[DEBUG] downloadFileWithProgress returned:', downloadedPath);

      progressBar.detail = "Download completed, follow the on-screen instructions.";
      setTimeout(() => {
        progressBar.close();
      }, 3000);

      const installResult = await downloadAndInstallUpdate(downloadedPath, latestVersion);
      if (!installResult.ok) {
        console.error('[DEBUG] installResult error:', installResult.message);
        return { ok: false, message: installResult.message };
      }

      return { ok: true, path: downloadedPath };
    } 
    catch (err) {
      console.error('[DEBUG] download handler failed:', err);
      try { progressBar.close(); }
      catch(e){ console.log('[DEBUG] Unknown Error'); }
      return { ok: false, message: err.message || String(err) };
    }
  });

  ipcMain.handle('show-alert', async (event, message, title) => {
    await dialog.showMessageBox({
      type: 'info',
      buttons: ['OK'],
      defaultId: 0,
      message,
      title: (title == "" || title == undefined) ? "Taskify Business" : title,
      noLink: true,
      modal: true,
      parent: mainWindow
    });
  })

  ipcMain.handle('show-input-alert', (event, category, index) => {
    categoryModifyTask = category
    indexModifyTask = index
    createInputPopUp()
  })

  ipcMain.on('checkForDebug', (event) => {event.returnValue = DEBUG;});

  ipcMain.on('inputSend', (event, updatedText, category) =>{
    switch(category){
      case "task_name":
        todos[categoryModifyTask][indexModifyTask].text = updatedText.trim();
        saveTodosToDisk();
        mainWindow.webContents.send('task-modified', categoryModifyTask, indexModifyTask, {
            text: todos[categoryModifyTask][indexModifyTask].text,
            prevVersion: todos[categoryModifyTask][indexModifyTask].prevVersion,
            nextVersion: todos[categoryModifyTask][indexModifyTask].nextVersion
        });
        break;
      case "prev_version":
        todos[categoryModifyTask][indexModifyTask].prevVersion = updatedText.trim();
        saveTodosToDisk();
        mainWindow.webContents.send('task-modified', categoryModifyTask, indexModifyTask, {
            text: todos[categoryModifyTask][indexModifyTask].text,
            prevVersion: todos[categoryModifyTask][indexModifyTask].prevVersion,
            nextVersion: todos[categoryModifyTask][indexModifyTask].nextVersion
        });
        break;
      case "next_version":
        todos[categoryModifyTask][indexModifyTask].nextVersion = updatedText.trim();
        saveTodosToDisk();
        mainWindow.webContents.send('task-modified', categoryModifyTask, indexModifyTask, {
            text: todos[categoryModifyTask][indexModifyTask].text,
            prevVersion: todos[categoryModifyTask][indexModifyTask].prevVersion,
            nextVersion: todos[categoryModifyTask][indexModifyTask].nextVersion
        });
        break;
    }
  });

  ipcMain.on('deleteTask', () =>{mainWindow.webContents.send('delete-task', categoryModifyTask, indexModifyTask);});
  ipcMain.on('load-todos', event => {event.returnValue = todos;})
  ipcMain.handle('shareSettings', (event, settings) => {characterLimit = settings})

  ipcMain.on('save-todos', (event, newTodos) => {
    todos = { ...todos, ...newTodos }
    saveTodosToDisk()
  })

  ipcMain.on('quit-app', () => {app.quit()})

  ipcMain.on('save-companyName', (event, companyName) => {
    todos.companyName = companyName;
    saveTodosToDisk();
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if(DEBUG){
      if (input.key.toLowerCase() === 'r' && input.control) {
        event.preventDefault()
        mainWindow.reload()
      }
      if (input.key.toLowerCase() === 'i' && input.control && input.shift) 
        mainWindow.webContents.openDevTools()
    }
  })

  mainWindow.on('closed', () => {mainWindow = null})
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

app.on('activate', () => {if (!mainWindow) createWindow()})

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
      webSecurity: true
    },
    icon: 'src/assets/icon.ico'
  })
  inputWindow.setMenu(null)
  inputWindow.loadFile('src/popUp.html')

  const task = todos[categoryModifyTask][indexModifyTask];
  if (task) {
    inputWindow.webContents.once('did-finish-load', () => {
      inputWindow.webContents.send('retrieveTaskName', task.text);
      inputWindow.webContents.send('retrieveVersion', task.prevVersion, "inputPV");
      inputWindow.webContents.send('retrieveVersion', task.nextVersion, "inputNV");
      inputWindow.webContents.send('retrieveSetting', characterLimit)
    });
  }
}