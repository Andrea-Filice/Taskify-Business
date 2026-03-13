async function OnLoad(){
    //INITIALIZE i18n
    await window.i18n.init();

    //SET THEME
    const htmlElement = document.documentElement;
    const theme = localStorage.getItem("theme");
    htmlElement.setAttribute('data-theme', theme);
    document.title = window.i18n.t('htmlTitles.companyCreation');

    document.getElementById('container').style.animation = "FadeIn 1s forwards";

    //EVENT LISTENER
    document.getElementById('companyCreation').addEventListener('click', createCompany);
    document.getElementById('inputCompany').addEventListener('keydown', function(e){if(e.key === 'Enter') createCompany();});
}

function createCompany(){
    const input = document.getElementById('inputCompany');
    const value = input.value.trim();
    
    if (!value || value.length < 8){
        api.showAlert(window.i18n.t("companyCreation.errorInvalidCompanyName"), window.i18n.t("companyCreation.titleError"), window.i18n.t("htmlTitles.closeButton")); 
        return;
    }
    else {
        api.saveCompanyName(value);
        document.getElementById('container').style.animation = "FadeOut 1s forwards";
        setTimeout(() => {window.location.href = "index.html";}, 1000);
    }
}

//DOM ON LOAD
window.addEventListener("load", OnLoad);