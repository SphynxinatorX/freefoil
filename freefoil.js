let credentialsJson, clientID, clientSecret, authCode;
let openOauthButton, generateTokenButton, authURLInput, authURLlabel;

document.addEventListener("DOMContentLoaded", (e) => {
  openOauthButton = document.querySelector("#openAuth");
  generateTokenButton = document.querySelector("#generateToken");
  authURLInput = document.querySelector("#authURL");
  authURLlabel = document.querySelector(".authURLValid");

  openOauthButton.addEventListener("click", (e) => {
    oauthSignIn();
  });

  generateTokenButton.addEventListener("click", (e) => {
    getAuth();
  });

  authURLInput.addEventListener("keyup", (e) => {
    getCode();
  });

  const fileSelector = document.getElementById("file-selector");
  fileSelector.addEventListener("change", (e) => {
    readFile(e);
  });
});

getCode = () => {
  let successURL = document.querySelector("#authURL").value;
  match = successURL.match("4/[0-9A-Za-z-_]+");

  if (match) {
    authCode = successURL.match("4/[0-9A-Za-z-_]+")[0];
    generateTokenButton.disabled = false;
    authURLlabel.innerText = "Valid";
    authURLlabel.style.color = "green";
  } else {
    authURLlabel.innerText = "Invalid";
    authURLlabel.style.color = "red";
  }
};

oauthSignIn = () => {
  window.open(
    `https://accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount?client_id=${clientID}&redirect_uri=http://localhost:8080&response_type=code&scope=https://www.googleapis.com/auth/drive&include_granted_scopes=true&state=pass-through value&access_type=offline&service=lso&o2v=2&flowName=GeneralOAuthFlow`,
    "popup",
    "popup=true,width=400,height=600"
  );
};

getAuth = () => {
  let myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

  let urlencoded = new URLSearchParams();
  urlencoded.append("client_id", clientID);
  urlencoded.append("client_secret", clientSecret);
  urlencoded.append("code", authCode);
  urlencoded.append("grant_type", "authorization_code");
  urlencoded.append("redirect_uri", "http://localhost:8080");

  let requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: urlencoded,
    redirect: "follow",
  };

  fetch("https://oauth2.googleapis.com/token", requestOptions)
    .then((response) => response.text())
    .then((result) => {
      resultsJSON = JSON.parse(result);

      if (resultsJSON.error) {
        alert(
          "Generation failed! Ensure that all other steps have been followed, and that you aren't trying to use a link that's already been used to generate a file."
        );
        return false;
      }

      let gdriveToken = {
        access_token: resultsJSON.access_token,
        refresh_token: resultsJSON.refresh_token,
      };

      let filename = "gdrive.token";
      download(filename, gdriveToken);
    })
    .catch((error) => console.log("error", error));
};

readFile = (e) => {
  let file = e.target.files[0];
  if (!file) {
    return;
  }
  let reader = new FileReader();
  reader.onload = function (e) {
    let contents = e.target.result;

    credentialsJson = JSON.parse(contents);
    clientID = credentialsJson.installed.client_id;
    clientSecret = credentialsJson.installed.client_secret;

    document.querySelector("#clientID").value = clientID;
    document.querySelector("#clientSecret").value = clientSecret;

    openOauthButton.disabled = false;
  };
  reader.readAsText(file);
};

download = (filename, text) => {
  text = JSON.stringify(text);

  let element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text)
  );
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);

  element.click();
  document.body.removeChild(element);
};
