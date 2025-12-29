const https = require('https');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const {spawn} = require('child_process');
const { https: httpsFollow } = require('follow-redirects');

const ProgressBar = require('electron-progressbar');

let mainWindow = null;
let categoryModifyTask, indexModifyTask, characterLimit;
const dataPath = path.join(app.getPath('userData'), 'todos.json');
const DEBUG = process.argv.includes("--dev");

let todos = {
  softwareComponents: [],
  fuoriManutenzione: [],
  taskCreated: 0,
  taskCompleted: 0,
  autoClose: false,
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
        companyName: undefined,
        chartData: { labels: [], created: [], completed: [] },
        taskCompletedColor : "green",
        taskCreatedColor: "blue",
        characterLimit: true
      }
  }
}

function saveTodosToDisk() {try {fs.writeFileSync(dataPath, JSON.stringify(todos, null, 2), 'utf-8')} catch (err){console.log("[🐛 DEBUG] <color='red'>UNKNOWN ERROR: </color> " + err);}}

function createWindow() {
  let width, height;

  //* SET THE WIDTH AND HEIGHT BETWEEN LINUX AND OTHER PLATFORMS
  //? LINUX HAVE A MINOR RENDERING SCALE.
  width = (process.platform == "linux") ? 1100 : 1000;
  height = (process.platform == "linux") ? 650 : 600;

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    fullscreenable: false,
    resizable: false,
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'src', 'js', 'preload.js'),
      webSecurity: true
    },
    icon: 'src/assets/icon.ico',
    maximizable: false
  })

  mainWindow.setMenu(null)
  mainWindow.loadFile('src/boot.html')

  ipcMain.handle('show-confirm', async (event, message) => {
    const currentWin = BrowserWindow.fromWebContents(event.sender);

    const result = await dialog.showMessageBox(currentWin, {
      type: 'question',
      buttons: ['OK', 'Cancel'],
      defaultId: 1,
      cancelId: 0,
      message,
      title: 'Taskify Business',
      noLink: true,
      modal: true
    })
    return result.response === 0
  })

  ipcMain.handle('new-version', async (event, message) => {
    const currentWin = BrowserWindow.fromWebContents(event.sender);

    const result = await dialog.showMessageBox(currentWin, {
      type: 'question',
      buttons: ['Install Now', 'Remind me Later'],
      defaultId: 0,
      cancelId: 1,
      message,
      title: 'Taskify Updater',
      noLink: true,
      modal: true
    })
    return result.response === 0
  })

  ipcMain.handle('open-external', async (event, url) => {
    try {
      const { shell } = require('electron');
      await shell.openExternal(url);
      return { ok: true };
    } catch (err) {
      console.error('[🐛 DEBUG] open-external failed:', err);
      return { ok: false, error: String(err) };
    }
  });

  ipcMain.handle('analyze-content', async (event, input) => {
    return new Promise((resolve, reject) => {
      try {
        const unpackedPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'src', 'ai', 'contentAnalizer.py');
        const packedPath = path.join(process.resourcesPath, 'src', 'ai', 'contentAnalizer.py');
        const isDev = DEBUG || process.argv.includes('--dev');
        const scriptPath = isDev ? path.join(__dirname, 'src', 'ai', 'contentAnalizer.py') : (fs.existsSync(unpackedPath) ? unpackedPath : packedPath);

        const child = spawn('python', [scriptPath, input], { shell: false });
        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => { stdout += data.toString(); });
        child.stderr.on('data', (data) => { stderr += data.toString(); });

        child.on('error', (err) => {
          console.error('[🐛 DEBUG] analyze-content error:', err);
          reject(err);
        });

        child.on('close', (code) => {
          if (code !== 0) {
            console.error('[🐛 DEBUG] analyze-content stderr:', stderr);
            return reject(new Error(stderr || `Exit code ${code}`));
          }
          try {
            const parsed = JSON.parse(stdout);
            resolve(parsed);
          } catch (e) {
            resolve(stdout);
          }
        });
      } catch (e) { reject(e); }
    });
  })

  //* CLEAN THE NAME OF THE INSTALLER
  function sanitizeFilename(name) {return name.replace(/[^a-zA-Z0-9._-]/g, '_');}

  function getSafeTempPathFromUrl(urlStr) {
    const parsed = new URL(urlStr);
    
    //* CLASSIC NAME FOR ALL OPERATING SYSTEMS
    let rawName;
    switch(process.platform){
      case "win32":
        rawName = path.basename(parsed.pathname) || 'installer.exe';
        break;
      case "linux":
        rawName = path.basename(parsed.pathname) || 'installer.deb';
        break;
      case "darwin":
        rawName = path.basename(parsed.pathname) || 'installer.dmg';
        break;
    }

    //* IF THE NAME IS NOT CORRECT, SANITIZE IT
    let safeName = sanitizeFilename(rawName);

    switch(process.platform){
      case "win32":
        if (!safeName.toLowerCase().endsWith('.exe'))
          safeName += '.exe';
        break;
      case "linux":
        if (!safeName.toLowerCase().endsWith('.deb'))
          safeName += '.deb';
        break;
      case "darwin":
        if (!safeName.toLowerCase().endsWith('.dmg'))
          safeName += '.dmg';
        break;
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
        console.log(`[ℹ️ INFO] Latest version size: ${sizeMB} MB`);
        return parseFloat(sizeMB);
      } else {
        console.warn('[🐛 DEBUG] Content-Length not available.');
        return 0;
      }
    } catch (error) {
      console.error('[🐛 DEBUG] Error retrieving version size:', error);
      return 0;
    }
  }

  //* DOWNLOAD FILE AND UPDATE PROGRESSBAR
  async function downloadFileWithProgress(url, totalMB, progressBar, mainWindow) {
    const maxRedirects = 10;
    const maxRetries = 2;
    const requestTimeout = 60000; 

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
        
        //* CLASSIC NAME FOR ALL OPERATING SYSTEM
        let raw;

        switch(process.platform){
          case "win32":
            raw = path.basename(parsed.pathname) || 'installer.exe';
            break;
          case "linux":
            raw = path.basename(parsed.pathname) || 'installer.deb';
            break;
          case "darwin":
            raw = path.basename(parsed.pathname) || 'installer.dmg';
            break;
        }

        return sanitizeFilename(raw);
      } catch (e) {
        console.log('[🐛 DEBUG] URL parsing failed, using default name.');
      }
    }

    return new Promise((resolve, reject) => {
      let retries = 0;

      function doRequest(currentUrl) {
        let provisionalName;
        try {
          provisionalName = sanitizeFilename(path.basename(new URL(currentUrl).pathname) || 'installer') + '.download';
        } catch (e) {
          provisionalName = 'installer.tmp.download';
        }
        const provisionalPath = path.join(app.getPath('temp'), provisionalName);
        try { fs.mkdirSync(path.dirname(provisionalPath), { recursive: true }); } catch (e) {}

        console.log('[🐛 DEBUG] request URL:', currentUrl);
        console.log('[🐛 DEBUG] provisional outputPath:', provisionalPath);

        const req = httpsFollow.request(encodeURI(currentUrl), {
          method: 'GET',
          agent: false,
          timeout: requestTimeout,
          maxRedirects
        }, response => {
          console.log('[🐛 DEBUG] HTTP statusCode:', response.statusCode);

          if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            const loc = response.headers.location.startsWith('http') ? response.headers.location : new URL(response.headers.location, currentUrl).toString();
            console.log('[🐛 DEBUG] redirect to:', loc);
            req.destroy();
            return doRequest(loc);
          }

          if (response.statusCode !== 200) {
            req.destroy();
            return reject(new Error(`HTTP ${response.statusCode}`));
          }

          const chosenName = chooseFilenameFrom(response, currentUrl);
          let finalPath = path.join(app.getPath('temp'), chosenName);
          console.log('[🐛 DEBUG] chosen filename:', chosenName);
          console.log('[🐛 DEBUG] switching provisional path -> final path:', finalPath);

          const file = fs.createWriteStream(provisionalPath, { flags: 'w' });
          let downloadedBytes = 0;
          const totalBytes = parseInt(response.headers['content-length'], 10);

          if (!isNaN(totalBytes)) 
            try { progressBar.max = totalBytes / (1024 * 1024); } catch (e) {}
          else if (totalMB) 
            try { progressBar.max = totalMB; } catch (e) {}

          response.on('data', chunk => {
            downloadedBytes += chunk.length;
            const downloadedMB = downloadedBytes / (1024 * 1024);
            try {
              progressBar.value = downloadedMB;
              progressBar.detail = `Downloading ${downloadedMB.toFixed(2)}Mb out of ${progressBar.getOptions().maxValue}Mb...`;
            } catch (e) {
              if (mainWindow && mainWindow.webContents) 
                mainWindow.webContents.send('download-progress', { mb: downloadedMB, totalMB: isNaN(totalBytes) ? null : totalBytes / (1024 * 1024) });
            }
          });

          response.on('error', err => {
            file.destroy();
            try { fs.unlinkSync(provisionalPath); } catch (e) {}
            reject(err);
          });

          file.on('error', err => {
            response.destroy();
            try { fs.unlinkSync(provisionalPath); } catch (e) {}
            reject(err);
          });

          file.on('finish', () => {
            file.close(err => {
              if (err) {
                try { fs.unlinkSync(provisionalPath); } catch (e) {}
                return reject(err);
              }
              try {
                const stats = fs.statSync(provisionalPath);
                console.log('[🐛 DEBUG] provisional file written size:', stats.size);
                if (stats.size === 0) {
                  try { fs.unlinkSync(provisionalPath); } catch (e) {}
                  return reject(new Error('Downloaded file is empty'));
                }
                switch(process.platform){
                  case "win32":
                    if (!finalPath.toLowerCase().endsWith('.exe'))
                      finalPath += '.exe';
                    break;
                  case "linux":
                    if (!finalPath.toLowerCase().endsWith('.deb'))
                      finalPath += '.deb';
                    break;
                  case "darwin":
                    if (!finalPath.toLowerCase().endsWith('.dmg'))
                      finalPath += '.dmg';
                    break;
                }

                try {
                  if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
                  fs.renameSync(provisionalPath, finalPath);
                  console.log('[🐛 DEBUG] moved to final path:', finalPath);
                  return resolve(finalPath);
                } catch (renameErr) {
                  console.warn('[🐛 DEBUG] rename failed, keeping provisional file as fallback:', renameErr);
                  return resolve(provisionalPath);
                }
              } catch (e) {
                try { fs.unlinkSync(provisionalPath); } catch (ee) {}
                return reject(e);
              }
            });
          });
          response.pipe(file);
        });

        req.on('timeout', () => {
          console.warn('[🐛 DEBUG] request timeout');
          req.destroy(new Error('Request timeout'));
        });

        req.on('error', err => {
          console.error('[🐛 DEBUG] request error:', err && err.code ? err.code : err);
          try { fs.unlinkSync(provisionalPath); } catch (e) {}

          if ((err.code === 'ECONNRESET' || err.message === 'aborted') && retries < maxRetries) {
            retries += 1;
            console.log(`[🐛 DEBUG] retrying download (${retries}/${maxRetries})...`);
            return setTimeout(() => doRequest(url), 500 * retries);
          }
          
          return reject(err);
        });
        req.end();
      }

      doRequest(url);
    });
  }

  //* AFTER DOWNLOAD, CLOSE & RUN INSTALLER
  async function downloadAndInstallUpdate(filePath, latestVersion) {
    try {
      console.log(`[ℹ️ INFO] launching installer ${filePath}`);

      if (!fs.existsSync(filePath)) {
        console.error('[🐛 DEBUG] installer not found:', filePath);
        mainWindow.webContents.send("show-alert", "There was an error during the downloading of the Installer.", "Taskify Updater - Error")
        return { ok: false, message: 'installer not found' };
      }

      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        console.error('[🐛 DEBUG] installer is empty');
        mainWindow.webContents.send("show-alert", "There was an error during the downloading of the Installer.", "Taskify Updater - Error")
        return { ok: false, message: 'installer is empty' };
      }

      if (process.platform === 'win32') {
        const child = spawn('cmd', ['/c', 'start', '""', filePath], {
          detached: true,
          stdio: 'ignore',
          shell: false
        });
        child.on('error', err => console.error('[🐛 DEBUG] spawn error:', err));
        child.unref();
      } 
      else if (process.platform === 'linux'){
        const opener = 'xdg-open';
        const child = spawn(opener, [filePath], {
          detached: true,
          stdio: 'ignore',
          shell: false
        });
        child.on('error', err => console.error('[🐛 DEBUG] spawn error:', err));
        child.unref();
      }
      else if(process.platform === 'darwin'){
        const child = spawn('open', [filePath], {
          detached: true,
          stdio: 'ignore',
          shell: false
        });
        child.on('error', err => console.error('[🐛 DEBUG] spawn error:', err));
        child.unref();
      }

      app.quit();
      return { ok: true };
    } 
    catch (error) {
      console.error('[🐛 DEBUG] Error launching installer:', error);
      mainWindow.webContents.send("show-alert", "There was an error during the launch of the Installer.", "Taskify Updater - Error")
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
      console.log('[ℹ️ INFO] downloadFileWithProgress returned:', downloadedPath);

      progressBar.detail = "Download completed, follow the on-screen instructions.";
      setTimeout(() => {
        progressBar.close();
      }, 3000);

      const installResult = await downloadAndInstallUpdate(downloadedPath, latestVersion);
      if (!installResult.ok) {
        console.error('[ℹ️ INFO] installResult error:', installResult.message);
        return { ok: false, message: installResult.message };
      }

      return { ok: true, path: downloadedPath };
    } 
    catch (err) {
      console.error('[🐛 DEBUG] download handler failed:', err);
      mainWindow.webContents.send("show-alert", "There was an unknown error during the installation.", "Taskify Updater - Error");
      try { progressBar.close(); }
      catch(e){ console.log('[🐛 DEBUG] Unknown Error'); }
      return { ok: false, message: err.message || String(err) };
    }
  });

  ipcMain.handle('show-alert', async (event, message, title) => {
    const currentWin = BrowserWindow.fromWebContents(event.sender);

    await dialog.showMessageBox(currentWin, {
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
  const height = (process.platform == "linux") ? 480 : 450;

  const inputWindow = new BrowserWindow({
    width: 600,
    height: height,
    fullscreenable: false,
    resizable: false,
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'src', 'js', 'preload.js'),
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