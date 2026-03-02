let latestVersion, currentVersion;

function isNewerVersion(latest, current) {
  if (!latest || !current) return false;

  const a = latest.split('.').map(x => parseInt(x, 10) || 0);
  const b = current.split('.').map(x => parseInt(x, 10) || 0);
  const len = Math.max(a.length, b.length);

  for (let i = 0; i < len; i++) {
    const ai = a[i] || 0;
    const bi = b[i] || 0;
    if (ai > bi) return true;
    if (ai < bi) return false;
  }
  
  return false;
}

async function startUpdates(){
  try{
    const [localData, remoteData] = await Promise.all([
      fetch('version.json').then(res => res.json()),
      fetch('https://cdn-playepik.netlify.app/dependencies/dependencies.json?t=' + Date.now()).then(res => res.json())
    ]);

    currentVersion = localData.Version;
    document.getElementById('version').innerHTML = `<img src="assets/_icon.png" alt="Icon Logo" width="30px" height="30px" draggable="false">&nbsp; Taskify Business ` + currentVersion;
    document.getElementById('build').innerHTML = window.i18n.t('settings.buildNumber') + localData.BuildNumber + ' <img src="assets/_updateWarn.png" alt="Update available" draggable="false" style="width: 20px; height: 20px;" id="updateIcon" title="Update Available!">';

    latestVersion = remoteData.versionTaskify;
    document.getElementById('latestversion').innerHTML = window.i18n.t('settings.latestVersionAvailable') + remoteData.versionTaskify;

    checkForUpdates();
  }
  catch (error){
    console.log("ERROR RETRIEVING DATAs");
  }
}

function checkForUpdates(){
  //* CHECK FOR UPDATES 
  if(isNewerVersion(latestVersion, currentVersion)){
    document.getElementById("updateIcon").style.display = "inline";
    let url; //* THIS WILL STORE THE URL FOR DOWNLOAD THE INSTALLER
    let res = window.api.newVersion("A newer version of Taskify Business is available! (" + latestVersion + ")")
    .then(res =>{
      if(res === true){
        switch(window.api.platform){
            case "win32":
              url = `https://github.com/Andrea-Filice/Taskify-Business/releases/download/v${latestVersion}/TaskifyBusiness-${latestVersion}-${window.api.arch}.exe`
              break;
            case "linux":
              url = `https://github.com/Andrea-Filice/Taskify-Business/releases/download/v${latestVersion}/TaskifyBusiness-${latestVersion}-amd64.deb`;
              break;
            case "darwin":
              url = `https://github.com/Andrea-Filice/Taskify-Business/releases/download/v${latestVersion}/TaskifyBusiness-${latestVersion}.dmg`
              break;
        }
        console.log("[ℹ️ INFO] DOWNLOAD LINK: " + url + ".")
        if(window.api.platform != "linux")
          window.api.downloadProgress(url, latestVersion)
        else{ 
          //! DISABLE THE Taskify Updater WITH LINUX.
          window.api.openExternal(url);
          window.api.showAlert("It is downloading the new version of Taskify Business on your Chrome page. Once it’s finished, uninstall the current version and install the new one.", "Downloading in Background")
        }
      }
      else
        console.log("[ℹ️ INFO] Action cancelled by the user.")
    })
  }
  else{
    const updateIcon = document.getElementById("updateIcon");
    if(updateIcon)
       updateIcon.style.display = "none";
  }
}

//START CHECKING FILES
window.addEventListener("load", startUpdates);