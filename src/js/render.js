const { ipcRenderer, app, ipcMain } = require('electron');

//VARIABLES
let taskCreated = 0;
let taskCompleted = 0;
let autoClose = false;

function OnLoad(){
  document.getElementById("app").style.animation = "FadeIn 1s forwards";
  fetchVersion();
}

window.todoManager = new class TodoManager {
  constructor() {
    const categoryID = document.getElementById('categoryClean');
    const loaded = ipcRenderer.sendSync('load-todos') || {};
    this.todos = {
      softwareComponents: loaded.softwareComponents || [],
      fuoriManutenzione: loaded.fuoriManutenzione || []
    };
    taskCreated = loaded.taskCreated || 0;
    taskCompleted = loaded.taskCompleted || 0;
    autoClose = loaded.autoClose || false;

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
    document.getElementById('checkbox')
            .addEventListener('click', () => this.checkBox());

    this.updateUI();
  }

  addTodoHandler(category) {
    const inputId = category === 'softwareComponents' ? 'softwareInput' : 'fuoriInput';
    const prevVersionId = category === 'softwareComponents' ? 'softwarePrevVersion' : 'fuoriPrevVersion';
    const nextVersionId = category === 'softwareComponents' ? 'softwareNextVersion' : 'fuoriNextVersion';

    const input = document.getElementById(inputId);
    const prevVersionInput = document.getElementById(prevVersionId);
    const nextVersionInput = document.getElementById(nextVersionId);

    const text = input.value.trim();
    const prevVersion = prevVersionInput.value.trim();
    const nextVersion = nextVersionInput.value.trim();

    if (!text || !prevVersion || !nextVersion) return;

    this.todos[category].push({
      text,
      prevVersion,
      nextVersion,
      date: new Date(),
      completed: false
    });

    input.value = '';
    prevVersionInput.value = '';
    nextVersionInput.value = '';
    taskCreated++;
    ipcRenderer.send('save-todos', { ...this.todos, taskCreated, taskCompleted, autoClose });
    this.updateUI();
  }

  handleEnter(e, category) {
    if (e.key === 'Enter') this.addTodoHandler(category);
  }

  removeTodo(category, index) {
    taskCompleted++;
    this.todos[category].splice(index, 1);
    ipcRenderer.send('save-todos', { ...this.todos, taskCreated, taskCompleted, autoClose }); 
    this.updateUI();
  }

  updateUI() {
    const taskCreatedEl = document.getElementById('taskCreated');
    const taskCompletedEl = document.getElementById('taskCompleted');
    const autoCloseCheckbox = document.getElementById('checkbox');
    taskCreatedEl.innerText = `Task Creati: ${taskCreated}`;
    taskCompletedEl.innerText = `Task Completati: ${taskCompleted}`;
    autoCloseCheckbox.checked = autoClose;
    this.renderList('softwareComponents', 'softwareList');
    this.renderList('fuoriManutenzione', 'fuoriList');
  }

  renderList(category, listId) {
    const list = document.getElementById(listId);
    list.innerHTML = '';

    this.todos[category].forEach((todo, idx) => {
        const li = document.createElement('li');
        const dateStr = new Date(todo.date).toLocaleDateString();
        li.innerHTML = `
            <span>${todo.text}</span>
            <div>
                <small>${todo.prevVersion} -> ${todo.nextVersion}</small><br>
                <small>${dateStr}</small>
                <button class="delete-btn">Elimina</button>
            </div>
        `;
        li.querySelector('.delete-btn')
          .addEventListener('click', () => this.removeTodo(category, idx));
        list.appendChild(li);
    });
  }

  resetAllTasks() {
    ipcRenderer.invoke('show-confirm', "Sei sicuro di voler resettare tutti i task?")
      .then(userResponse => {
        if (userResponse) {
          this.todos = {
            softwareComponents: [],
            fuoriManutenzione: []
          };
          taskCreated = 0;
          taskCompleted = 0;
          ipcRenderer.send('save-todos', { ...this.todos, taskCreated, taskCompleted, autoClose });
          this.updateUI();
          ipcRenderer.invoke('show-alert', "Task resettati con successo!")
        }
      });
  }

  restartApplication(){
    ipcRenderer.invoke('show-confirm', "Sei sicuro di voler riavviare l'applicazione?")
    .then(userResponse =>{
      if(userResponse){
        window.location.href = "boot.html";
      }
    })
  }

  markAsCompleted(categoryKey) {
    if(categoryKey == ""){
      ipcRenderer.invoke('show-alert', "La categoria è vuota.");
      return;
    }
    if(categoryKey == "Software Components") categoryKey="softwareComponents";
    if(categoryKey == "Fuori dalla manutenzione") categoryKey="fuoriManutenzione";
    ipcRenderer.invoke('show-confirm',
      `Sei sicuro di voler segnare come completata la categoria ${categoryKey}?`
    ).then(userResponse => {
      if (!userResponse) return;
      const list = this.todos[categoryKey];
      if (!Array.isArray(list)) {
        ipcRenderer.invoke('show-alert', "Categoria non trovata.");
        return;
      }
      taskCompleted += list.length;
      this.todos[categoryKey] = [];
      ipcRenderer.send('save-todos', { ...this.todos, taskCreated, taskCompleted, autoClose });
      this.updateUI();
      ipcRenderer.invoke('show-alert', "Task segnati come completati con successo!");
    });
  }
  
  checkBox() {
    autoClose = !autoClose; 
    if (!autoClose) {
      window.addEventListener('scroll', this.handleScroll);
    } else {
      window.removeEventListener('scroll', this.handleScroll);
    }
    ipcRenderer.send('save-todos', { ...this.todos, taskCreated, taskCompleted, autoClose });
  }
  
  handleScroll() {
    if (window.scrollY === 0) {
      document.getElementById('infoBox').style.display = "none";
      document.getElementById("ibtn").style.display = "block";
      document.getElementById('sbtn').style.display = "block";
    }
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
  const userConfirmed = await ipcRenderer.invoke('show-confirm', "Sei sicuro di voler chiudere l'applicazione?");
  if (userConfirmed) {
    ipcRenderer.send('quit-app');
  }
}

function fetchVersion(){
  fetch('version.json')
  .then(response => response.json())
          .then(data => {
            const version = data.Version;
            document.getElementById('version').innerHTML = "Versione: " + version;
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