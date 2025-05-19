const { ipcRenderer } = require('electron')

ipcRenderer.on('populate-input', (event, taskText) => {
  document.getElementById('input').value = taskText
})

function submitInput() {
  const input = document.getElementById('input').value.trim()
  if (!input) return ipcRenderer.invoke('show-alert', 'Task name cannot be empty.')
  ipcRenderer.send('input-submitted', input)
  window.close()
}