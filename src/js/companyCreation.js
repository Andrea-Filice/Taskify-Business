const { ipcRenderer } = require('electron');

function OnLoad(){
    document.getElementById('container').style.animation = "FadeIn 1s forwards";
}

function createCompany(){
    const input = document.getElementById('inputCompany');
    const value = input.value.trim();
    ipcRenderer.send('save-companyName', value);
    window.location.href = "index.html";
}