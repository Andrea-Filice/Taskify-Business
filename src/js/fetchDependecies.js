try{
    fetch('https://playepikservercontents.netlify.app/dependecies/dependecies.json')
    .then(response => response.json())
          .then(data => {
            const version = data.versionTaskify;
            document.getElementById('latestversion').innerText = "Ultima versione disponibile: " + version;
          })
}
catch (error) {
    document.getElementById('latestversion').innerText = "Ultima versione disponibile: errore";
}