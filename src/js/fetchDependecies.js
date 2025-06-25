try{
    fetch('https://playepikservercontents.netlify.app/dependecies/dependecies.json')
    .then(response => response.json())
          .then(data => {
            document.getElementById('latestversion').innerText = "Latest version avaible: " + data.versionTaskify;
          })
} catch (error) {document.getElementById('latestversion').innerText = "Latest version avaible: Error retrieving data " + error;}