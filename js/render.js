const { ipcRenderer, clipboard } = require('electron');
const logger = require('../js/logger.js');
const messages = require('../js/messages.js');
const urlParser = require('../js/url_parser');
const tls = require('tls');
const https = require('https');
var randomstring = require("randomstring");

var isServerAvilable = false;

function checkInput() {
    var inputUrl = $('#url-input').val();
    if (inputUrl.length <= 0) {
        alert('请输入服务器url');
        return false;
    }
    if (!urlParser.parseLinkStr(inputUrl)) {
        alert('链接格式不正确!');
        return false;
    }

    urlParser.saveAsAdmin();
    return true;
}


function dumpObj(obj) {
    var objstr = "obj:";
    for (var o in obj) {
        objstr += o + ":" + obj[o];
    }
    logger.log(objstr);
}

// http format for add/del user and get user list
/*
admin url format:
hs://base64(username:password)@host:port/?pangolin=1&adp=13412&adm=admin&pwd=123lladllasdf
================================
request add: host:port/add
proxy-authencation : base64(adminuser:password)
caddyproxy.tk/add
{
    authstr:base64(user:pwd)
}

//response:
200 ok
{
    ret: 0/-1
}

=================================
request del : host:port/del
proxy-authencation : base64(adminuser:password)
caddyproxy.tk/del
{
    authstr:base64(user:pwd)
}

//response:
200 ok
{
    ret: 0/-1
}

==================================
get user list request:host:port/list
proxy-authencation : base64(adminuser:password)
caddyproxy.tk/list


//response:
200 ok
{
    ret: 0/-1,
    users: [authstr1,authstr2,... authstrN]
}

*/


// true or false
//'Proxy-Authorization: authenKey 

//adminsuper:223123123
//hs://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTpTNFJaUFZnUERMOWw=@caddyproxy.tk:443/?pangolin=1&adp=48163&adm=adminsuper&pwd=223123123
function doRefreshUsers() {
    isServerAvilable = false;
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    let host = urlParser.getProxyHost();
    let adminPort = urlParser.getAdminPort();
    let adminAuthStr = urlParser.getAdminAuthKey();

    const options = {
        hostname: host,
        port: adminPort,
        path: '/list',
        method: 'GET',
        checkServerIdentity: function (servername, cert) {
            logger.log('check server:' + servername);
            return 'undefined';
        },
        headers: { 'Proxy-Authorization': adminAuthStr },
    };
    try {
        var completely_res = '';
        let req = https.request(options, (res) => {
            res.on('data', (data) => {
                try {
                    logger.log('parse list response:' + data);
                    completely_res += data;
                    var dataObj;
                    try {
                        dataObj = JSON.parse(completely_res);
                        completely_res = '';
                    } catch (e) {
                        logger.log('partial data:' + data);
                        return;
                    }

                    if (dataObj['ret'] == 0) {
                        isServerAvilable = true;
                        $('#user-list').empty();
                        for (var i in dataObj['users']) {
                            appendUserOnUI(dataObj['users'][i]);
                        }
                    } else {
                        logger.log("get list failed : " + dataObj.ret);
                    }
                } catch (e) {
                    logger.log("parse list response error : " + e);
                }
            });
        });
        req.end();
        return true;
    } catch (error) {
        logger.log('connect server failed :' + error);
        return false;
    }

}


function getRandomAuthStr() {
    let randUser = randomstring.generate(5);
    let randPwd = randomstring.generate(8);
    let authStr = Buffer.from(randUser + ':' + randPwd).toString('base64');
    return authStr;
}


//request to server . add user on server side. 
//return true or false
function doRequestAddUser() {
    let host = urlParser.getProxyHost();
    let adminPort = urlParser.getAdminPort();
    let adminAuthStr = urlParser.getAdminAuthKey();
    let newUser = getRandomAuthStr();
    let postData = JSON.stringify({
        'authstr': newUser
    });
    const options = {
        hostname: host,
        port: adminPort,
        path: '/add',
        method: 'POST',
        headers: {
            'Proxy-Authorization': adminAuthStr,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    let req = https.request(options, (res) => {
        res.on('data', (data) => {
            try {
                dataObj = JSON.parse(data);
                if (dataObj['ret'] == 0) {
                    appendUserOnUI(newUser);
                }
            } catch (e) {
                logger.log("add response error :" + e);
            }

        });
    });

    req.write(postData);
    req.end();
}



function doRequestDelUser(id) {
    let host = urlParser.getProxyHost();
    let adminPort = urlParser.getAdminPort();
    let adminAuthStr = urlParser.getAdminAuthKey();
    let authStr = id2AuthStr(id);
    let postData = JSON.stringify({
        'authstr': authStr
    });
    const options = {
        hostname: host,
        port: adminPort,
        path: '/del',
        method: 'POST',
        headers: {
            'Proxy-Authorization': adminAuthStr,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    try {
        let req = https.request(options, (res) => {
            logger.log('del response code : ' + res.statusCode);
            res.on('data', (data) => {
                try {
                    var dataObj = JSON.parse(data);
                    if (dataObj.ret == 0) {
                        removeUserFromUI(id);
                    } else {
                        logger.log("del failed : " + dataObj.ret);
                    }
                } catch (e) {
                    logger.log("del response error:" + e);
                }

            });
        });
        req.write(postData);
        req.end();
    } catch (err) {
        logger.log("del user error :" + err);
    }

}

function authStr2Id(authStr) {
    let id = Buffer.from(authStr, 'base64').toString();
    id = id.replace(':', '_');
    return id;
}

function id2AuthStr(id) {
    id = id.replace('_', ':');
    let authstr = Buffer.from(id).toString('base64');
    return authstr;
}

function getIdFromButtonId(btnId) {
    return btnId.replace('btn-', '');
}

function doCopyUser(btnId) {
    var textId = btnId.replace('btncopy-', '');
    if (textId.length > 0) {
        var authStr = $('#' + textId).text();
        let host = urlParser.getProxyHost();
        let port = urlParser.getProxyPort();
        let connectStr = "hs://" + authStr + "@" + host + ":" + port + "/?pangolin=1";
        clipboard.writeText(connectStr);
        alert('拷贝成功')
    } else {
        logger.log('get text id failed');
    }
}

// function doShowQRCode(id) {
//     id = id.replace('qrcodeshare-', '');
//     var authstr = id2AuthStr(id);
//     logger.log('authstr: ' + authstr);

//     let qrmsg = messages.buildMsg(messages.MSG_TYPE_QRCODE, authstr);
//     ipcRenderer.send('async-msg', qrmsg);
// }


function appendUserOnUI(authStr) {
    logger.log('append user :' + authStr);
    var encodeid = authStr2Id(authStr);
    let aUser = '';
    let firstElement = ($('#user-list').children().length == 0);
    let userLineClass = 'user-line';
    if ($('#user-list').children().length % 2 == 0) {
        userLineClass = 'user-line';
    } else {
        userLineClass = 'user-line2';
    }
    if (firstElement) {
        aUser = "<table id='tb-" + encodeid + "' class='" + userLineClass + "'><tr><td><div id='" + encodeid + "'>" + authStr + "</div></td><td><button id='btncopy-" + encodeid + "'>复制</button></td><td></td></tr></table>";
    } else {
        aUser = "<table id='tb-" + encodeid + "' class='" + userLineClass + "'><tr><td><div id='" + encodeid + "'>" + authStr + "</div></td><td><button id='btn-" + encodeid +
            "'>删除</button></td><td><button id='btncopy-" + encodeid + "'>复制</button></td></tr></table>";
    }
    logger.log('add user: ' + aUser);
    $('#user-list').append(aUser);

    try {

        if (!firstElement) {
            var element = document.getElementById('btn-' + encodeid);
            if (element) {
                element.addEventListener('click', (ev) => {
                    logger.log('click ' + ev.target.id);
                    var divId = getIdFromButtonId(ev.target.id);
                    doRequestDelUser(divId);
                });
            } else {
                logger.log('error element  is ' + element);
            }
        }

        var cpId = 'btncopy-' + encodeid;
        var element2 = $('#' + cpId);
        if (element2) {
            element2.bind('click', (ev) => {
                doCopyUser(ev.target.id);
            });
        } else {
            logger.log('bind copy event failed for ' + cpId);
        }


    } catch (e) {
        logger.log("get element error:" + e);
    }

}

function removeUserFromUI(id) {
    var divId = getIdFromButtonId(id);
    logger.log('remove element : ' + divId);
    $('#tb-' + divId).remove();
}

function onAddUserClick() {
    if (!checkInput()) {
        return;
    }
    if (!isServerAvilable) {
        alert('连接服务器失败!');
        return
    }
    doRequestAddUser();
}


function refreshUsers() {
    if (!checkInput()) {
        return;
    }
    doRefreshUsers();
}

function doQuit() {
    var quitMsg = messages.buildMsg(messages.MSG_TYPE_QUIT, '');
    ipcRenderer.send('async-msg', quitMsg);
}

// init event bindings

function getAdminLinkStrFromFile() {
    var adminStrs = urlParser.getAllProfilesForAdmin();
    if (adminStrs.length > 0) {
        return adminStrs[0];
    }
    return "";
}

$(() => {
    $('#add-user').bind('click', (ev) => {
        onAddUserClick();
    });
    $('#refresh-users').bind('click', (ev) => {
        refreshUsers();
    });

    $('#btn-quit').bind('click', (ev) => {
        doQuit();
    });

    $('#url-input').val(getAdminLinkStrFromFile());

    process.on('uncaughtException', (reason, p) => {
        logger.log('uncaught exception : ' + reason);
    });
});