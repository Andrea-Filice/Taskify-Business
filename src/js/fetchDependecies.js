let latestVersion, currentVersion; //VARIABLES FOR STORE LOCAL VALUES

function retrieveDatasFromServer(){
  //* GET CURRENT VERSION FROM THE .JSON FILE:
  getCurrentVersion();

  //* GET LATEST VERSION FROM THE SERVER:
  fetch('https://playepikservercontents.netlify.app/dependencies/dependencies.json')
    .then(response => response.json())
          .then(data => {
            latestVersion = data.versionTaskify;
            document.getElementById('latestversion').innerText = "Latest version avaible: " + data.versionTaskify;
          })
}

function getCurrentVersion(){
  //* GET THE CURRENT VERSION FROM THE LOCAL .JSON FILE
  fetch('version.json')
  .then(response => response.json())
          .then(data => {
            currentVersion = data.Version;
            document.getElementById('version').innerHTML = "Version: " + currentVersion;
            document.getElementById('build').innerHTML = "Build: " + data.BuildNumber;
          });

  //* TIMEOUT FOR AVOID DATA CONFLICTS OR UNDEFINED VALUES.
  setTimeout(checkForUpdates, 1000);
}

function checkForUpdates(){
  //* CHECK FOR UPDATES 
  if(latestVersion > currentVersion){
    let url; //* THIS WILL STORE THE URL FOR DOWNLOAD THE INSTALLER
    let res = ipcRenderer.invoke("new-version", "A newer version of Taskify Business is avaible! (" + latestVersion + ")")
    .then(res =>{
      if(res){
        switch(process.platform){
            case "win32":
              url = `https://github.com/Andrea-Filice/Taskify-Business/releases/download/v${latestVersion}/TaskifyBusiness-${latestVersion}-${process.arch}.exe`
              break;
            case "linux":
              url = `linux_invalid_format`;
              break;
            case "darwin":
              url = `https://github.com/Andrea-Filice/Taskify-Business/releases/download/v${latestVersion}/Taskify-Business-${latestVersion}.dmg`
              break;
        }
        ipcRenderer.invoke('downloadProgress', url, latestVersion)
      }
      else{
        console.log("[DEBUG] action cancelled by the user.")
      }
    })
  }
}

//START CHECKING FILES
document.onload = retrieveDatasFromServer();