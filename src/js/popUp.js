//* ORIGINAL KEYS FROM THE TASK
let originalTaskName, originalNewerVersion, originalPreviousVersion;
const buttonEditTask = document.getElementById("editBtn");

function OnLoad(){
  buttonEditTask.disabled = true;

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
    api.inputSend(inputName, "task_name")
  else
    api.showAlert("Unable to modify the Task. Invalid Task name.")
  if(previousVersion && !newerVersion || !previousVersion && newerVersion)
    api.showAlert("Unable to modify the Task. You cannot add just one version.")
  else if(previousVersion && newerVersion){
    api.inputSend(previousVersion, "prev_version");
    api.inputSend(newerVersion, "next_version");
  }

  window.close();
}

function DeleteTask(){
  api.showConfirm("Are you sure you want to delete this Task?")
    .then(userResponse => {
      if(userResponse){
        api.deleteTask(); 
        window.close();
      }
    });
}

function Quit(){
  if(getUnsavedChanges()){
    api.showConfirm("Are you sure you want to quit and not save the unsaved changes?")
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
  return originalTaskName != document.getElementById('inputName').value.trim() ||
         originalNewerVersion != document.getElementById('inputNV').value.trim() ||
         originalPreviousVersion != document.getElementById('inputPV').value.trim()
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
api.onRetrieveTaskName((name) =>{document.getElementById('inputName').value = name;});
api.onRetrieveVersion((version, elementID) => {document.getElementById(elementID).value = version;});
api.onRetrieveSetting((characterLimit) =>{SetCharacterLimit(characterLimit)});

//* SAVE ORIGINAL VALUES OF THE TASK FROM THIS FUNCTION
function saveOriginalDatas(){
  originalTaskName = document.getElementById('inputName').value;
  originalPreviousVersion = document.getElementById('inputPV').value;
  originalNewerVersion = document.getElementById('inputNV').value;
}

function getButtonBackgroundColor(isDisabled){return (isDisabled) ? "#898989" : "#009dff";}

//INPUT TRIGGER
const inputTaskName = document.getElementById('inputName');
const inputNewVersion = document.getElementById('inputNV');
const inputPreviousVersion = document.getElementById('inputPV');

inputTaskName.addEventListener('input', () => {
  var tempValue = !getUnsavedChanges()
  buttonEditTask.disabled = tempValue;
  buttonEditTask.style.backgroundColor = getButtonBackgroundColor(tempValue);
});

inputPreviousVersion.addEventListener('input', () => {
  var tempValue = !getUnsavedChanges()
  buttonEditTask.disabled = tempValue;
  buttonEditTask.style.backgroundColor = getButtonBackgroundColor(tempValue);
});

inputNewVersion.addEventListener('input', () => {
  var tempValue = !getUnsavedChanges()
  buttonEditTask.disabled = tempValue;
  buttonEditTask.style.backgroundColor = getButtonBackgroundColor(tempValue);
});

//ON LOAD
window.addEventListener("load", OnLoad);