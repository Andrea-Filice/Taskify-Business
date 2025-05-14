const { ipcRenderer, app, ipcMain } = require('electron');
const Chart = require('chart.js/auto').Chart;

//VARIABLES
let taskCreated = 0;
let taskCompleted = 0;
let autoClose = false;
let companyName = undefined;

//CHART DATAS
const loaded = ipcRenderer.sendSync('load-todos') || {};

let chartData = loaded.chartData || {
  labels: [],
  created: [],
  completed: []
};
let tasksChart = null;

function OnLoad(){
  //FETCH JSON
  fetchVersion();
  fetchBuildNumber();

  showWarnLogs();
}

function showWarnLogs(){
  setTimeout(() =>{
    console.clear();
    console.log('%cWARNING!', 'color: red; font-size: 40px; font-weight: bold;');
    console.log('%cThis part of application is reserved to Play Epik Developers, if you are here by mistake please close this window.', 'color: white; font-size: 16px;');
    console.log('%cFor more info about it, see https://developer.mozilla.org/en-US/docs/Glossary/Developer_Tools', 'color: lightblue; font-size: 14px;');
  },100);
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

    document.getElementById('softwareAddBtn')
            .addEventListener('click', () => this.addTodoHandler('softwareComponents'));
    document.getElementById('fuoriAddBtn')
            .addEventListener('click', () => this.addTodoHandler('fuoriManutenzione'));
    document.getElementById('softwareInput')
            .addEventListener('keypress', e => this.handleEnter(e, 'softwareComponents'));
    document.getElementById('fuoriInput')
            .addEventListener('keypress', e => this.handleEnter(e, 'fuoriManutenzione'));
    document.getElementById('software')
            .addEventListener('keypress', e => this.handleEnter(e, 'softwareComponents'));
    document.getElementById('out')
            .addEventListener('keypress', e => this.handleEnter(e, 'fuoriManutenzione'));
    document.getElementById('resetBtn')
            .addEventListener('click', () => this.resetData());
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
    let employeeName = employeeField.value.trim();

    if (!text){
      ipcRenderer.invoke('show-alert', "Error creating the Task, please check your inputs and try again.");
      return;
    }

    if (!employeeName) employeeName = "You";
    this.todos[category].push({
      text,
      prevVersion,
      nextVersion,
      userName: employeeName,
      completed: false
    });

    input.value = '';
    prevVersionInput.value = '';
    nextVersionInput.value = '';
    employeeField.value = '';
    taskCreated++;
    ipcRenderer.send('save-todos', { ...this.todos, taskCreated, taskCompleted, autoClose, companyName, chartData });
    this.updateUI();
  }

  handleEnter(e, category) {
    if (e.key === 'Enter') this.addTodoHandler(category);
  }

  removeTodo(category, index) {
    this.todos[category].splice(index, 1);
    ipcRenderer.send('save-todos', { ...this.todos, taskCreated, taskCompleted, autoClose, companyName, chartData }); 
    this.updateUI();
  }

  updateUI() {
    const taskCreatedEl = document.getElementById('taskCreated');
    const taskCompletedEl = document.getElementById('taskCompleted');
    const autoCloseCheckbox = document.getElementById('checkbox');
    taskCreatedEl.innerText = `${taskCreated}`;
    taskCompletedEl.innerText = `${taskCompleted}`;
    autoCloseCheckbox.checked = autoClose;
    if (!autoClose) {
      window.addEventListener('scroll', this.handleScroll);
    } else {
      window.removeEventListener('scroll', this.handleScroll);
    }
    ipcRenderer.send('save-todos', { ...this.todos, taskCreated, taskCompleted, autoClose, companyName, chartData });
    document.title = 'Taskify Business - ' + companyName;
    this.renderList('softwareComponents', 'softwareList');
    this.renderList('fuoriManutenzione', 'fuoriList');

    //UPDATE CHART
    if (!tasksChart) {
        const ctx = document.getElementById('tasksChart').getContext('2d');
        tasksChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [
                    {
                        label: 'Task Created',
                        data: chartData.created,
                        borderColor: '#009dff',
                        backgroundColor: 'rgba(0,157,255,0.1)',
                        tension: 0.3
                    },
                    {
                        label: 'Task Completed',
                        data: chartData.completed,
                        borderColor: '#07b907',
                        backgroundColor: 'rgba(7,185,7,0.1)',
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { labels:{
                      color: '#fff',
                      font: {
                        family: 'Excon, Sans Serif',
                        size: 16
                      }
                    } }
                },
                scales: {
                    x: { ticks:{
                      color: '#fff',
                      font:{
                        family: 'Excon, Sans Serif',
                        size: 12
                      }
                    } },
                    y: { 
                      ticks: {
                        color: '#fff',
                        font:{
                          family: 'Excon, Sans Serif',
                          size: 10
                        },
                        callback: function(value) {
                          return Number.isInteger(value) ? value : null;
                        }
                      }, 
                      beginAtZero: true 
                    }
                }
            }
        });
    }
    this.updateChart();
  }

  renderList(category, listId) {
    const list = document.getElementById(listId);
    list.innerHTML = '';

    this.todos[category].forEach((todo, idx) => {
        const li = document.createElement('li');
        const employee = todo.userName;
        let versionHtml = '';
        if (todo.prevVersion || todo.nextVersion) {
            versionHtml = `
                <small>
                    ${todo.prevVersion ? `<p class="versionPrev">${todo.prevVersion}</p>` : ''}
                    ${todo.prevVersion && todo.nextVersion ? ' > ' : ''}
                    ${todo.nextVersion ? `<p class="versionNext">${todo.nextVersion}</p>` : ''}
                </small><br>
            `;
        }
        li.innerHTML = `
            <span><b>${todo.text}</b></span>
            <div>
                ${versionHtml}
                <small>Assigned to: <i>${employee}</i></small>
                <button class="delete-btn"><img src="assets/_delete.png" draggable="false" width="20px" height="20px"> Remove</button>
            </div>
        `;
        li.querySelector('.delete-btn')
          .addEventListener('click', () => this.removeTodo(category, idx));
        list.appendChild(li);
    });
  }

  resetData() {
    ipcRenderer.invoke('show-confirm', "Are you sure do you want to reset all Data saved?")
      .then(userResponse => {
        if (userResponse) {
          this.todos = {
            softwareComponents: [],
            fuoriManutenzione: []
          };
          taskCreated = 0;
          taskCompleted = 0;
          companyName = "";
          ipcRenderer.send('save-todos', { ...this.todos, taskCreated, taskCompleted, autoClose, companyName, chartData });
          this.updateUI();
          const res = ipcRenderer.invoke('show-alert', "Data succesfully reset, app will be restarted soon.")
          if(res)
            window.location.href = "boot.html";
        }
      });
  }

  restartApplication(){
    ipcRenderer.invoke('show-confirm', "Are you sure you want to restart the app?")
    .then(userResponse =>{
      if(userResponse){
        window.location.href = "boot.html";
      }
    })
  }

  markAsCompleted(categoryKey) {
    if (!this.todos[categoryKey]) {
      ipcRenderer.invoke('show-alert', "Invalid category selected.");
      return;
    }
    ipcRenderer.invoke('show-confirm',
      `Are you sure to mark complete the following category?`
    ).then(userResponse => {
      if (!userResponse) return;
      const list = this.todos[categoryKey];
      taskCompleted += list.length;
      this.todos[categoryKey] = [];
      ipcRenderer.send('save-todos', { ...this.todos, taskCreated, taskCompleted, autoClose, companyName, chartData });
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
    ipcRenderer.send('save-todos', { ...this.todos, taskCreated, taskCompleted, autoClose, companyName, chartData });
  }
  
  handleScroll() {
    if (window.scrollY === 0) {
      document.getElementById('infoBox').style.display = "none";
      document.getElementById("ibtn").style.display = "block";
      document.getElementById('sbtn').style.display = "block";
    }
  }

  changeCompanyName(newName) {
    if(!newName) {
      ipcRenderer.invoke('show-alert', "The company name field is empty.");
      return;
    }
    if(newName.length < 8){
      ipcRenderer.invoke('show-alert', "The company name must contain at least 8 characters in order to be validated.");
      return;
    }
    ipcRenderer.invoke('show-confirm', `Are you sure to change the company name to: ${newName}?`)
      .then(userResponse => {
        if (!userResponse) return;
        companyName = newName;
        ipcRenderer.send('save-todos', { ...this.todos, taskCreated, taskCompleted, autoClose, companyName, chartData });
        document.getElementById('nameCompany').value = '';
        ipcRenderer.invoke('show-alert', "Company name changed successfully!");
        this.updateUI();
      });
  }

  updateChart() {
    const now = new Date();
    const label = now.toLocaleDateString();
    chartData.labels.push(label);
    chartData.created.push(taskCreated);
    chartData.completed.push(taskCompleted);
    if (chartData.labels.length > 10) {
        chartData.labels.shift();
        chartData.created.shift();
        chartData.completed.shift();
    }
    if (tasksChart) {
        tasksChart.data.labels = chartData.labels;
        tasksChart.data.datasets[0].data = chartData.created;
        tasksChart.data.datasets[1].data = chartData.completed;
        tasksChart.update();
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
  const userConfirmed = await ipcRenderer.invoke('show-confirm', "Are you sure you want to close the app?");
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
}

function fetchBuildNumber(){
  fetch('version.json')
  .then(response => response.json())
          .then(data => {
            const BuildNumber = data.BuildNumber;
            document.getElementById('build').innerHTML = "Build: " + BuildNumber;
          });
}