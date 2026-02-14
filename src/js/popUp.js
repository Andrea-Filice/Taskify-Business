//*VARIABLES
///This variables are for save the original datas of the Task and match them with the newest ones.
let originalTaskName, originalNewerVersion, originalPreviousVersion;
const buttonEditTask = document.getElementById("editBtn");

//INPUT TRIGGERS
///This const variables are for the Inputs in the HTML file.
const inputTaskName = document.getElementById('inputName');
const inputNewVersion = document.getElementById('inputNV');
const inputPreviousVersion = document.getElementById('inputPV');

async function OnLoad(){
  //*INITIALIZE i18n
  ///Initialize here the i18next framework for translate this page.
  await window.i18n.init()

  buttonEditTask.disabled = true;

  //*SET THE THEME
  ///Set the theme based from localStorage itam
  const htmlElement = document.documentElement;
  const theme = localStorage.getItem("theme");
  htmlElement.setAttribute('data-theme', theme);
  document.title = window.i18n.t('htmlTitles.editPopUp');

  setTimeout(() =>{document.getElementById('loading').style.animation = "FadeOut 0.5s linear forwards";}, 500)
  setTimeout(() =>{
    document.getElementById('loading').style.display = "none";
    document.getElementById('main').style.animation = "FadeIn 0.5s linear forwards";
    saveOriginalDatas();
  }, 1000);

  //* ENTER HANDLER
  ///Actions to input components for submit when pressing ENTER key
  inputTaskName.addEventListener("keypress", e => submitInputHandler(e));
  inputPreviousVersion.addEventListener("keypress", e => submitInputHandler(e));
  inputNewVersion.addEventListener("keypress", e => submitInputHandler(e));
}

function submitInputHandler(e){if(e.key === 'Enter') submitInput();}

function submitInput() {
  //NEW TASK NAME
  const inputName = inputTaskName.value.trim();

  //PREVIOUS OR NEWER VERSION
  const previousVersion = inputPreviousVersion.value.trim();
  const newerVersion = inputNewVersion.value.trim();

  //SEND NEW VALUES
  if(inputName)
    api.inputSend(inputName, "task_name")
  else
    api.showAlert(window.i18n.t('editPopUp.errorEdit'))
  if(previousVersion && !newerVersion || !previousVersion && newerVersion)
    api.showAlert(window.i18n.t('editPopUp.errorVersions'))
  else if(previousVersion && newerVersion){
    api.inputSend(previousVersion, "prev_version");
    api.inputSend(newerVersion, "next_version");
  }

  window.close();
}

function DeleteTask(){
  api.showConfirm(window.i18n.t('editPopUp.deleteConfirm'))
    .then(userResponse => {
      if(userResponse){
        api.deleteTask(); 
        window.close();
      }
    });
}

function Quit(){
  if(getUnsavedChanges()){
    api.showConfirm(window.i18n.t('editPopUp.unsavedChanges'))
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
  return originalTaskName != inputTaskName.value.trim() ||
         originalNewerVersion != inputNewVersion.value.trim() ||
         originalPreviousVersion != inputPreviousVersion.value.trim()
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
api.onRetrieveTaskName((name) =>{inputTaskName.value = name;});
api.onRetrieveVersion((version, elementID) => {document.getElementById(elementID).value = version;});
api.onRetrieveSetting((characterLimit) =>{SetCharacterLimit(characterLimit)});

//* SAVE ORIGINAL VALUES OF THE TASK FROM THIS FUNCTION
function saveOriginalDatas(){
  originalTaskName = inputTaskName.value;
  originalPreviousVersion = inputPreviousVersion.value;
  originalNewerVersion = inputNewVersion.value;
}

function getButtonBackgroundColor(isDisabled){return (isDisabled) ? "#898989" : "#009dff";}

inputTaskName.addEventListener('input', () => {setValueOfEditButton();});
inputPreviousVersion.addEventListener('input', () => {setValueOfEditButton();});
inputNewVersion.addEventListener('input', () => {setValueOfEditButton();});

function setValueOfEditButton(){
  var tempValue = !getUnsavedChanges()
  buttonEditTask.disabled = tempValue;
  buttonEditTask.style.backgroundColor = getButtonBackgroundColor(tempValue);
}

//ON LOAD
window.addEventListener("load", OnLoad);