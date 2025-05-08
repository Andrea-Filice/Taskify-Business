const { ipcRenderer, app, ipcMain } = require('electron');

//VARIABLES
let taskCreated = 0;
let taskCompleted = 0;
let autoClose = false;
let companyName = undefined;

function OnLoad(){
  fetchVersion();
}

window.todoManager = new class TodoManager {
  constructor() {
    const categoryID = document.getElementById('categoryClean');
    const newCompanyName = document.getElementById('nameCompany');
    const loaded = ipcRenderer.sendSync('load-todos') || {};

    this.todos = {
      softwareComponents: loaded.softwareComponents || [],
      fuoriManutenzione: loaded.fuoriManutenzione || []
    };
    taskCreated = loaded.taskCreated || 0;
    taskCompleted = loaded.taskCompleted || 0;
    autoClose = loaded.autoClose || false;
    companyName = loaded.companyName || undefined
    if(companyName === undefined){
      window.location.href = "createCompany.html";
    }
    else{
      document.getElementById("app").style.animation = "FadeIn 1s forwards";
    }
    console.log(loaded.autoClose);

    document.getElementById('softwareAddBtn')
            .addEventListener('click', () => this.addTodoHandler('softwareComponents'));
    document.getElementById('fuoriAddBtn')
            .addEventListener('click', () => this.addTodoHandler('fuoriManutenzione'));
    document.getElementById('softwareInput')
            .addEventListener('keypress', e => this.handleEnter(e, 'softwareComponents'));
    document.getElementById('fuoriInput')
            .addEventListener('keypress', e => this.handleEnter(e, 'fuoriManutenzione'));
    document.getElementById('resetBtn')
            .addEventListener('click', () => this.resetAllTasks());
    document.getElementById('restartBtn')
            .addEventListener('click', () => this.restartApplication());
    document.getElementById('cleanSectionBtn')
            .addEventListener('click', () => this.markAsCompleted(categoryID.value));
    document.getElementById('changeNameBtn')
            .addEventListener('click', () => this.changeCompanyName(newCompanyName.value));
    document.getElementById('checkbox')
            .addEventListener('click', () => this.checkBox());

    this.updateUI();
  }

  addTodoHandler(category) {
    const inputId = category === 'softwareComponents' ? 'softwareInput' : 'fuoriInput';
    const prevVersionId = category === 'softwareComponents' ? 'softwarePrevVersion' : 'fuoriPrevVersion';
    const nextVersionId = category === 'softwareComponents' ? 'softwareNextVersion' : 'fuoriNextVersion';
    const employeeId = category === 'softwareComponents' ? 'userTypeIn': 'userTypeOut';

    const input = document.getElementById(inputId);
    const prevVersionInput = document.getElementById(prevVersionId);
    const nextVersionInput = document.getElementById(nextVersionId);
    const employeeField = document.getElementById(employeeId);

    const text = input.value.trim();
    const prevVersion = prevVersionInput.value.trim();
    const nextVersion = nextVersionInput.value.trim();
    const employeeName = employeeField.value.trim();

    if (!text || !prevVersion || !nextVersion){
      ipcRenderer.invoke('show-alert', "Error creating the Task, please check your inputs and try again.");
      return;
    }

    this.todos[category].push({
      text,
      prevVersion,
      nextVersion,
      userName: employeeName === undefined ? "You": employeeName,
      completed: false
    });

    input.value = '';
    prevVersionInput.value = '';
    nextVersionInput.value = '';
    employeeField.value = '';
    taskCreated++;
    ipcRenderer.send('save-todos', { ...this.todos, taskCreated, taskCompleted, autoClose, companyName });
    this.updateUI();
  }

  handleEnter(e, category) {
    if (e.key === 'Enter') this.addTodoHandler(category);
  }

  removeTodo(category, index) {
    taskCompleted++;
    this.todos[category].splice(index, 1);
    ipcRenderer.send('save-todos', { ...this.todos, taskCreated, taskCompleted, autoClose, companyName }); 
    this.updateUI();
  }

  updateUI() {
    const taskCreatedEl = document.getElementById('taskCreated');
    const taskCompletedEl = document.getElementById('taskCompleted');
    const autoCloseCheckbox = document.getElementById('checkbox');
    taskCreatedEl.innerText = `Tasks crated: ${taskCreated}`;
    taskCompletedEl.innerText = `Tasks completed: ${taskCompleted}`;
    autoCloseCheckbox.checked = autoClose;
    document.title = 'Taskify Business - ' + companyName;
    this.renderList('softwareComponents', 'softwareList');
    this.renderList('fuoriManutenzione', 'fuoriList');
  }

  renderList(category, listId) {
    const list = document.getElementById(listId);
    list.innerHTML = '';

    this.todos[category].forEach((todo, idx) => {
        const li = document.createElement('li');
        const employee = todo.userName;
        li.innerHTML = `
            <span>${todo.text}</span>
            <div>
                <small>${todo.prevVersion} -> ${todo.nextVersion}</small><br>
                <small>${employee}</small>
                <button class="delete-btn">Remove</button>
            </div>
        `;
        li.querySelector('.delete-btn')
          .addEventListener('click', () => this.removeTodo(category, idx));
        list.appendChild(li);
    });
  }

  resetAllTasks() {
    ipcRenderer.invoke('show-confirm', "Are you sure do you want to reset all Tasks?")
      .then(userResponse => {
        if (userResponse) {
          this.todos = {
            softwareComponents: [],
            fuoriManutenzione: []
          };
          taskCreated = 0;
          taskCompleted = 0;
          ipcRenderer.send('save-todos', { ...this.todos, taskCreated, taskCompleted, autoClose, companyName });
          this.updateUI();
          ipcRenderer.invoke('show-alert', "Tasks succesfully reset!")
        }
      });
  }

  restartApplication(){
    ipcRenderer.invoke('show-confirm', "Are you sure do you want to restart the App?")
    .then(userResponse =>{
      if(userResponse){
        window.location.href = "boot.html";
      }
    })
  }

  markAsCompleted(categoryKey) {
    if(categoryKey == ""){
      ipcRenderer.invoke('show-alert', "The category field is empty.");
      return;
    }
    if(categoryKey == "Software Components") categoryKey="softwareComponents";
    if(categoryKey == "Out of maintenance") categoryKey="fuoriManutenzione";
    ipcRenderer.invoke('show-confirm',
      `Are you sure to mark complete the following category:  ${categoryKey}?`
    ).then(userResponse => {
      if (!userResponse) return;
      const list = this.todos[categoryKey];
      if (!Array.isArray(list)) {
        ipcRenderer.invoke('show-alert', "Category not found.");
        return;
      }
      taskCompleted += list.length;
      this.todos[categoryKey] = [];
      ipcRenderer.send('save-todos', { ...this.todos, taskCreated, taskCompleted, autoClose, companyName });
      this.updateUI();
      ipcRenderer.invoke('show-alert', "Tasks marked as 'Completed'!");
    });
  }
  
  checkBox() {
    autoClose = !autoClose; 
    if (!autoClose) {
      window.addEventListener('scroll', this.handleScroll);
    } else {
      window.removeEventListener('scroll', this.handleScroll);
    }
    ipcRenderer.send('save-todos', { ...this.todos, taskCreated, taskCompleted, autoClose, companyName });
  }
  
  handleScroll() {
    if (window.scrollY === 0) {
      document.getElementById('infoBox').style.display = "none";
      document.getElementById("ibtn").style.display = "block";
      document.getElementById('sbtn').style.display = "block";
    }
  }

  changeCompanyName(newName) {
    if(newName === "") {
      ipcRenderer.invoke('show-alert', "The company name field is empty.");
      return;
    }
    ipcRenderer.invoke('show-confirm', `Are you sure to change the company name to: ${newName}?`)
      .then(userResponse => {
        if (!userResponse) return;
        companyName = newName;
        ipcRenderer.send('save-todos', { ...this.todos, taskCreated, taskCompleted, autoClose, companyName });
        document.getElementById('nameCompany').value = '';
        ipcRenderer.invoke('show-alert', "Company name changed successfully!");
        this.updateUI();
      });
  }
}();

//OPEN INFO AND SETTINGS
function openInfoBox(){
  document.getElementById('infoBox').style.display = 'block';
  document.getElementById("ibtn").style.display = "none";
  document.getElementById('sbtn').style.display = 'none';
  document.getElementById('infoBox').scrollIntoView({ behavior: 'smooth' });
}

function closeInfoBox(){
  document.getElementById('app').scrollIntoView({ behavior: 'smooth' });
  document.getElementById('infoBox').style.display = 'none';
  document.getElementById("ibtn").style.display = "block";
  document.getElementById('sbtn').style.display = 'block';
}

function openSettings(){
  document.getElementById('infoBox').style.display = 'block';
  document.getElementById('ibtn').style.display = 'none';
  document.getElementById('sbtn').style.display = 'none';
  document.getElementById('settings').scrollIntoView({behavior: 'smooth'});
}

async function quitApplication() {
  const userConfirmed = await ipcRenderer.invoke('show-confirm', "Are you sure do you want quit the App?");
  if (userConfirmed) {
    ipcRenderer.send('quit-app');
  }
}

function fetchVersion(){
  fetch('version.json')
  .then(response => response.json())
          .then(data => {
            const version = data.Version;
            document.getElementById('version').innerHTML = "Version: " + version;
          });
  fetchBuildNumber();
}

function fetchBuildNumber(){
  fetch('version.json')
  .then(response => response.json())
          .then(data => {
            const BuildNumber = data.BuildNumber;
            document.getElementById('build').innerHTML = "Build: " + BuildNumber;
          });
}