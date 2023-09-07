let credentialsJson = "";
let clientID = "";
let clientSecret = "";
let authCode = "";

let openOauthButton = undefined;
let generateCodeButton = undefined;
let generateTokenButton = undefined;

document.addEventListener("DOMContentLoaded", (e) => {
  openOauthButton = document.querySelector("#openAuth");
  generateCodeButton = document.querySelector("#generateCode");
  generateTokenButton = document.querySelector("#generateToken");
  let authURLInput = document.querySelector("#authURL");

  openOauthButton.addEventListener("click", (e) => {
    oauthSignIn();
  });

  generateCodeButton.addEventListener("click", (e) => {
    getCode();
  });

  generateTokenButton.addEventListener("click", (e) => {
    getAuth();
  });

  authURLInput.addEventListener('keyup', e => {
    generateCodeButton.disabled = false;
  })

  const fileSelector = document.getElementById("file-selector");
  fileSelector.addEventListener("change", (e) => {
    readFile(e);
  });
});

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

getCode = () => {
  let string = document.querySelector("#authURL").value;
  let code = string.split("&code=").pop().split("&scope=")[0];
  authCode = code;
  document.querySelector("#authCode").value = code;
  generateTokenButton.disabled = false;
};

oauthSignIn = () => {
  window.open(
    `https://accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount?client_id=${clientID}&redirect_uri=http%3A%2F%2Flocalhost%3A8080&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive&include_granted_scopes=true&state=pass-through%20value&access_type=offline&service=lso&o2v=2&flowName=GeneralOAuthFlow`
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

      let gdriveToken = {
        access_token: resultsJSON.access_token,
        refresh_token: resultsJSON.refresh_token,
      };

      var filename = "gdrive.token";

      download(filename, gdriveToken);
    })
    .catch((error) => console.log("error", error));
};

download = (filename, text) => {
  text = JSON.stringify(text);

  var element = document.createElement("a");
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
