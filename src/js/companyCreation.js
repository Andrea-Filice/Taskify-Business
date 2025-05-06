const { ipcRenderer } = require('electron');

function OnLoad(){
    document.getElementById('container').style.animation = "FadeIn 1s forwards";
    document.getElementById('companyCreation').addEventListener('click', createCompany);
}

function createCompany(){
    const input = document.getElementById('inputCompany');
    const value = input.value.trim();
    if (value === "") {
        ipcRenderer.send('show-alert', "Check your inputs and try again.");
        return;
    } else {
        ipcRenderer.send('save-companyName', value);
        window.location.href = "index.html";
    }
}