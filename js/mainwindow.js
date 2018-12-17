const {BrowserWindow, app} = require('electron');
const path =  require('path');
const {ipcMain} = require('electron');
const logger = require('./logger.js');
const messages = require('./messages.js');
const urlParser =  require('./url_parser.js');
const tls = require('tls');


function onAsyncMsg(event, msg) {
    logger.log('receive async msg ' + msg.type);
    if(msg.type == messages.MSG_TYPE_CONNECT) {
        onConnectMsg(event, msg.param);
    } else if (msg.type == messages.MSG_TYPE_DISCONNECT) {
        onDisconnectMsg(msg.param);
    } else if (msg.type == messages.MSG_TYPE_QUIT) {
        closeWindowEx();
    } else if (msg.type == messages.MSG_TYPE_MINIMIZE) {
        mainWindow.minimize();
    }  else if (msg.type == messages.MSG_TYPE_ADMINPWD) {
        adminPwd = messages.getMsgParam(msg);
    } else {
        logger.log(mainWindow,'unknown msg '+ msg.type);
    }

}

function closeWindowEx() {
    logger.log('close window ex!!! quit ');
}


module.exports = {
    createMainWindow : function() {
        let winOptions = {
            width:350, height:450, 
            center:true, maximizable:false, 
            minimizable:true,closable:true, 
            title : 'pangolin-server-manager',
            frame : false,
            resizable: false
        }
        mainWindow = new BrowserWindow(winOptions);
        let mainPage = path.join('file://', __dirname, '../assets/index.html');
        mainWindow.on('ready-to-show', ()=>{
            logger.init();
            mainWindow.show();
        }); 
        //hs%3A%2F%2FdXNlcjE6YWJjZGZm%40caddyproxy.tk%3A443%2F%3Fcaddy%3D1
        mainWindow.loadURL(mainPage);
        //for debug usage
        //OpenDebug();
        mainWindow.on('close', (ev) => {
            mainWindow = null;
        });

        process.on('uncaughtException', (reason, p) =>{
            logger.log('uncaughtException '+ reason);
        });
    },
    closeWindow :  function() {
        closeWindowEx();
    },

    processMessages : function() {
        ipcMain.on('async-msg', (event, args) => {
            onAsyncMsg(event, args);
        });
    },
    openDebug: function() {
        mainWindow.webContents.openDevTools({mode:'detach'})
    }
}