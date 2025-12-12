const { ipcRenderer } = require('electron')

//* ORIGINAL KEYS FROM THE TASK
let originalTaskName, originalNewerVersion, originalPreviousVersion;


function OnLoad(){
  //SET THE THEME
  const htmlElement = document.documentElement;
  const theme = localStorage.getItem("theme");
  htmlElement.setAttribute('data-theme', theme);

  setTimeout(() =>{document.getElementById('loading').style.animation = "FadeOut 0.5s linear forwards";}, 100)
  setTimeout(() =>{
    document.getElementById('loading').style.display = "none";
    document.getElementById('main').style.animation = "FadeIn 0.5s linear forwards";
    saveOriginalDatas(); //* SAVE ORIGINAL DATAS OF THE TASK.
  }, 500);

  //* ENTER HANDLER
  document.getElementById("inputName").addEventListener("keypress", e => submitInputHandler(e));
  document.getElementById("inputPV").addEventListener("keypress", e => submitInputHandler(e));
  document.getElementById("inputNV").addEventListener("keypress", e => submitInputHandler(e));
}

function submitInputHandler(e){if(e.key === 'Enter') submitInput();}

function submitInput() {
  //NEW TASK NAME
  const inputName = document.getElementById('inputName').value.trim();

  //PREVIOUS OR NEWER VERSION
  const previousVersion = document.getElementById('inputPV').value.trim();
  const newerVersion = document.getElementById('inputNV').value.trim();

  //SEND NEW VALUES
  if(inputName)
    ipcRenderer.send('inputSend', inputName, "task_name")
  else
    ipcRenderer.invoke("show-alert", "Unable to modify the Task. Invalid Task name.")
  if(previousVersion && !newerVersion || !previousVersion && newerVersion)
    ipcRenderer.invoke("show-alert", "Unable to modify the Task. You cannot add just one version.")
  else if(previousVersion && newerVersion){
    ipcRenderer.send('inputSend', previousVersion, "prev_version");
    ipcRenderer.send('inputSend', newerVersion, "next_version");
  }

  window.close();
}

function DeleteTask(){
  ipcRenderer.invoke("show-confirm", "Are you sure you want to delete this Task?")
    .then(userResponse => {
      if(userResponse){
        ipcRenderer.send('deleteTask'); 
        window.close();
      }
    });
}

function Quit(){
  if(getUnsavedChanges()){
    ipcRenderer.invoke("show-confirm", "Are you sure you want to quit and not save the unsaved changes?")
    .then(userResponse => {
        if(userResponse)
          window.close();
      }
    )
  }
  else
    window.close();
}

//* FUNCTION FOR CHECK ALL CONDITIONS WITH UNSAVED CHANGES.
function getUnsavedChanges(){
  return originalTaskName != document.getElementById('inputName').value.trim ||
         originalNewerVersion != document.getElementById('inputNV').value ||
         originalPreviousVersion != document.getElementById('inputPV').value
}

function SetCharacterLimit(value){
  const inputs = document.querySelectorAll("input");

  if(!value){
    inputs.forEach(e =>{
      if(!e.dataset.originalMaxLength){
        const max = e.getAttribute("maxlength");
        if(max != null)
          e.dataset.originalMaxLength = max;
      }
      e.removeAttribute("maxlength")
    });
  }
  else
    inputs.forEach(e => {
      const length = e.dataset.originalMaxLength;
      if(length !== undefined)
        e.setAttribute("maxlength", length);
      else
        e.setAttribute("maxlength", 20);
    });
}

//GET TASK DATAS 
ipcRenderer.on('retrieveTaskName', (event, name) =>{document.getElementById('inputName').value = name;});
ipcRenderer.on('retrieveVersion', (event, version, elementID) => {document.getElementById(elementID).value = version;});
ipcRenderer.on('retrieveSetting', (event, characterLimit) =>{SetCharacterLimit(characterLimit)});

//* SAVE ORIGINAL VALUES OF THE TASK FROM THIS FUNCTION

function saveOriginalDatas(){
  originalTaskName = document.getElementById('inputName').value;
  originalPreviousVersion = document.getElementById('inputPV').value;
  originalNewerVersion = document.getElementById('inputNV').value;
}

//ON LOAD
window.addEventListener("load", OnLoad);