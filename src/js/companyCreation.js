const { ipcRenderer } = require('electron');

function OnLoad(){
    document.getElementById('container').style.animation = "FadeIn 1s forwards";
    document.getElementById('companyCreation').addEventListener('click', createCompany);
}

function createCompany(){
    const input = document.getElementById('inputCompany');
    const value = input.value.trim();
    if (!value) {
        ipcRenderer.invoke('show-alert', "Check your inputs and try again.");
        return;
    }
    else if (value.length < 8){
        ipcRenderer.invoke('show-alert', "The company name must contain at least 8 characters in order to be validated.");
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