function OnLoad(){
    setTimeout(() => {
        document.getElementById("loading").style.animation = "FadeOut 1s forwards";
        setTimeout(() =>{
            window.location.href = "index.html";
        }, 900)
    }, 800);
}