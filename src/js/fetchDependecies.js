let latestVersion, currentVersion;

function retrieveDatasFromServer(){
  //* GET CURRENT VERSION FROM THE .JSON FILE:
  getCurrentVersion();

  //* GET LATEST VERSION FROM THE SERVER:
  fetch('https://cdn-playepik.netlify.app/dependencies/dependencies.json')
    .then(response => response.json())
          .then(data => {
            latestVersion = data.versionTaskify;
            document.getElementById('latestversion').innerText = "Latest version available: " + data.versionTaskify;
          })
}

function getCurrentVersion(){
  //* GET THE CURRENT VERSION FROM THE LOCAL .JSON FILE
  fetch('version.json')
  .then(response => response.json())
          .then(data => {
            currentVersion = data.Version;
            document.getElementById('version').innerHTML = "Version: " + currentVersion + ' <img src="assets/_updateWarn.png" alt="Update available" draggable="false" style="width: 20px; height: 20px;" id="updateIcon" title="Update Available!">';
            document.getElementById('build').innerHTML = "Build Number: " + data.BuildNumber;

            //* ADD A FUNCTION FOR THE "Update Available" BUTTON
            document.getElementById("updateIcon").addEventListener("click", () =>{
              checkForUpdates();
            })
          });

  //* TIMEOUT FOR AVOID DATA CONFLICTS OR UNDEFINED VALUES.
  setTimeout(checkForUpdates, 1000);
}

function checkForUpdates(){
  //* CHECK FOR UPDATES 
  if(parseFloat(latestVersion) > parseFloat(currentVersion)){
    document.getElementById("updateIcon").style.display = "inline";
    let url; //* THIS WILL STORE THE URL FOR DOWNLOAD THE INSTALLER
    let res = ipcRenderer.invoke("new-version", "A newer version of Taskify Business is available! (" + latestVersion + ")")
    .then(res =>{
      if(res){
        switch(process.platform){
            case "win32":
              url = `https://github.com/Andrea-Filice/Taskify-Business/releases/download/v${latestVersion}/TaskifyBusiness-${latestVersion}-${process.arch}.exe`
              break;
            case "linux":
              url = `https://github.com/Andrea-Filice/Taskify-Business/releases/download/v${latestVersion}/TaskifyBusiness-${latestVersion}-amd64.deb`;
              break;
            case "darwin":
              url = `https://github.com/Andrea-Filice/Taskify-Business/releases/download/v${latestVersion}/TaskifyBusiness-${latestVersion}.dmg`
              break;
        }
        console.log("[ℹ️ INFO] DOWNLOAD LINK: " + url + ".")
        if(process.platform != "linux")
          ipcRenderer.invoke('downloadProgress', url, latestVersion)
        else{ //! DISABLE THE Taskify Updater WITH LINUX.
          shell.openExternal(url);
          ipcRenderer.invoke('show-alert', "It is downloading the new version of Taskify Business on your Chrome page. Once it’s finished, uninstall the current version and install the new one.", "Downloaded in Background")
        }
      }
      else
        console.log("[ℹ️ INFO] Action cancelled by the user.")
    })
  }
  else
    document.getElementById("updateIcon").style.display = "none";
}

//START CHECKING FILES
window.addEventListener("load", retrieveDatasFromServer);