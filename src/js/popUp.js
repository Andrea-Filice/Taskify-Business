const { ipcRenderer } = require('electron')

ipcRenderer.on('populate-input', (event, taskText) => {
  document.getElementById('input').value = taskText
})

function submitInput() {
  //NEW TASK NAME
  const inputName = document.getElementById('inputName').value.trim();

  //PREVIOUS/NEWER VERSION
  const previousVersion = document.getElementById('inputPV').value.trim();
  const newerVersion = document.getElementById('inputNV').value.trim();

  //SEND NEW VALUES
  if(inputName)
    ipcRenderer.send('inputName-submitted', inputName);
  if(previousVersion)
    ipcRenderer.send('inputPV-submitted', previousVersion);
  if(newerVersion)
    ipcRenderer.send('inputNV-submitted', newerVersion);
  window.close();
}

function DeleteTask(){
  ipcRenderer.send('deleteTask');
  window.close();
}

function Quit() {window.close();}