module.exports = {
     MSG_TYPE_LOG : 'msg-type-log', //// {type:'msg-type-log', param : 'xxxx'}
     MSG_TYPE_QUIT : 'msg-type-quit', // {type:'msg-type-quit', param : '0/-1}
     MSG_TYPE_MINIMIZE: 'msg-type-minimize', //{type: 'msg-type-minimize', param : ''}
     MSG_TYPE_ADMINPWD: 'msg-type-adminpwd', // {type: 'msg-type-adminpwd', param : 'adminpwd'}
     MSG_TYPE_QRCODE: 'msg-type-qrcode', //{type: 'msg-type-adminpwd', param : 'authstr'}
     buildMsg : function(msgType, param) {
         return {'type': msgType, 'param':param}
     },
     getMsgParam : function(msg) {
         return msg.param;
     }
}