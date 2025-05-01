try{
    fetch('https://play-epik-incorporation.netlify.app/dependecies/dependecies.json')
    .then(response => response.json())
          .then(data => {
            const version = data.versionTaskify;
            document.getElementById('version').innerText = "Versione: " + version;
          })
          .then(data => {
            const build = data.buildTaskify;
            document.getElementById('build').innerText = "Build: " + build;
          })
}
catch (error) {
    document.getElementById('version').innerText = "Versione: err";
}