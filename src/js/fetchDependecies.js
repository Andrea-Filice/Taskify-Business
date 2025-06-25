try{
    fetch('https://playepikservercontents.netlify.app/dependecies/dependecies.json')
    .then(response => response.json())
          .then(data => {
            const version = data.versionTaskify;
            document.getElementById('latestversion').innerText = "Latest version avaible: " + version;
          })
} catch (error) {document.getElementById('latestversion').innerText = "Latest version avaible: Error retrieving data " + error;}