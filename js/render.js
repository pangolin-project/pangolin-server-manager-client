const {ipcRenderer, clipboard} = require('electron');
const logger = require('../js/logger.js');
const messages = require('../js/messages.js');
const urlParser = require('../js/url_parser');
const tls = require('tls');
const https = require('https');
var randomstring = require("randomstring");

function checkInput() {
    var inputUrl = $('#url-input').val();
    if ( inputUrl.length <= 0) {
        alert('请输入服务器url');
        return false;
    }
    if (!urlParser.parseLinkStr(inputUrl)) {
        alert('链接格式不正确!');
        return false;
    }
    return true;
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
function InitConnectionWithServer() {
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    let host = urlParser.getProxyHost();
    let adminPort = urlParser.getAdminPort();
    let adminAuthStr = urlParser.getAdminAuthKey();
    const options = {
        hostname: host,
        port: adminPort,
        path: '/list',
        method: 'GET',
        checkServerIdentity: function(servername, cert) {
            logger.log('check server:'+ servername);
            return 'undefined';
        },
        headers : {'Proxy-Authorization': adminAuthStr},
      };
   try {
        let req = https.request(options, (res) => {
            logger.log('list response code : ' + res.statusCode);
            res.on('data', (data) => {
                try {
                    logger.log('data:' + data);
                    dataObj = JSON.parse(data);
                    if ( dataObj.ret == 0 ) {
                        for (var i in dataObj.users) {
                            appendUserOnUI(dataObj.list[i]);
                        }
                    } else {
                        logger.log("get list failed : " + dataObj.ret);
                    }
                } catch(e) {
                    logger.log("parse response error : " +  e);
                }
                
            });
        });
        req.end();
        return true;
   } catch(error) {
       logger.log('connect server failed :' + error);
       return false;
   }
   
}


function getRandomAuthStr() {
    let randUser = randomstring.generate(5);
    let randPwd =  randomstring.generate(8);
    let authStr = Buffer.from( randUser + ':' + randPwd ).toString('base64');
    return authStr;
}


//request to server . add user on server side. 
//return true or false
function doRequestAddUser() {
    let host = urlParser.getProxyHost();
    let adminPort = urlParser.getAdminPort();
    let adminAuthStr = urlParser.getAdminAuthKey();

    let postData = JSON.stringify({
        'authstr' : getRandomAuthStr()
    });
    const options = {
        hostname: host,
        port: adminPort,
        path: '/add',
        method: 'POST',
        headers : { 'Proxy-Authorization':  adminAuthStr,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
        }
    };

   let req = https.request(options, (res) => {
        logger.log('list response code : ' + res.statusCode);
        res.on('data', (data) => {
            dataObj = JSON.parse(data);
            if ( dataObj.ret == 0 ) {
                for (var i in dataObj.list) {
                    appendUserOnUI(dataObj.list[i]);
                }
            } else {
                logger.log("add user failed : " + dataObj.ret);
            }
        });
   });

   req.write(postData);
   req.end();
}

function doRequestDelUser(authStr) {
    let host = urlParser.getProxyHost();
    let adminPort = urlParser.getAdminPort();
    let adminAuthStr = urlParser.getAdminAuthKey();

    let postData = JSON.stringify({
        'authstr' : authStr
    });
    const options = {
        hostname: host,
        port: adminPort,
        path: '/del',
        method: 'POST',
        headers : { 'Proxy-Authorization': adminAuthStr,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
        }
    };

    try {
        let req = https.request(options, (res) => {
            logger.log('list response code : ' + res.statusCode);
            res.on('data', (data) => {
                dataObj = JSON.parse(data);
                if ( dataObj.ret == 0 ) {
                    removeUserFromUI(authStr);
                } else {
                    logger.log("get list failed : " + dataObj.ret);
                }
            });
       });
    
       req.write(postData);
       req.end();
    } catch(err) {
        logger.log("del user error :" + err);
    }
   
}


function appendUserOnUI(authStr) {
    let aUser = '<div id = "' +authStr+'">'+authStr+'&nbsp;&nbsp;<span><button id ="btn-'+ authStr+'">删除</button><span></div>';
    $('#user-list').append(aUser);
    $('#btn-' + authStr).bind('click', (ev) => {
        logger.log('click ' + ev.target.id);
    });
}

function removeUserFromUI(authStr) {
    $('#user-list').remove('#'+authStr);
}

function onAddUserClick() {
    if ( !checkInput()) {
        return;
    }
    if ( !InitConnectionWithServer() ) {
        alert('连接服务器失败!');
        return
    }

    logger.log('add user click');
    if (doRequestAddUser()) {
        appendUserOnUI();
    } else {
       
    }

    
}

// init event bindings

$(()=> {
    $('#add-user').bind('click', (ev)=>{
        onAddUserClick();
    });
    process.on('uncaughtException', (reason, p) => {
        logger.log('uncaught exception : ' + reason);
    });
});