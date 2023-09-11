let credentialsJson, clientID, clientSecret, authCode;
let openOauthButton,
  generateTokenButton,
  authURLInput,
  authURLlabel,
  redirectURI;
let apptype = "desktop";

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
  authURLInput.addEventListener("input", (e) => {
    getCode();
  });

  const fileSelector = document.getElementById("file-selector");
  fileSelector.addEventListener("change", (e) => {
    readFile(e);
  });

  const bc = new BroadcastChannel("auth_listener");

  let codeFound = /[?&]code=/.test(location.search);

  if (codeFound) {
    codeFound = new URLSearchParams(window.location.search).get("code");
    bc.postMessage(codeFound);
    window.close();
  }

  bc.onmessage = function (ev) {
    console.log("Using code: ", ev.data);
    authCode = ev.data;
    getAuth();
  };
});

getCode = () => {
  let successURL = document.querySelector("#authURL").value;
  decoded = decodeURIComponent(successURL);
  match = decoded.match("4/[0-9A-Za-z-_]+");

  if (match) {
    authCode = match[0];
    generateTokenButton.disabled = false;
    authURLlabel.innerText = "Valid";
    authURLlabel.style.color = "green";
  } else {
    generateTokenButton.disabled = true;
    authURLlabel.innerText = "Invalid";
    authURLlabel.style.color = "red";
  }
};

oauthSignIn = () => {
  window.open(
    `https://accounts.google.com/o/oauth2/auth?scope=https://www.googleapis.com/auth/drive&redirect_uri=${redirectURI}&response_type=code&client_id=${clientID}`,
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
  urlencoded.append("redirect_uri", redirectURI);
  urlencoded.append("approval_prompt", "force");
  urlencoded.append("access_type", "offline");

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
      console.log(resultsJSON);

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

    if (credentialsJson.installed) {
      clientID = credentialsJson.installed.client_id;
      clientSecret = credentialsJson.installed.client_secret;
      redirectURI = "http://localhost:8080";
    } else if (credentialsJson.web) {
      apptype = "web";
      redirectURI = window.location.href;
      clientID = credentialsJson.web.client_id;
      clientSecret = credentialsJson.web.client_secret;
    } else {
      alert("invalid creds file");
    }

    document.querySelector("#clientID").value = clientID;
    document.querySelector("#clientSecret").value = clientSecret;

    openOauthButton.disabled = false;
  };
  reader.readAsText(file);
};

download = (filename, data) => {
  text = JSON.stringify(data);
  const blob = new Blob([text], { type: "application/octet-stream" });

  const elem = window.document.createElement("a");
  elem.href = window.URL.createObjectURL(blob);
  elem.download = filename;
  document.body.appendChild(elem);
  elem.click();
  document.body.removeChild(elem);
};
