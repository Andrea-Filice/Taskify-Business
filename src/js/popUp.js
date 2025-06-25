const { ipcRenderer } = require('electron')

ipcRenderer.on('populate-input', (event, taskText) => {document.getElementById('input').value = taskText;})

function submitInput() {
  //NEW TASK NAME
  const inputName = document.getElementById('inputName').value.trim();

  //PREVIOUS OR NEWER VERSION
  const previousVersion = document.getElementById('inputPV').value.trim();
  const newerVersion = document.getElementById('inputNV').value.trim();

  //SEND NEW VALUES
  if(inputName)
    ipcRenderer.send('inputSend', inputName, "task_name")
  if(previousVersion)
    ipcRenderer.send('inputSend', previousVersion, "prev_version")
  if(newerVersion)
    ipcRenderer.send('inputSend', newerVersion, "next_version")
  window.close();
}

function DeleteTask(){
  ipcRenderer.send('deleteTask');
  window.close();
}

function Quit() {window.close();}