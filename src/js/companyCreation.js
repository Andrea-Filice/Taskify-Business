const { ipcRenderer } = require('electron');

function OnLoad(){
    document.getElementById('container').style.animation = "FadeIn 1s forwards";
    document.getElementById('companyCreation').addEventListener('click', createCompany);
    showWarnLogs();
    //ADD EVENT LISTENER
    document.getElementById('inputCompany').addEventListener('keydown', function(e){if(e.key === 'Enter') createCompany();});
}

function showWarnLogs(){
  setTimeout(() =>{
    console.clear();
    console.log('%cWARNING!', 'color: red; font-size: 40px; font-weight: bold;');
    console.log('%cThis part of application is reserved to Play Epik Developers, if you are here by mistake please close this window.', 'color: white; font-size: 16px;');
    console.log('%cFor more info about it, see https://developer.mozilla.org/en-US/docs/Glossary/Developer_Tools', 'color: lightblue; font-size: 14px;');
  },100);
}

function createCompany(){
    const input = document.getElementById('inputCompany');
    const value = input.value.trim();
    if (!value || value.length < 8) {
        ipcRenderer.invoke('show-alert', "Invalid Company name. At least 8 characters.");
        return;
    }
    else {
        ipcRenderer.send('save-companyName', value);
        document.getElementById('container').style.animation = "FadeOut 1s forwards";
        setTimeout(() => {
            window.location.href = "index.html";
        }, 1000);
    }
}