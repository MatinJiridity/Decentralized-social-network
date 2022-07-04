
$(function () {
    $(document).ready(function () {
        PrepareNetwork();
    });
});


var JsonContract = null;
var web3 = null;
var MyContract = null;
var Owner = null;
var CurrentAccount = null;
var PostCounter = null;
var IPFS_Hash = null; // we save hash of ipfs in this variable
var Host_Name = 'https://ipfs.infura.io/ipfs/'; // this is a site that our hash saved ther , if we use this link it gives us our data of img
var Content = null;
var flag = 0;
const d = new Date(); //date is library from js
var listOfActivities = []
var last = -1
// if we need to get some sevice from a oprtator we need host and port of that oprator
const ipfs = new IPFS({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' }); // we cam define of object as IPFS with ipfs.js

// XMLHtmlRequest use in ajax / we creat a object as XMLHtmlRequest in this function / by this object we can connect to URL or address (imgURL) and read datas
// XMLHtmlRequest usully use in AJAX
// ajax یک دستوری که با استفاده از ان میتونیم اطلاعات رو از کلاینت به سرور در محیط متمرکز ببریم
function makeHttpObject() {
    if ("XMLHttpRequest" in window) return new XMLHttpRequest();
    else if ("ActiveXObject" in window) return new ActiveXObject("Msxml2.XMLHTTP");
}


async function PrepareNetwork() {
    await loadWeb3();
    await LoadDataSmartContract();
}

async function loadWeb3() {

    if (window.ethereum) {
        window.web3 = new Web3(window.ethereum); // MetaMask
        await ethereum.request({ method: 'eth_requestAccounts' }).then(function (accounts) {
            CurrentAccount = accounts[0];
            web3.eth.defaultAccount = CurrentAccount;
            console.log('current account: ' + CurrentAccount);
            SetCurrentAccount();
        });
    } else if (window.web3) {
        window.web3 = new Web3(window.web3.currentProvider);
    } else {
        $.msgBox({  // it is alert . it create with spetial design css and jquery
            title: 'MetaMask Error',
            content: 'Non-Ethreum browser detected!',
            type: 'alert'
        });
    }

    ethereum.on('accoontChange', handleAccountChange); // from MetaMask API 
    ethereum.on('chainChange', handleChainChange);
}

function SetCurrentAccount() {
    $('#Address').text(CurrentAccount);
}


async function handleAccountChange() {
    await ethereum.request({ method: 'eth-reqqusetAccount' }).then(function (accounts) {
        CurrentAccount = accounts[0];
        web3.eth.defaultAccount = CurrentAccount;
        console.log('current account: ' + CurrentAccount);
        window.location.reload();
        SetCurrentAccount();
    });
}


async function handleChainChange(_chainId) {
    windoe.location.reload();
    console.log('cahin changed ', _chainId);
}


async function LoadDataSmartContract() {
    await $.getJSON('Instagram.json', function (contractData) {
        JsonContract = contractData;
    });

    // console.log("JsonContract: ",JsonContract);
    web3 = await window.web3;
    const networkId = await web3.eth.net.getId();
    // console.log("networkId: ",networkId)
    const networkData = await JsonContract.networks[networkId];
    // console.log("networkData:",  networkData);

    if (networkData) {
        MyContract = new web3.eth.Contract(JsonContract.abi, networkData.address)

        PostCounter = await MyContract.methods.postCounter().call();
        console.log('post counter: ', PostCounter);

        

    }

    $(document).on('click', '#addShortcut', addShortcut);
    
}

async function addShortcut() {

    shortcut = $("#nameShortcut").val();

    if (shortcut.trim() == '') {
        $.msgBox({  
            title: 'Alert box',
            content: 'plz fill box!',
            type: 'error'
        });
        return;
    }

    await MyContract.methods.addShortcut(shortcut).send({from:CurrentAccount}).then(function (instance) {
        $.msgBox({  
            title: 'Shortcut Alert',
            content: instance.event.returnValue.NewShortcut[0] + 'has added to Shortcuts',
            type: 'alert'
        });
    }).catch(function (error) {

        var msg = error.message;

        var idxbegin = msg.indexOf("Instagram");
        var idxend = msg.indexOf(",", idxbegin);

        var result = msg.slice(idxbegin, idxend - 1);

        if (result == '') {
            $.msgBox({
                title: "Metamask Error",
                content: "You Reject Transaction!",
                type: "error"
            });
        } else {
            $.msgBox({
                title: "User Error",
                content: result,
                type: "error"
            });
        }
    });

}


