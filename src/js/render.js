const { ipcRenderer, contextBridge } = require('electron');

//VARIABLEs
let taskCreated = 0;
let taskCompleted = 0;

function OnLoad(){
  document.getElementById("app").style.animation = "FadeIn 1s forwards";
}

window.todoManager = new class TodoManager {
  constructor() {
    this.todos = ipcRenderer.sendSync('load-todos') || {
      softwareComponents: [],
      fuoriManutenzione: []
    };
    window.addEventListener('beforeunload', () => {
      ipcRenderer.send('save-todos', this.todos);
    });

    document.getElementById('softwareAddBtn')
            .addEventListener('click', () => this.addTodoHandler('softwareComponents'));
    document.getElementById('fuoriAddBtn')
            .addEventListener('click', () => this.addTodoHandler('fuoriManutenzione'));
    document.getElementById('softwareInput')
            .addEventListener('keypress', e => this.handleEnter(e, 'softwareComponents'));
    document.getElementById('fuoriInput')
            .addEventListener('keypress', e => this.handleEnter(e, 'fuoriManutenzione'));

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
    this.updateUI();
  }

  handleEnter(e, category) {
    if (e.key === 'Enter') this.addTodoHandler(category);
  }

  removeTodo(category, index) {
    taskCompleted++;
    this.todos[category].splice(index, 1);
    this.updateUI();
  }

  updateUI() {
    const taskCreatedEl = document.getElementById('taskCreated');
    const taskCompletedEl = document.getElementById('taskCompleted');
    taskCreatedEl.innerText = `Task Creati (in questa sessione): ${taskCreated}`;
    taskCompletedEl.innerText = `Task Completati (in questa sessione): ${taskCompleted}`;
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
    const confirmation = confirm("Sei sicuro di voler eliminare tutti i task resettandoli?");
    if (confirmation) {
        this.todos = {
            softwareComponents: [],
            fuoriManutenzione: []
        };
        taskCreated = 0;
        taskCompleted = 0;
        this.updateUI();
        alert("Task resettati con successo!");
    }
  }
}();

function openInfoBox(){
  document.getElementById('infoBox').style.display = 'block';
  document.getElementById("ibtn").style.display = "none";
  document.getElementById('infoBox').scrollIntoView({ behavior: 'smooth' });
}

function closeInfoBox(){
  document.getElementById('infoBox').style.display = 'none';
  document.getElementById("ibtn").style.display = "block";
  document.getElementById('app').scrollIntoView({ behavior: 'smooth' });
}