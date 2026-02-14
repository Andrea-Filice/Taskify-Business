if (window.__taskify_render_loaded__) {
  console.warn('[ℹ️ INFO] render.js already loaded; skipping duplicate execution.');
} else {
  window.__taskify_render_loaded__ = true;

  const api = window.api;
  const Chart = window.Chart;

  //VARIABLES
  let taskCreated = 0, taskCompleted = 0;
  let autoClose = false, characterLimit = true, doublePressChecks = true;
  let companyName = undefined;
  let taskCompletedColor = document.getElementById('colorTaskCreated').value, taskCreatedColor = document.getElementById('colorTaskCompleted').value;
  let theme = localStorage.getItem("theme") || "dark";
  const themeDropdown = document.getElementById("themeDropDown");

  const DEBUG = api.checkForDebug();

  //LOADING TODOs
  const loaded = api.loadTodosSync() || {};

  let chartData = loaded.chartData || {
    labels: Array(7).fill('').map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i)); 
      return date.toLocaleDateString();
    }),
    created: Array(7).fill(0),
    completed: Array(7).fill(0)
  };

  ///MARK: UI ANIMATIONS
  //*CHANGE THE CATEGORY
  let currentChoosedCategory = 'softwareComponents';
  const catButton = document.getElementById("categorySelection");

  catButton.addEventListener('click', function(event){
    if(!event.detail || event.detail === 1 && doublePressChecks){
      //*RESET PREVIOUS ANIMATION
      catButton.style.animation = "none";
      void catButton.offsetWidth;

      //*SELECT THE CATEGORY
      currentChoosedCategory = (currentChoosedCategory == 'softwareComponents') ? 'fuoriManutenzione' : "softwareComponents";
      catButton.innerHTML = (currentChoosedCategory == 'softwareComponents') ? window.i18n.t('homePage.maintenanceTasks') : window.i18n.t('homePage.outOfMaintenance');
      catButton.classList.toggle("out");
      console.log("[ℹ️ INFO] Category switching: " + currentChoosedCategory)

      //*RESTART THE ANIMATION
      catButton.style.animation = "animClickedButton ease-in-out 500ms";
    }
    else if(!doublePressChecks){
      //*RESET PREVIOUS ANIMATION
      catButton.style.animation = "none";
      void catButton.offsetWidth;

      //*SELECT THE CATEGORY
      currentChoosedCategory = (currentChoosedCategory == 'softwareComponents') ? 'fuoriManutenzione' : "softwareComponents";
      catButton.innerHTML = (currentChoosedCategory == 'softwareComponents') ? window.i18n.t('homePage.maintenanceTasks') : window.i18n.t('homePage.outOfMaintenance');
      catButton.classList.toggle("out");
      console.log(currentChoosedCategory)

      //*RESTART THE ANIMATION
      catButton.style.animation = "animClickedButton ease-in-out 500ms";
    }
  })

  //*ADD THE EMPLOYEE NAME
  const buttonAddEmployee = document.getElementById("employeeBtn");
  const closeEmployeeBtn = document.getElementById("closeEmployeeBtn");
  const versionsLayer = document.getElementById("versions");
  const employeeLayer = document.getElementById("employeeIn");

  buttonAddEmployee.addEventListener("click", function(event){
    if(!event.detail || event.detail === 1){
      employeeLayer.style.display = "block";

      versionsLayer.style.animation = "none";
      void versionsLayer.offsetWidth;
      versionsLayer.style.animation = "animCompareOut 1s ease-in-out forwards";

      employeeLayer.style.animation = "none";
      void employeeLayer.offsetWidth;
      employeeLayer.style.animation = "animCompareIn 1s ease-in-out forwards";
    }
  });

  closeEmployeeBtn.addEventListener("click", function(event){
    if(!event.detail || event.detail === 1){
      employeeLayer.style.animation = "none";
      void employeeLayer.offsetWidth;
      employeeLayer.style.animation = "animCompareOut 1s ease-in-out forwards";

      versionsLayer.style.animation = "none";
      void versionsLayer.offsetWidth;
      versionsLayer.style.animation = "animCompareIn 1s ease-in-out forwards";
    }
  });

  let tasksChart = null;

  ///MARK: TASK MANAGEMENT SECTION
  window.todoManager = new class TodoManager {
    constructor() {
      const categoryID = document.getElementById('categoryClean');
      const newCompanyName = document.getElementById('nameCompany');
      const loaded = api.loadTodosSync() || {};
      const htmlElement = document.documentElement;

      this.todos = {
        softwareComponents: loaded.softwareComponents || [],
        fuoriManutenzione: loaded.fuoriManutenzione || []
      };
      
      taskCreated = loaded.taskCreated || 0;
      taskCompleted = loaded.taskCompleted || 0;
      autoClose = loaded.autoClose || false;
      companyName = loaded.companyName || undefined;
      characterLimit = typeof loaded.characterLimit === 'boolean' ? loaded.characterLimit : true;
      doublePressChecks = typeof loaded.doublePressChecks === 'boolean' ? loaded.doublePressChecks : true;

      //*THEME SETTING
      themeDropdown.value = theme;
      htmlElement.setAttribute('data-theme', themeDropdown.value);

      //SET DEFAULT BOOLEAN VALUES
      this.inputCharactersUpdate(characterLimit);

      document.getElementById('colorTaskCreated').value = loaded.taskCreatedColor || "blue";
      document.getElementById('colorTaskCompleted').value = loaded.taskCompletedColor || "green";

      if(companyName === undefined)
        window.location.href = "createCompany.html";
      else{
        document.getElementById("app").style.animation = "FadeIn 1s forwards";
        document.getElementById("AppTasks").style.animation = "FadeIn 1s forwards";
        document.getElementById("mainSection").style.animation = "FadeIn 1s forwards";
      }
      
      //EVENT LISTENERS
      document.getElementById('aiInput')
              .addEventListener('keypress', e => this.handleEnter(e, currentChoosedCategory));
      document.getElementById('prevVersion')
              .addEventListener('keypress', e => this.handleEnter(e, currentChoosedCategory));
      document.getElementById('nextVersion')
              .addEventListener('keypress', e => this.handleEnter(e, currentChoosedCategory));
      document.getElementById('employeeInput')
              .addEventListener('keypress', e => this.handleEnter(e, currentChoosedCategory));
      document.getElementById("addTask")
              .addEventListener('click', ()=> this.addTodoHandler(currentChoosedCategory))
      document.getElementById('resetBtn')
              .addEventListener('click', () => this.resetData());
      document.getElementById('restartBtn')
              .addEventListener('click', () => this.restartApplication());
      document.getElementById('cleanSectionBtn')
              .addEventListener('click', () => this.markAsCompleted(categoryID.value));
      document.getElementById('changeNameBtn')
              .addEventListener('click', () => this.changeCompanyName(newCompanyName.value.trim()));
      document.getElementById('checkbox')
              .addEventListener('click', () => this.checkBox());
      document.getElementById('characterLimit')
              .addEventListener('change', () => this.setCharacterLimit())
      document.getElementById('aiSendBtn')
              .addEventListener('click', e => this.sendAIMessage())
      document.getElementById('colorTaskCreated')
              .addEventListener('change', () => this.updateUI())
      document.getElementById('colorTaskCompleted')
              .addEventListener('change', () => this.updateUI())
      document.getElementById('doublePressChecks')
              .addEventListener('click', () => this.toggleDoublePressChecks());
      themeDropdown.addEventListener("change", () =>{
              htmlElement.setAttribute('data-theme', themeDropdown.value);
              this.updateUI();
      })
      this.updateUI();
    }

    sendAIMessage(){
      const input = document.getElementById('aiInput');
      const inputSide = document.getElementById('aiInputSide');
      const message = input.value.trim();
      const messageSide = inputSide.value.trim();

      if((!input && !inputSide) || (!message && !messageSide) ){
        api.showAlert('Invalid message. You cannot send empty messages.', 'Invalid AI Message');
        return;
      }

      sidebar.classList.add('open');
      setTimeout(() =>{aiInput.focus();}, 400);
      const messageToSend = (!message) ? messageSide : message;

      appendMsg(messageToSend, "you");
      input.value = '';
      inputSide.value = '';
      CallAIFunction(messageToSend);
    }

    addToDo(taskName, previousVer, nextVer, category){
      this.todos[category].push({
        text: taskName,
        prevVersion: previousVer,
        nextVersion: nextVer,
        userName: "You",
        completed: false
      })

      taskCreated++;
      api.saveTodos({ ...this.todos, taskCreated, taskCompleted, autoClose, companyName, chartData, taskCompletedColor, taskCreatedColor, characterLimit, doublePressChecks});
      this.updateUI();
    }

    addTodoHandler(category) {
      const input = document.getElementById("aiInput");
      const prevVersionInput = document.getElementById("prevVersion");
      const nextVersionInput = document.getElementById("nextVersion");
      const employeeField = document.getElementById("employeeInput");

      const text = input.value.trim();
      const prevVersion = prevVersionInput.value.trim();
      const nextVersion = nextVersionInput.value.trim();
      let employeeName = employeeField.value.trim();

      if (!text){
        api.showAlert(window.i18n.t('popUps.errorInvalidTaskName'), window.i18n.t('errorTitles.taskCreationError'));
        return;
      }

      if(prevVersion && !nextVersion){
        api.showAlert('Invalid version format. Please enter a valid format.', 'Task Creation Error');
        return;
      }
      
      if (!employeeName) employeeName = window.i18n.t('homePage.you');

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
      api.saveTodos({ ...this.todos, taskCreated, taskCompleted, autoClose, companyName, chartData, taskCompletedColor, taskCreatedColor, characterLimit, doublePressChecks});
      updateDailyData();
      this.updateUI();
    }

    handleEnter(e, category) {
      const input = document.getElementById('aiInput');
      const aiMessages = ["/create", "/help", "/edit", "hi", "hello", "/clear", "/cls", "/ai"]
      var regex = new RegExp(`^(${aiMessages.join("|")})$`, "i");
      let containsAIMessages =  regex.test(input.value.trim());
      console.log(regex.test(input.value))
      console.log(containsAIMessages)

      if(containsAIMessages && e.key === 'Enter')
        this.sendAIMessage();
      else if(!containsAIMessages && e.key === 'Enter')
        this.addTodoHandler(category);
    }

    removeTodo(category, index) {
      this.todos[category].splice(index, 1);
      taskCompleted++;
      api.saveTodos({ ...this.todos, taskCreated, taskCompleted, autoClose, companyName, chartData, taskCompletedColor, taskCreatedColor, characterLimit, doublePressChecks });
      updateDailyData(); 
      this.updateUI();
    }

    updateUI() {
      const taskCreatedEl = document.getElementById('taskCreated');
      const taskCompletedEl = document.getElementById('taskCompleted');
      const autoCloseCheckbox = document.getElementById('checkbox');
      const characterLimitCheckbox = document.getElementById('characterLimit');
      const doublePressChecksCheckbox = document.getElementById('doublePressChecks');
      const dropDowntaskCreated = document.getElementById('colorTaskCreated').value;
      const dropDowntaskCompleted = document.getElementById('colorTaskCompleted').value;
      const tipText = window.i18n.t('settings.tipDescription')
          .replace('{{taskCompleted}}', '<i style="font-weight: 800;" data-i18n="settings.taskCompleted">"Task Completati"</i>')
          .replace('{{taskCreated}}', '<i style="font-weight: 800;" data-i18n="settings.taskCreated">"Task Creati"</i>');

      document.getElementById('tipDescription').innerHTML = tipText;

      let colorTCompleted = null, colorTCreated = null, colorTCompletedBG = null, colorTCreatedBG = null;

      taskCreatedEl.innerText = `${taskCreated}`;
      taskCompletedEl.innerText = `${taskCompleted}`;
      autoCloseCheckbox.checked = autoClose;
      characterLimitCheckbox.checked = characterLimit;
      doublePressChecksCheckbox.checked = doublePressChecks;

      //* COLOR SELECTION
      //* TASK COMPLETED
      switch(dropDowntaskCompleted){
        case 'red':
          colorTCompleted = 'rgba(255, 0, 0, 1)'; 
          colorTCompletedBG = 'rgba(255, 0, 0, 0.1)';
          break;
        case 'green':
          colorTCompleted = 'rgba(7,185,7,1)'; 
          colorTCompletedBG = 'rgba(7,185,7,0.1)';
          break;
        case 'blue':
          colorTCompleted = 'rgb(0, 157, 255)'; 
          colorTCompletedBG = 'rgba(0,157,255,0.1)';
          break;
        case 'orange':
          colorTCompleted = 'rgba(255, 149, 0, 1)';
          colorTCompletedBG = 'rgba(255, 149, 0, 0.1)';
          break;
        case 'yellow':
          colorTCompleted = 'rgba(255, 217, 0, 1)'; 
          colorTCompletedBG = 'rgba(255, 217, 0, 0.1)';
          break;
      }

      //* TASK CREATED
      switch(dropDowntaskCreated){
        case 'red':
          colorTCreated = 'rgba(255, 0, 0, 1)'; 
          colorTCreatedBG = 'rgba(255, 0, 0, 0.1)';
          break;
        case 'green':
          colorTCreated = 'rgba(7,185,7,1)'; 
          colorTCreatedBG = 'rgba(7,185,7,0.1)';
          break;
        case 'blue':
          colorTCreated = 'rgba(0,157,255,1)'; 
          colorTCreatedBG = 'rgba(0,157,255,0.1)';
          break;
        case 'orange':
          colorTCreated = 'rgba(255, 149, 0, 1)'; 
          colorTCreatedBG = 'rgba(255, 149, 0, 0.1)';
          break;
        case 'yellow':
          colorTCreated = 'rgba(255, 217, 0, 1)'; 
          colorTCreatedBG = 'rgba(255, 217, 0, 0.1)';
          break;
      }

      //AUTO-CLOSE SETTINGS
      if (!autoClose)
        window.addEventListener('scroll', this.handleScroll);
      else 
        window.removeEventListener('scroll', this.handleScroll);

      taskCreatedColor = document.getElementById('colorTaskCreated').value;
      taskCompletedColor = document.getElementById('colorTaskCompleted').value;

      //*SAVE DATAS
      api.saveTodos({ ...this.todos, taskCreated, taskCompleted, autoClose, companyName, chartData, taskCompletedColor, taskCreatedColor, characterLimit, doublePressChecks });
      localStorage.setItem("theme", themeDropdown.value);

      document.title = `Taskify Dashboard - ${companyName}`;
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
                label: window.i18n.t('settings.taskCreatedCanvas'),
                data: chartData.created,
                borderColor: colorTCreated,
                backgroundColor: colorTCreatedBG,
                tension: 0.3
              },
              {
                label: window.i18n.t('settings.taskCompletedCanvas'),
                data: chartData.completed,
                borderColor: colorTCompleted,
                backgroundColor: colorTCompletedBG,
                tension: 0.3
              }
            ]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                labels: {
                  color: getCSSRule("--color"),
                  font: {
                    family: 'Manrope, Sans Serif',
                    size: 16
                  }
                }
              },
              tooltip: {
                titleFont: {
                  family: 'Manrope, Sans Serif',
                  size: 14,
                  weight: 500
                },
                bodyFont: {
                  family: 'Manrope, Sans Serif',
                  size: 12,
                  weight: 'normal'
                },
                footerFont: {
                  family: 'Manrope, Sans Serif',
                  size: 10,
                  style: 'italic'
                },
              }
            },
            scales: {
              x: {
                ticks: {
                  color: getCSSRule("--color"),
                  font: {
                    family: 'Manrope, Sans Serif',
                    size: 12
                  }
                }
              },
              y: {
                ticks: {
                  color: getCSSRule("--color"),
                  font: {
                    family: 'Manrope, Sans Serif',
                    size: 10
                  },
                  callback: function(value) {return Number.isInteger(value) ? value : null;}
                },
                beginAtZero: true
              }
            }
          }
        });
      } else {
        tasksChart.data.labels = chartData.labels;
        
        tasksChart.options.plugins.legend.labels.color = getCSSRule('--color');
        tasksChart.options.scales.x.ticks.color = getCSSRule('--color');
        tasksChart.options.scales.y.ticks.color = getCSSRule('--color');

        tasksChart.data.datasets[0].label = window.i18n.t('settings.taskCreatedCanvas');
        tasksChart.data.datasets[1].label = window.i18n.t('settings.taskCompletedCanvas');

        tasksChart.data.datasets[0].data = chartData.created;
        tasksChart.data.datasets[1].data = chartData.completed;

        tasksChart.data.datasets[0].borderColor = colorTCreated;
        tasksChart.data.datasets[0].backgroundColor = colorTCreatedBG;
        tasksChart.data.datasets[1].borderColor = colorTCompleted;
        tasksChart.data.datasets[1].backgroundColor = colorTCompletedBG;
        tasksChart.update();
      }
    }

    renderList(category, listId) {
      const numberToUpdateID = (listId === "softwareList") ? "maintenanceNumber" : "outNumber";
      const numberToUpdate = document.getElementById(numberToUpdateID);
      const list = document.getElementById(listId);
      list.innerHTML = '';

      let localArray = this.todos[category]
      numberToUpdate.innerHTML = `&nbsp;&nbsp;${localArray.length}&nbsp;&nbsp;`;

      if(localArray.length === 0)
        list.innerHTML = window.i18n.t('homePage.noTasks');

      else{
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
                    <small>
                      ${window.i18n.t('homePage.assignedTo')} <i>${employee}</i>
                    </small>
                    <div style="display: flex; gap: 5px; margin-top: 0px;">
                        <button class="delete-btn" style="width: 100px; background-color: white;" title="${window.i18n.t('settings.markAsCompleted')}">
                          <img src="assets/_complete.png" draggable="false" width="20px" height="20px">
                        </button>
                        <button class="edit-btn" id="editBtn" title="${window.i18n.t('homePage.editTask')}">
                          <img src="assets/_edit.png" draggable="false" width="20px" height="20px">
                        </button>
                    </div>
                </div>
            `;
            li.querySelector('.delete-btn')
              .addEventListener('click', () => this.removeTodo(category, idx));
            li.querySelector('.edit-btn')
              .addEventListener('click',() => this.modifyTask(category, idx));
            list.appendChild(li);
        });
      }
    }

    resetData() {
      api.showConfirm("Are you sure you want to reset all data saved?")
        .then(userResponse => {
          if (userResponse) {
            this.todos = {
              softwareComponents: [],
              fuoriManutenzione: []
            };
            characterLimit = true;
            autoClose = false;
            taskCreated = 0;
            taskCompleted = 0;
            companyName = "";
            chartData = {
              labels: Array(7).fill('').map((_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (6 - i));
                return date.toLocaleDateString();
              }),
              created: Array(7).fill(0),
              completed: Array(7).fill(0)
            };
            api.saveTodos({ ...this.todos, taskCreated, taskCompleted, autoClose, companyName, chartData, taskCompletedColor, taskCreatedColor, characterLimit, doublePressChecks });
            this.updateUI();
            api.showAlert("Data successfully reset, the app will be restarted soon.")
            .then(() => {window.location.href = "boot.html";});
          }
        });
    }

    restartApplication(){
      api.showConfirm('Are you sure you want to restart the app?')
      .then(userResponse =>{
        if(userResponse)
          window.location.href = "boot.html";
      })
    }

    markAsCompleted(categoryKey) {
      if (!this.todos[categoryKey]) {
        api.showAlert('Invalid category.');
        return;
      }

      api.showConfirm(`Are you sure to mark complete the following category?`)
      .then(userResponse => {
        if (!userResponse) return;
        const list = this.todos[categoryKey];
        taskCompleted += list.length;

        this.todos[categoryKey] = [];
        api.saveTodos({ ...this.todos, taskCreated, taskCompleted, autoClose, companyName, chartData, taskCompletedColor, taskCreatedColor, characterLimit, doublePressChecks });
        this.updateUI();
        api.showAlert("Tasks marked as 'Completed'!");
      });
    }
    
    checkBox() {
      autoClose = !autoClose; 
      if (!autoClose) 
        window.addEventListener('scroll', this.handleScroll);
      else
        window.removeEventListener('scroll', this.handleScroll);
      api.saveTodos({ ...this.todos, taskCreated, taskCompleted, autoClose, companyName, chartData, taskCompletedColor, taskCreatedColor, characterLimit, doublePressChecks });
    }

    toggleDoublePressChecks(){
      doublePressChecks = !doublePressChecks;
      this.updateUI();
    }
    
    handleScroll() {
      if (window.scrollY === 0) {
        document.getElementById('AppTasks').style.display = "block";
        
        //* RESET ANIMATIONS
        employeeLayer.style.animation = "none";
        void employeeLayer.offsetWidth;
        employeeLayer.style.display = "none";
        versionsLayer.style.animation = "none";
        void versionsLayer.offsetWidth;
        catButton.style.animation = "none";

        document.getElementById('infoBox').style.display = "none";
        toggleButtons(true);
      }
    }

    changeCompanyName(newName) {
      if(!newName || newName.length < 8) {
        api.showAlert('Invalid Company name. At least 8 characters.');
        return;
      }
      api.showConfirm(`Are you sure to change the company name to "${newName}"?`)
        .then(userResponse => {
          if (!userResponse) return;
          companyName = newName;
          api.saveTodos({ ...this.todos, taskCreated, taskCompleted, autoClose, companyName, chartData, taskCompletedColor, taskCreatedColor, characterLimit, doublePressChecks});
          document.getElementById('nameCompany').value = '';
          api.showAlert('Company name changed successfully!');
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

    modifyTask(category, index) {
      const task = this.todos[category][index];
      if (!task){
        api.showAlert('Task not found.'); 
        return;
      }
      api.shareSettings(characterLimit);
      api.showInputAlert(category, index);
    }

    setCharacterLimit(){
      characterLimit = !characterLimit;
      this.inputCharactersUpdate(characterLimit);
    }

    inputCharactersUpdate(value){
      const inputs = document.querySelectorAll("input");

      if(!value){
        inputs.forEach(e =>{
          if(!e.dataset.originalMaxLength){
            const max = e.getAttribute('maxlength');
            if(max != null)
              e.dataset.originalMaxLength = max;
          }
          e.removeAttribute('maxlength');
        });
      }
      else{
        inputs.forEach(e => {
          const length = e.dataset.originalMaxLength;
          if(length !== undefined)
            e.setAttribute('maxlength', length);
          else
            e.setAttribute('maxlength', 20);
        });
      }
      api.saveTodos({ ...this.todos, taskCreated, taskCompleted, autoClose, companyName, chartData, taskCompletedColor, taskCreatedColor, characterLimit, doublePressChecks});
    }
  }();

  //*GET CSS RULES
  function getCSSRule(varName){return getComputedStyle(document.documentElement).getPropertyValue(varName);}

  //* OPEN INFO AND SETTINGS
  const buttons =[
    info = document.getElementById('ibtn'),
    settings = document.getElementById('sbtn')
  ];

  function openInfoBox(){
    document.getElementById('AppTasks').style.display = "none";

    document.getElementById('infoBox').style.display = 'block';
    document.getElementById('infoBox').scrollIntoView({ behavior: 'smooth' });
    toggleButtons(false);
  }

  function closeInfoBox(){
    document.getElementById('AppTasks').style.display = "block";

    document.getElementById('softwareList').scrollIntoView({ behavior: 'smooth'});
    document.getElementById('infoBox').style.display = 'none';
    toggleButtons(true);
  }

  function openSettings(){
    document.getElementById('AppTasks').style.display = "none";

    document.getElementById('infoBox').style.display = 'block';
    document.getElementById('settings').scrollIntoView({behavior: 'smooth'});
    toggleButtons(false);
  }

  function toggleButtons(value){buttons.forEach(e  => {e.style.display = (value) ? "block" : "none";});}

  async function quitApplication() {
    const userConfirmed = await api.showConfirm('Are you sure you want to close the app?');
    if (userConfirmed)
      api.quitApp();
  }
  
  window.quitApplication = quitApplication;

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

  function updateDailyData() {
    const today = new Date().toLocaleDateString();
    const lastLabel = chartData.labels[chartData.labels.length - 1];

    if (lastLabel !== today) {
      chartData.labels.push(today);
      chartData.created.push(taskCreated);
      chartData.completed.push(taskCompleted);

      if (chartData.labels.length > 7) {
        chartData.labels.shift();
        chartData.created.shift();
        chartData.completed.shift();
      }
    } 
    else {
      chartData.created[chartData.created.length - 1] = taskCreated;
      chartData.completed[chartData.completed.length - 1] = taskCompleted;
    }
  }

  //EDIT TASKS FUNCTIONS
  api.onTaskModified((category, index, taskData) => {
      window.todoManager.todos[category][index].text = taskData.text;
      window.todoManager.todos[category][index].prevVersion = taskData.prevVersion;
      window.todoManager.todos[category][index].nextVersion = taskData.nextVersion;
      api.saveTodos({ ...this.todos, taskCreated, taskCompleted, autoClose, companyName, chartData, taskCompletedColor, taskCreatedColor, characterLimit, doublePressChecks});
      window.todoManager.updateUI();
  });

  api.onDeleteTask((category, index) => {
      window.todoManager.todos[category].splice(index, 1);
      taskCreated--;
      api.saveTodos({ ...this.todos, taskCreated, taskCompleted, autoClose, companyName, chartData, taskCompletedColor, taskCreatedColor, characterLimit, doublePressChecks});
      window.todoManager.updateUI();
  });

  ///MARK: AI SECTION
  //* AI ASSISTANT
  function CallAIFunction(input){
    api.analyzeContent(input)
      .then(result => {
        try{
          if (result.tasks && Array.isArray(result.tasks) && !Object.prototype.hasOwnProperty.call(result, 'modify') && !Object.prototype.hasOwnProperty.call(result, 'type')) {
            result.tasks.forEach(task => {
              appendMsg(`Task Created! ${task.name} (${task.prev_version} → ${task.next_version})`, "AI");
              window.todoManager.addToDo(task.name, task.prev_version, task.next_version, task.category);
            });
          } else if (result.name && !Object.prototype.hasOwnProperty.call(result, 'modify') && !Object.prototype.hasOwnProperty.call(result, 'type')) {
            appendMsg(`Task Created! ${result.name} (${result.prev_version} → ${result.next_version})`, "AI");
            window.todoManager.addToDo(result.name, result.prev_version, result.next_version, result.category);
          } else if(Object.prototype.hasOwnProperty.call(result, 'modify')){
            const todos = window.todoManager.todos[result.category];
            const index = todos.findIndex(t => t.text === result.name);

            if(index !== -1){
              window.todoManager.modifyTask(result.category, index);
              appendMsg(`Editing task: ${result.name}`, "AI");
            }
            else
              appendMsg(`Task "${result.name}" not found in category "${result.category == "fuoriManutenzione"? "Out Of Maintenance" : "Maintenance Tasks"}"`, "AI");
          }
          else if (result.name && Object.prototype.hasOwnProperty.call(result, 'type')){
            const todos = window.todoManager.todos[result.category];
            const index = todos.findIndex(t => t.text === result.name);

            if(index !== -1){
              window.todoManager.removeTodo(result.category, index);
              appendMsg(`Deleting task: ${result.name}`, "AI");
              taskCreated--;
            }
            else
              appendMsg(`Task "${result.name}" not found in category "${result.category == "fuoriManutenzione"? "Out Of Maintenance" : "Maintenance Tasks"}"`, "AI");
          }
          else{
            if (typeof result === "object")
              appendMsg(JSON.stringify(result, null, 2), "AI");
            if(result == "cleared")
              clearChat();
            else
              appendMsg(result, "AI");
          }
        }
        catch(e) {appendMsg("An unknown error occured: " + e, "AI");}
      })
      .catch(error => {appendMsg(`Error during the load of AI Scripts: ${error.message || error}`, "AI");});
  }

  //SIDEBAR VARIABLES
  const sidebar = document.getElementById('sidebarAI');
  const closeSidebarBtn = document.getElementById('closeSidebarBtn');
  const aiSendBtn = document.getElementById('aiSendBtn');
  const aiInput = document.getElementById('aiInputSide');
  const aiChatHistory = document.getElementById('aiChatHistory');

  closeSidebarBtn.onclick = () =>{sidebar.classList.remove('open');}

  aiSendBtn.onclick = () => {
    const msg = aiInput.value.trim();
    if(!msg) return;

    appendMsg(msg, "you");
    
    if (!sidebar.classList.contains('open')) 
      sidebar.classList.add('open');

    CallAIFunction(msg);
    setTimeout(() => {appendMsg("AI: Elaborating request...", "AI");}, 800);
  }

  aiInput.addEventListener('keydown', function(e){if(e.key === 'Enter') aiSendBtn.click();});
  aiInput.addEventListener('focus', () => aiInput.classList.add('ai-glow'));
  aiInput.addEventListener('blur', () => aiInput.classList.remove('ai-glow'));

  function appendMsg(text, who = "ai"){
    const div = document.createElement('div');
    div.className = 'ai-chat-msg ' + (who.toLowerCase() === "you" ? "user" : "ai");

    const innerDiv = document.createElement('div');
    const label = document.createElement('label');
    const p = document.createElement('p');

    if(who === "AI"){
      label.className = "aiText";
      label.textContent = 'AI Assistant:';
    }
    else{
      label.className = "youText";
      label.textContent = 'You:';
    }

    p.style.display = 'inline';
    p.textContent = text;

    innerDiv.appendChild(label);
    innerDiv.appendChild(p);
    div.appendChild(innerDiv);

    aiChatHistory.appendChild(div);
    aiChatHistory.scrollTop = aiChatHistory.scrollHeight;
  }

  function clearChat() {
    const chatHistory = document.querySelector('.ai-chat-history');
    chatHistory.innerHTML = (chatHistory) ? '' : chatHistory.innerHTML;
  }

  //ABOUT PANEL
  function ShowInfoPanel(textToShow){api.showAlert(textToShow)}

  //WEB REFERENCES SECTION
  document.getElementById('repoGitBtn').addEventListener('click', () => {api.openExternal("https://github.com/Andrea-Filice/Taskify-Business");});
  document.getElementById('licenseBtn').addEventListener('click', () => {api.openExternal("https://github.com/Andrea-Filice/Taskify-Business/blob/main/LICENSE");});

  //NEED HELP SECTION
  document.getElementById('feedback').addEventListener('click', () =>{
    let menuFeedback = document.getElementById('menuFeedback');

    //* INTERRUPT THE CURRENT ANIMATION
    menuFeedback.style.animation = "none";

    document.getElementById("feedbackSelection").classList.toggle("feedbackSelection");
    if(menuFeedback.classList.contains("arrowMenu"))
      menuFeedback.style.animation = "rotateAnimationBackward 0.3s forwards ease-in-out";
    else
      menuFeedback.style.animation = "rotateAnimation 0.3s forwards ease-in-out";

    setTimeout(() =>{ 
      menuFeedback.classList.toggle("arrowMenu");
    }, 10);
  });

  document.getElementById("bug").addEventListener('click', () => {api.openExternal("https://github.com/Andrea-Filice/Taskify-Business/issues/new?labels=bug");})
  document.getElementById("feedbackBtn").addEventListener('click', () => {api.openExternal("https://github.com/Andrea-Filice/Taskify-Business/issues/new?labels=enhancement");})
  document.getElementById('contactUs').addEventListener('click', () => {api.openExternal("https://play-epik-incorporation.netlify.app/contactus#morehelp");});

  //ON LOAD
  window.addEventListener("load", async () => {
    await window.i18n.init();

    ///When loaded the languages, reset the UI
    if (window.todoManager) 
      window.todoManager.updateUI();

    console.log("[ℹ️ INFO] core platform: " + api.platform)
    fetchVersion();
    fetchBuildNumber();
  })
}