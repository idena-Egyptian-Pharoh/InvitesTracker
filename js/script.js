var total = 0;
var current = 0;

function level0(type = "used") {
  emptyTable();
  updateStats("", "", "", "", true);
  var textArea = document.getElementById("Invites-textarea");
  if (textArea.value == "") {
    return;
  }
  var lines = textArea.value.split("\n");

  for (var j = 0; j < lines.length; j++) {
    lines[j] = lines[j]
      .replace(/\s/g, "")
      .replace(/['"]+/g, "")
      .replace(":", "")
      .replace("key", "");
    console.log(lines[j]);
    if (lines[j].length == 64) {
      total += 1;
      level1(lines[j], type);
    }
    continue;
  }
}

function level1(invite, type) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState == XMLHttpRequest.DONE) {
      if (xmlhttp.status == 200) {
        if (JSON.parse(xmlhttp.responseText)["result"] !== null) {
          level2(
            JSON.parse(xmlhttp.responseText)["result"][0]["value"],
            type,
            invite
          );
        } else {
          updateStats(1, "", "", "");
        }
      } else {
        return null;
      }
    }
  };

  xmlhttp.open("GET", "https://api.idena.org/api/search?value=" + invite, true);
  xmlhttp.send();
}

function level2(address, type, invite) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState == XMLHttpRequest.DONE) {
      if (xmlhttp.status == 200) {
        if (JSON.parse(xmlhttp.responseText)["result"] !== null) {
          if (JSON.parse(xmlhttp.responseText)["result"]["state"] == "Killed") {
            updateStats("", "", 1, "");
            if (type == "passed") {
              level3(address, invite);
            } else {
              addToTable(invite, "Didn't pass");
            }
          } else if (
            JSON.parse(xmlhttp.responseText)["result"]["state"] == "Invite"
          ) {
            addToTable(invite, "Not Used");
            updateStats("", 1, "", "");
          } else if (
            JSON.parse(xmlhttp.responseText)["result"]["state"] == "Undefined"
          ) {
            updateStats("", 1, "", "");
            addToTable(invite, "Not Used");
          }
        }
      } else {
        return null;
      }
    }
  };

  xmlhttp.open("GET", "https://api.idena.org/api/identity/" + address, true);
  xmlhttp.send();
}

function level3(inviteAddress, invite) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState == XMLHttpRequest.DONE) {
      if (xmlhttp.status == 200) {
        if (JSON.parse(xmlhttp.responseText)["result"] !== null) {
          level4(
            JSON.parse(xmlhttp.responseText)["result"][0]["hash"],
            JSON.parse(xmlhttp.responseText)["result"][0]["to"],
            invite
          );
        }
      } else {
        return null;
      }
    }
  };

  xmlhttp.open(
    "GET",
    "https://api.idena.org/api/address/" + inviteAddress + "/Txs?limit=1",
    true
  );
  xmlhttp.send();
}

function level4(Tx, InvitedAddress, invite) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState == XMLHttpRequest.DONE) {
      if (xmlhttp.status == 200) {
        if (JSON.parse(xmlhttp.responseText)["result"] !== null) {
          level5(
            JSON.parse(xmlhttp.responseText)["result"]["epoch"],
            InvitedAddress,
            invite
          );
        }
      } else {
        return null;
      }
    }
  };

  xmlhttp.open("GET", "https://api.idena.io/api/Transaction/" + Tx, true);
  xmlhttp.send();
}

function level5(epoch, address, invite) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState == XMLHttpRequest.DONE) {
      if (xmlhttp.status == 200) {
        if (JSON.parse(xmlhttp.responseText)["result"] !== null) {
          if (JSON.parse(xmlhttp.responseText)["result"]["state"] == "Newbie") {
            updateStats("", "", "", 1);
            addToTable(invite, "Passed");
          } else {
            addToTable(invite, "Didn't pass");
          }
        }
      } else {
        return null;
      }
    }
  };

  xmlhttp.open(
    "GET",
    "https://api.idena.org/api/epoch/" + epoch + "/identity/" + address,
    true
  );
  xmlhttp.send();
}

function updateStats(Invalid, NotUsed, Used, Passed, newStats = false) {
  if (newStats == true) {
    document.getElementById("Invalid-Count").innerHTML = "0";
    document.getElementById("NotUsed-Count").innerHTML = "0";
    document.getElementById("Used-Count").innerHTML = "0";
    document.getElementById("Passed-Count").innerHTML = "0";
  }
  if (Invalid !== "") {
    document.getElementById("Invalid-Count").innerHTML =
      Number(document.getElementById("Invalid-Count").innerHTML) + 1;
  }
  if (NotUsed !== "") {
    document.getElementById("NotUsed-Count").innerHTML =
      Number(document.getElementById("NotUsed-Count").innerHTML) + 1;
  }
  if (Used !== "") {
    document.getElementById("Used-Count").innerHTML =
      Number(document.getElementById("Used-Count").innerHTML) + 1;
  }
  if (Passed !== "") {
    document.getElementById("Passed-Count").innerHTML =
      Number(document.getElementById("Passed-Count").innerHTML) + 1;
  }
}

function updateProgress(made, Total) {
  document.getElementById("Invites-Progress").style.width =
    (made / Total) * 100 + "%";
}

function emptyTable() {
  current = 0;
  updateProgress(0, 1);
  document.getElementById("Invites-Table").innerHTML = "";
}

function addToTable(Invite, type) {
  current = current + 1;
  updateProgress(current, total);
  let color;
  if (type == "Didn't pass") {
    color = "danger";
  } else if (type == "Passed") {
    color = "success";
  } else if (type == "Not Used") {
    color = "warning";
  }
  document.getElementById("Invites-Table").innerHTML +=
    "<tr>" +
    '<th scope="row">' +
    Invite +
    "</th>" +
    `<td class="text-${color}">` +
    type +
    "</td>" +
    "</tr>";
}
