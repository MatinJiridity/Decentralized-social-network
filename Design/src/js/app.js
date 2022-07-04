
$(function () {
    $(window).load(function () {
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
var isOwner = null;
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
        ShowPost();
        await setActivityOfUser();
        // await setRecentActivitiesOfuser() 
        showActivties();
        getShortcutList();
        checkOwner();
  
    }

    $(document).on('click', '#newpost', newpost);
    
}


async function newpost() {
    var descripetion = $('#descripetion').val();
    if (descripetion.trim() == '') {
        $.msgBox({  // it is alert . it create with special design css and jquery
            title: 'Alert box',
            content: 'plz fill descripetion!',
            type: 'error'
        });
        return;
    }

    MyContract.methods.uplodPost(IPFS_Hash, descripetion, d.toString()).send({ from: CurrentAccount }).then(async function (instance) {
                $.msgBox({  // it is alert . it create with spetial design css and jquery
                title: 'Upload Post',
                content: 'Post created by ' + instance.event.PostCreat.returnValues[3],
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
    ShowPost();
}


async function addLike(id) {
    // console.log('id:', id);
    // who are like my post with id
    var whoLikes = await MyContract.methods.getLikeAddress(id).call();
    console.log('whoLikes: ', whoLikes);
    var likes = await MyContract.methods.getPost(id).call();

    const found = await whoLikes.find(element => element.toLowerCase() == CurrentAccount); // this is way define a variable and use that simultaneous
    console.log('found: ', found); // found for first time who want like is zero
    if (whoLikes.length > 0 && found != undefined) {
        if (found.toLowerCase() == CurrentAccount) { // it means current acount has liked post so he can sublike
            MyContract.methods.subLike(id).send({ from: CurrentAccount }).then(async function (instance) {


                $.msgBox({  // it is alert . it create with spetial design css and jquery
                    title: 'Sub Like',
                    content: 'Post sub likes',
                    type: 'alert'
                });
                let post = MyContract.methods.getPost(id).call();
                var idtag = "#like" + id;

                $(idtag).html(post.likeCounter);
            }).catch(function (error) {
                var msg = error.message;

                var idxbegin = msg.indexOf("Instagram");
                var idxend = msg.indexOf(",", idxbegin);

                var result = msg.slice(idxbegin, idxend-1);

                // manage error if user reject from metamask for canceling tx
                if (result == '') {
                    $.msgBox({  // it is alert . it create with spetial design css and jquery
                        title: 'MetaMask error',
                        content: 'You reject tx !',
                        type: 'error'
                    });
                } else {
                    $.msgBox({  // it is alert . it create with spetial design css and jquery
                        title: 'User error',
                        content: result,
                        type: 'error'
                    });
                }
            });
        } else { // he has not liked so now he can like
            MyContract.methods.addLike(id).send({ from: CurrentAccount }).then(async function (instance) {


                $.msgBox({  // it is alert . it create with spetial design css and jquery
                    title: 'Add Like',
                    content: 'Post add likes',
                    type: 'alert'
                });
                let post = MyContract.methods.getPost(id).call();
                var idtag = "#like" + id;

                $(idtag).html(post.likeCounter);
            }).catch(function (error) {
                var msg = error.message;

                var idxbegin = msg.indexOf("Instagram");
                var idxend = msg.indexOf(",", idxbegin-1);

                var result = msg.slice(idxbegin, idxend);

                // manage error if user reject from metamask for canceling tx
                if (result == '') {
                    $.msgBox({  // it is alert . it create with spetial design css and jquery
                        title: 'MetaMask error',
                        content: 'You reject tx !',
                        type: 'error'
                    });
                } else {
                    $.msgBox({  // it is alert . it create with spetial design css and jquery
                        title: 'User error',
                        content: result,
                        type: 'error'
                    });
                }
            });
        }
    } else { // this is for only first  add like 
        MyContract.methods.addLike(id).send({ from: CurrentAccount }).then(async function (instance) {

            $.msgBox({  // it is alert . it create with spetial design css and jquery
                title: 'Add Like',
                content: 'Post add likes',
                type: 'alert'
            });
            let post = MyContract.methods.getPost(id).call();
            var idtag = "#like" + id;

            $(idtag).html(post.likeCounter);
        }).catch(function (error) {
            var msg = error.message;

            var idxbegin = msg.indexOf("Instagram");
            var idxend = msg.indexOf(",", idxbegin);

            var result = msg.slice(idxbegin, idxend-1);

            // manage error if user reject from metamask for canceling tx
            if (result == '') {
                $.msgBox({  // it is alert . it create with spetial design css and jquery
                    title: 'MetaMask error',
                    content: 'You reject tx !',
                    type: 'error'
                });
            } else {
                $.msgBox({  // it is alert . it create with spetial design css and jquery
                    title: 'User error',
                    content: result,
                    type: 'error'
                });
            }
        });
    }
}


async function addDisLike(id) {
    console.log('id:', id);
    // who are like my post with id
    var whoLikes = await MyContract.methods.getDislikeAddress(id).call();

    const found = await whoLikes.find(element => element.toLowerCase() == CurrentAccount); // this is way define a variable and use that simultaneous
    console.log('found: ', found); // found for first time who want like is zero
    if (whoLikes.length > 0 && found != undefined) {
        if (found.toLowerCase() == CurrentAccount) { // it means current acount has liked post so he can sublike
            MyContract.methods.subDislike(id).send({ from: CurrentAccount }).then(async function (instance) {
                $.msgBox({  // it is alert . it create with spetial design css and jquery
                    title: 'Sub  Dislike',
                    content: 'Post sub Dislike',
                    type: 'alert'
                });
                let post = MyContract.methods.getPost(id).call();
                var idtag = "#dislike" + id;

                $(idtag).html(post.likeCounter);
            }).catch(function (error) {
                var msg = error.message;

                var idxbegin = msg.indexOf("Instagram");
                var idxend = msg.indexOf(",", idxbegin);

                var result = msg.slice(idxbegin, idxend-1);

                // manage error if user reject from metamask for canceling tx
                if (result == '') {
                    $.msgBox({  // it is alert . it create with spetial design css and jquery
                        title: 'MetaMask error',
                        content: 'You reject tx !',
                        type: 'error'
                    });
                } else {
                    $.msgBox({  // it is alert . it create with spetial design css and jquery
                        title: 'User error',
                        content: result,
                        type: 'error'
                    });
                }
            });
        } else { // he has not liked so now he can like
            MyContract.methods.addDislike(id).send({ from: CurrentAccount }).then(async function (instance) {
                $.msgBox({  // it is alert . it create with spetial design css and jquery
                    title: 'Add Dislike',
                    content: 'Post add dislikes',
                    type: 'alert'
                });
                let post = MyContract.methods.getPost(id).call();
                var idtag = "#dislike" + id;

                $(idtag).html(post.likeCounter);
            }).catch(function (error) {
                var msg = error.message;

                var idxbegin = msg.indexOf("Instagram");
                var idxend = msg.indexOf(",", idxbegin);

                var result = msg.slice(idxbegin, idxend-1);

                // manage error if user reject from metamask for canceling tx
                if (result == '') {
                    $.msgBox({  // it is alert . it create with spetial design css and jquery
                        title: 'MetaMask error',
                        content: 'You reject tx !',
                        type: 'error'
                    });
                } else {
                    $.msgBox({  // it is alert . it create with spetial design css and jquery
                        title: 'User error',
                        content: result,
                        type: 'error'
                    });
                }
            });
        }
    } else { // this is for only first  add like 
        MyContract.methods.addDislike(id).send({ from: CurrentAccount }).then(async function (instance) {
            $.msgBox({  // it is alert . it create with spetial design css and jquery
                title: 'Add Dislike',
                content: 'Post add dislikes',
                type: 'alert'
            });
            let post = MyContract.methods.getPost(id).call();
            var idtag = "#dislike" + id;

            $(idtag).html(post.likeCounter);
        }).catch(function (error) {
            var msg = error.message;

            var idxbegin = msg.indexOf("Instagram");
            var idxend = msg.indexOf(",", idxbegin);

            var result = msg.slice(idxbegin, idxend-1);

            // manage error if user reject from metamask for canceling tx
            if (result == '') {
                $.msgBox({  // it is alert . it create with spetial design css and jquery
                    title: 'MetaMask error',
                    content: 'You reject tx !',
                    type: 'error'
                });
            } else {
                $.msgBox({  // it is alert . it create with spetial design css and jquery
                    title: 'User error',
                    content: result,
                    type: 'error'
                });
            }
        });
    }
}


// by input tag html reads file and by previewFile() html shows img on window  [onchamge=previewFile() == event]
async function previewFile() { // when he chose img preview func is called

    const file = document.querySelector('input[type=file]').files[0];
    // const file = $("#fileimg").val();

    const reader = new FileReader(); // FileReader is cllass in js can convert array & sellol ,..
    reader.readAsDataURL(file); // file converted to data url

    // define a loading be cuase we want show a post on window / we want connect an event to reader/ when (load) is happening run function
    reader.addEventListener('load', async function () {   // addEventListener اضافه کردن ااتومات یک ایونت هست یعنی به جای ایونت در جی کوعری میتونیم دستی ایونت بزاریم
        // console.log('result: ' + reader.result);
        Content = reader.result;

        // we want show img on window

        // prevent of reapeted of one tag
        if (flag == 0) {
            var br = '<br>';
            $('#showimgnft').append(br);
            var newEleman = '<img id="nftimg" src="' + Content + '">' + '</img>';
            $('#showimgnft').append(newEleman);
        }
        flag = 1;

        $("#nftimg").attr("src", Content);

        $("#overlay").fadeIn(300);

        // save this image in ipfs
        // $("#overaly").fadeIn(300);  // fadeIn for when we are entring on window and it  is loading

        await ipfs.add(reader.result, function (error, hash) { //هش و اروز خروجی های تابع ipfs.add هست

            if (error) {
                $.msgBox({
                    title: 'IPFS Error',
                    content: 'Error Add to IPFS!',
                    type: 'error'
                });
                return false;
            } else {
                IPFS_Hash = hash;
                console.log("IPFS_Hash: ", IPFS_Hash);
                $("#overlay").fadeOut(300);
            }
        });
    });
}


// a function that show all of my post
async function ShowPost() {
    // it s take time so handle time and loading

    $('#overaly').fadeIn(300);
    PostCounter = await MyContract.methods.postCounter().call();

    for (let i = PostCounter - 1; i >= 0; i--) {
        await CreatePostsDesign(i);

        let post = await MyContract.methods.getPost(i).call();
        await CreateComment(i,  post.commentCounter);
    }


    $("#overlay").fadeOut(300);

}


function sleep(ms) {

    return new Promise(resolve => setTimeout(resolve, ms));

}


async function CreatePostsDesign(i) {
    let post = await MyContract.methods.getPost(i).call();
    // console.log("post", post);

    var dateCheck = post.date.slice(4, 25);
    // console.log(dateCheck);


    getImageSRC(post.hashImage); // await does not work heare
    // console.log(post.hashImage);
    // we need a little time when we open window to loading posts
    await sleep(100);

    // we change some validate in WINKU design  
    var htmlTag =
        '<div class="loadMore" >'+
            '<div class="central-meta item" >' +
                '<div class="user-post" >' +
                    '<div class="friend-info" color: rgb(254, 241, 251);>' +
                        '<div class="friend-name">' +
                            ' <ins><a href="time-line.html" title="">' + post.author + '</a></ins>'+
                            '<span>published: ' + dateCheck + '</span>' +
                        '</div>' +
                        '<hr>' +
                        '<div class="post-meta">' +
                            '<img src=" '+ Content +'" alt="" id="ShowIMG">'+

                            '<div class="we-video-info">'+
                                '<ul>' +

                                    '<li>' +
                                        '<span class="comment" data-toggle="tooltip" title="Comments">' +
                                        '<i class="fa fa-comments-o"></i>' +
                                        '<ins id="">' + post.commentCounter + '</ins>' +
                                        '</span>' +
                                    '</li>' +

                                    '<li>' +
                                        '<span class="like" data-toggle="tooltip" title="like">' +
                                        '<i class="ti-heart" onclick="addLike(' + post.id + ')"></i>' +
                                        '<ins id="like' + i + '">' + post.likeCounter + '</ins>' +
                                        '</span>' +
                                    '</li>' +

                                    '<li>' +
                                        '<span class="dislike" data-toggle="tooltip" title="dislike">' +
                                        '<i class="ti-heart-broken" onclick="addDisLike(' + post.id + ')"></i>' +
                                        '<ins id="dislike' + i + '">' + post.dislikeCounter + '</ins>' +
                                        '</span>' +
                                    '</li>' +

                                    '<li>' +
                                        '<span class="like" data-toggle="tooltip" title="Tip" style="color:purpule;">' +
                                        '<i class="fa fa-dollar" onclick="CheckTip(' + post.id + ')"></i>' +
                                        '<ins id="tip' + i + '">' + web3.utils.fromWei(post.tipAmount, 'ether') + '</ins>' +
                                        '</span>' +
                                    '</li>' +


                                '</ul>' +
                            '</div>'+
                            '<div class="description">' +
                                '<p style="clolor:black;">' + post.descripetion + '</p>' +
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    
                    '<div class="coment-area">'+
                    '<li class="post-comment">'+
                        '<div style="color : #7FBA00;">'+ CurrentAccount +'</div>'+
                        '<div class="post-comt-box">'+
                            '<div>'+
                                '<textarea placeholder="post your comment" id="comment'+i+'"></textarea>'+
                                '<button class="btn btn-primary" onclick="AddComment('+post.id+')">Comment</button>'+
                            '</div>'+
                        '</div>'+
                    '</li>'+
                            
                    '<li id="comments'+ i +'">'+  

                    '</li>'+
                '</div>'+    

                '</div>'+
            '</div>'+
        '</div>';


    await $("#showPosts").append(htmlTag);

}


// this function reads data of img
function getImageSRC(HashIMG) {
    var imgURL = Host_Name + HashIMG; // == reader.result if u open this address or URL you'll see ur data image 
    // console.log("imgURL: ", imgURL)

    var request = makeHttpObject();
    request.open("GET", imgURL, true);
    request.send(null);
    request.onreadystatechange = function () { // منتظر زمانی باشیم که خوندن اون دیتای بزرگ تموم شه
        if (request.readyState == 4) { // وقتی خوندن اون دیتای زیاد تموم شد
            Content = request.responseText;
            // console.log("Content", Content);

        }
    }

}


function AddComment(id) {

    var cmid = "#comment"+ id;
    var comment = $(cmid).val();
    console.log(comment);

    if (comment.trim() == '') {
        $.msgBox({  // it is alert . it create with special design css and jquery
        title: 'Alert box',
        content: 'plz fill descripetion!',
        type: 'error'
        });
        return;
    }

    MyContract.methods.addComment(id, comment, d.toString()).send({ from: CurrentAccount }).then(async function (instance) {
        $.msgBox({  
            title: 'Add comment',
            content: 'comment posted by'+ instance.events.CommentCreated.returnValues[3],
            type: 'alert'
        });
    }).catch(function (error) {
        var msg = error.message;
        console.log(msg)
        var idxbegin = msg.indexOf("Instagram");
        var idxend = msg.indexOf(",", idxbegin);

        var result = msg.slice(idxbegin, idxend);
        window.location.reload();

        // manage error if user reject from metamask for canceling tx
        if (result == '') {
            $.msgBox({  // it is alert . it create with spetial design css and jquery
                title: 'MetaMask error',
                content: 'You reject tx !',
                type: 'error'
            });
        } else {
            $.msgBox({  // it is alert . it create with spetial design css and jquery
                title: 'User error',
                content: result,
                type: 'error'
            });
        }

    });

}


async function CreateComment(id, cmidx) {
    //  console.log(cmidx);

    comments = await MyContract.methods.getComments(id).call();
    // console.log(comments);

    for (let x = cmidx-1; x >= 0 ; x--) {
        CreateCommentDesign(comments[x], id);
    }
}


async function CreateCommentDesign(comments, id) {

    let dateComment = comments.slice(4,25);

    htmlTagComment = 
            '<div class="we-comment" >'+
                '<div class="comment-head" >'+
                    '<a href="#" title=" size: 1px; color: hsla(245, 92%, 38%, 0.353)">'+comments.author+'</a></h5>'+
                    '<span>'+dateComment+'</span>'+
                '</div>'+
                '<p style="color: black;">'+comments.comment+'</p>'+
            '</div>'+
            '<br>' ;
    let idcomment = "#comments" + id;
    $(idcomment).append(htmlTagComment);
}


function CheckTip(id) {

    $.msgBox({ type: "prompt",
        title: "Value Of Tip(Ether)",
        inputs: [
            { header: "Tip Amount(Ether)", type: "number", value : 0, name: "tip" }],
        buttons: [
            { value: "Tip" }, {value:"Cancel"}],
        success: function (result, values) {
            // alert(values[0].value);
            // tipAmount = values[0].value;
            if (values[0].value != 0) {
                Tip(id, values[0].value);
            }else{
                $.msgBox({
                    title: "Textbox Error",
                    content: "Please insert Non Zero",
                    type: "error"
                });
            }
           
        }
    });
    
}


async function Tip(id, tip) {

    let tipAmount = web3.utils.toWei(tip, 'ether');

    await MyContract.methods.tipPost(id).send({from: CurrentAccount, value: tipAmount}).then(async function (instance) {
        $.msgBox({
            title: "Tip Post",
            content: "Tip amount: "+ instance.events.TipPosted.returnValues[1],
            type: "error"
        });
        window.location.reload();

    }).catch(function (error) {
        var msg = error.message;
        console.log(msg)
        var idxbegin = msg.indexOf("Instagram");
        var idxend = msg.indexOf(",", idxbegin);

        var result = msg.slice(idxbegin, idxend);

        if (result == '') {
            $.msgBox({ 
                title: 'MetaMask error',
                content: 'You reject tx !',
                type: 'error'
            });
        } else {
            $.msgBox({  
                title: 'User error',
                content: result,
                type: 'error'
            });
        }
    })
}


async function setActivityOfUser() {
    activties = await MyContract.methods.getActivities(CurrentAccount).call();   
    // console.log(activties); 

    firstPartOfAddress =  CurrentAccount.slice(0, 6);
    secondPartOfAddress = CurrentAccount.slice(38, 42);
    // console.log(firstPartOfAddress,secondPartOfAddress); 
    shortAddress = firstPartOfAddress + "..." +secondPartOfAddress;
    // console.log(shortAddress); 

    $("#shortAddress").append(shortAddress);
    $("#postsAmount").append(activties.postsAmount);
    $("#likesAmount").append(activties.likesAmount);
    $("#dislikesAmount").append(activties.dislikesAmount);
    $("#commentsAmount").append(activties.commentsAmount);
    $("#tipAmount").append(activties.tipAmount);

}


async function showActivties() {                

    await MyContract.methods.getTimeListActivities(CurrentAccount).call().then(function (result) {
        // console.log(result )

        tmstmp1 = result[result.length -1]
        // console.log(tmstmp1)

        if (tmstmp1 == null) {
            $("#time-1").append(" ");
        }else {
            $("#time-1").append(dateCheck(tmstmp1));
        }

        tmstmp2 = result[result.length -2]
        // console.log(tmstmp2)

        if (tmstmp2 == null) {
            $("#time-2").append(" ");
        }else {
            $("#time-2").append(dateCheck(tmstmp2));
        }

        tmstmp3 = result[result.length -3]
        // console.log(tmstmp3)
     
        if (tmstmp3 == null) {
            $("#time-3").append(" ");
        }else {
            $("#time-3").append(dateCheck(tmstmp3));
        }
    });

    await MyContract.methods.getListActivities(CurrentAccount).call().then(function (result) {
        console.log(result);

        last1Activty = result[result.length -1]
        // console.log(last1Activty)     
        checkActivity(last1Activty, "#activity-1");

        last2Activty = result[result.length -2]
        // console.log(last2Activty)
        checkActivity(last2Activty, "#activity-2");

        
        last3Activty = result[result.length -3]
        // console.log(last3Activty)
        checkActivity(last3Activty, "#activity-3");

    })

}

function dateCheck(timeStamp) {

    date = new Date(timeStamp * 1000);
    hours = date.getHours();
    minutes = "0" + date.getMinutes();
    seconds = "0" + date.getSeconds();
    formattedTime = `${hours}:${minutes.substr(-2)}:${seconds.substr(-2)}`;
    var month = date.getMonth()+1;
    var day = date.getDate();
    var year = date.getFullYear();
    var formattedHistory = month + '/' + day + '/' + year;

    return  formattedTime+" "+formattedHistory;
}

function checkActivity(actvity, idActivity) {
    if (actvity == 0) {
        $(idActivity).append("You have Posted");   
    }
    if (actvity == 1) {
        $(idActivity).append( "You have Added Like");   
    }
    if (actvity == 2) {
        $(idActivity).append("You have Subtracted Like");
    }
    if (actvity == 3) {
        $(idActivity).append("You have Added Dislike");
    }
    if (actvity == 4) {
        $(idActivity).append("You have Subtracted Dislike");
    }
    if (actvity == 5) {
        $(idActivity).append("You have Added Comment");
    }
    if (actvity == 6) {
        $(idActivity).append("You have Tipped Ether");
    }
}


function getShortcutList() {

    MyContract.methods.getShortcutList().call().then(function (result) {
        ShortcutList = result;
        // console.log("ShortcutList", ShortcutList)
                
        for (let x = ShortcutList.length - 1; x >= 0; x--) {
            CreateShortcut(x);


        }
    });  
}

function CreateShortcut(x) {
    // console.log(x);
    var htmlShortcut = 
                '<li>' +
                    '<a>'+ShortcutList[x]+'</a>' +
                '</li>';
    
    $(".naves").append(htmlShortcut);
}

async function checkOwner() {
    await MyContract.methods.checkOwner(CurrentAccount).call().then(function (result) {
        if (result == true) {

            isOwner = true;
            console.log(" Owner connect Now ", isOwner);
            document.getElementById("myButton").onclick = function() {location.href = "admin.html";}

        } else {
            isOwner =  false;
            console.log(" User connect Now ", isOwner);

        }

    });
    
}