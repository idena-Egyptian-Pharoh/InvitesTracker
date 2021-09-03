function cleanInvites(invitesText) {
    if (invitesText == "") {
        return [];
    }
    let lines = invitesText.split("\n");
    let invitesArray = [];
    for (var j = 0; j < lines.length; j++) {
        lines[j] = lines[j]
            .replace(/\s/g, "")
            .replace(/['"]+/g, "")
            .replace(":", "")
            .replace("key", "");

        if (lines[j].length == 64) {
            invitesArray.push(lines[j]);
        }
        continue;
    }
    return invitesArray;
}
const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));
async function getInviteStatus(invite) {
    try {
        let address = await searchForInviteAddress(invite);
        if (address) {
            let resp = await axios.get(`https://api.idena.org/api/identity/${address}`)
            if (resp.status == 200 && resp.data) {
                return resp.data.result.state;
            }
        } else {
            return null
        }
    } catch (error) {
        return null
    }


}
async function checkEpochOfTx(tx) {
    let resp = await axios.get(`https://api.idena.io/api/Transaction/${tx}`)
    if (resp.status == 200 && resp.data) {
        return resp.data.result.epoch;
    }
}
async function checkValidationStatus(identityAddress, epoch) {

    let resp = await axios.get(`https://api.idena.org/api/epoch/${epoch}/identity/${identityAddress}`)
    if (resp.status == 200 && resp.data) {
        return resp.data.result.state;
    }
}
async function getInviteeAddressAndTxHash(invite) {
    try {
        let inviteAddress = await searchForInviteAddress(invite);
        if (inviteAddress) {
            let resp = await axios.get(`https://api.idena.org/api/address/${inviteAddress}/Txs?limit=1`);
            if (resp.status == 200 && resp.data) {
                if (resp.data.result[0].type == "ActivationTx") {
                    return [
                        resp.data.result[0].to,
                        resp.data.result[0].hash
                    ];
                } else {
                    return [null, null]
                }
            }
        } else {
            return null
        }

    } catch (error) {
        return null
    }

}

function emptyTable() {
    updateProgress(0, 1);
    document.getElementById("Invites-Table").innerHTML = "";
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

function addToTable(Invite, type) {


    let color;
    if (type == "Didn't Pass") {
        color = "danger";
    } else if (type == "Passed") {
        color = "success";
    } else if (type == "Used") {
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
async function searchForInviteAddress(invite) {
    try {
        let resp = await axios.get(`https://api.idena.org/api/search?value=${invite}`)
        if (resp.status == 200 && resp.data) {

            return resp.data.result[0].Value;
        }
    } catch (error) {
        return null
    }

}
async function startChecker(pass = false) {
    emptyTable();
    updateStats("", "", "", "", true);
    let invitesText = document.getElementById("invites-textarea").value;
    let invites = await cleanInvites(invitesText);
    let invitesIndex = 0;
    for (const invite of invites) {
        await snooze(1500);
        let inviteStatus = await getInviteStatus(invite);
        switch (inviteStatus) {
            case "Invite": // not used
                if (pass == true) {
                    addToTable(invite, "Didn't Pass");
                    updateStats("", "", "", "");
                } else {
                    addToTable(invite, "Not Used");
                    updateStats("", 1, "", "");
                }
                break;
            case "Killed": // used
                if (pass == true) {
                    let [
                        inviteeAddress,
                        txHash
                    ] = await getInviteeAddressAndTxHash(invite);
                    let epoch = await checkEpochOfTx(txHash);
                    if (!inviteeAddress || !epoch) {
                        updateStats(1, "", "", "");
                    } else {
                        let validationStatus = await checkValidationStatus(inviteeAddress, epoch);
                        if (validationStatus == "Newbie") {
                            addToTable(invite, "Passed");
                            updateStats("", "", "", 1);
                        } else {
                            addToTable(invite, "Didn't Pass");
                            updateStats("", "", 1, "");
                        }
                    }

                } else {
                    addToTable(invite, "Used");
                    updateStats("", "", 1, "");
                }

                break;
            case "Undefined": // nothing

                addToTable(invite, "Not Used");
                updateStats("", 1, "", "");


                break;
            default:
                updateStats(1, "", "", "");
                break;
        }
        invitesIndex++;
        updateProgress(invitesIndex, invites.length)
    }

}
