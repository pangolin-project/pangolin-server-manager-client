const {ipcRenderer, clipboard} = require('electron');
const logger = require('../js/logger.js');
const messages = require('../js/messages.js');
const urlParser = require('../js/url_parser');
const tls = require('tls');
const https = require('https');

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

// http format for add and del user
/*
admin url format:
hs://base64(username:password)@host:port/?pangolin=1&adp=13412&adm=admin&pwd=123lladllasdf
================================
request add: host:port/add
proxy-authencation : base64(adminuser:password)
caddyproxy.tk/adduser
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
caddyproxy.tk/deluser
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
    list: [authstr1,authstr2,... authstrN]
}

*/


// true or false
//'Proxy-Authorization: Basic '+ authenKey +'\r\n\r\n'
function InitConnectionWithServer() {
    let host = urlParser.getProxyHost();
    let adminPort = urlParser.getAdminPort();
    let adminAuthStr = urlParser.getAdminAuthKey();
    const options = {
        hostname: host,
        port: adminPort,
        path: '/list',
        method: 'GET',
        headers : {'Proxy-Authorization': 'Basic ' + adminAuthStr + '\r\n\r\n'}
      };
   https.request(options, (res) => {
        logger.log('list response code : ' + res.statusCode);
        res.on('data', (data) => {
            dataObj = JSON.parse(data);
            if ( dataObj.ret == 0 ) {
                for (var i in dataObj.list) {
                    appendUserOnUI(dataObj.list[i]);
                }
            } else {
                logger.log("get list failed : " + dataObj.ret);
            }
        });
   });
}



//request to server . add user on server side. 
//return true or false
function doRequestAddUser() {

}


function appendUserOnUI(authStr) {
    let aUser = '<div id = "' +authStr+'">'+authStr+'</div>'
        $('#user-list').append(aUser);
        $('#' + authStr).bind('click', (ev) => {
            logger.log('click ' + ev.target.id);
        });
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
        
    } else {
        appendUserOnUI();
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