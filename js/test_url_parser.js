const url_parser = require('./url_parser.js');

function check_getDownloadUrl_case() {
    let input_args = ["https://123.html#",
     "https://123.html",
    "https://123.html#123",
    "https:////123.html#",
    "hs://123.html",
    "//123.html",
    "123.html#",
    "123.html",
    "https://123.html##",
    "https://#123.html#",
    "https://456./123.html#"];
    let expect_result_output = [false,false,false,false,false,false,false,false,false,false,false];
    let expect_DownloadUrl_output = ["https://123.html","https://github.com/pangolin-project/pangolin-client-pc/releases/download/v1.0.4/pangolin_client-win32-ia32.zip","https://123.html","https:////123.html",
    "https://github.com/pangolin-project/pangolin-client-pc/releases/download/v1.0.4/pangolin_client-win32-ia32.zip","https://github.com/pangolin-project/pangolin-client-pc/releases/download/v1.0.4/pangolin_client-win32-ia32.zip","https://github.com/pangolin-project/pangolin-client-pc/releases/download/v1.0.4/pangolin_client-win32-ia32.zip","https://github.com/pangolin-project/pangolin-client-pc/releases/download/v1.0.4/pangolin_client-win32-ia32.zip","https://github.com/pangolin-project/pangolin-client-pc/releases/download/v1.0.4/pangolin_client-win32-ia32.zip","https://github.com/pangolin-project/pangolin-client-pc/releases/download/v1.0.4/pangolin_client-win32-ia32.zip",
    "https://456./123.html"];
    let result_output = [];
    let DownloadUrl_output = [];
    for(i in input_args) {
        // console.log(input_args[i]);
        result = url_parser.parseLinkStr(input_args[i]);
        result_output[i] = result;
        //console.log('result is :'+result);
        getDownloadUrl = url_parser.getDownloadUrl();
        //console.log('getDownloadUrl is :'+getDownloadUrl+'\n');
        DownloadUrl_output[i] = getDownloadUrl;
    }
   for(i =0;i < result_output.length;i++)
   {
       if((result_output[i] != expect_result_output[i]) || (DownloadUrl_output[i]!=expect_DownloadUrl_output[i]))
        { 
            console.log('result_output is '+i+result_output[i]+expect_result_output[i]+DownloadUrl_output[i]+expect_DownloadUrl_output[i]+"check_getDownloadUrl_case run fail!");
            return false;
        }
    }
    console.log("check_getDownloadUrl_case run success!");
    return true;

}   
function check_getproxyurl_case() {
    let input_args = ["https://456./123.html#hs://123",
    "https://456./123.html#hs://123@xxxx",
   "https://456./123.html#hs://123:321@1.1.1.1:80/?pangolin=1&adp=13412&adm=admin&pwd=123lladllasdf",
   "https://456./123.html#hs://MTIzOjMyMQ==@1.1.1.1:80/?pangolin=1&adp=13412&adm=admin&pwd=123lladllasdf",
   "https://456./123.html#hs://MTIzOjMyMQ==@1.1.1.1:80/?pangolin=1&11111111111111111"];
   let expect_result_output = [false,false,false,true,true];
   let expect_result = [ [ 'https://456./123.html', '', '', '', 0, false, 0, '', '' ],
   [ 'https://456./123.html', '', '', '', 0, false, 0, '', '' ],
   [ 'https://456./123.html', '', '', '', 0, false, 0, '', '' ],
   [ 'https://456./123.html',
     '123',
     '321',
     '1.1.1.1',
     80,
     true,
     '13412',
     'admin',
     '123lladllasdf' ],
   [ 'https://456./123.html',
     '123',
     '321',
     '1.1.1.1',
     80,
     false,
     0,
     '',
     '' ] ];
   let result = [[]];
   let result_output = [];
   for(i in input_args) {
        let temp=[];
        result_t = url_parser.parseLinkStr(input_args[i]);
        result_output[i] = result_t;
        DownloadUrl = url_parser.getDownloadUrl();
        proxyUser = url_parser.getProxyUser();
        proxyPwd = url_parser.getProxyPwd();
        proxyHost = url_parser.getProxyHost();
        proxyPort = url_parser.getProxyPort();
        isAdmin = url_parser.getAdminFlag();
        adminPort = url_parser.getAdminPort();
        adminUser = url_parser.getAdminUser();
        adminPwd = url_parser.getAdminPwd();
        temp[0] = DownloadUrl;
        temp[1] = proxyUser;
        temp[2] = proxyPwd;
        temp[3] = proxyHost;
        temp[4] = proxyPort;
        temp[5] = isAdmin;
        temp[6] = adminPort;
        temp[7] = adminUser;
        temp[8] = adminPwd;
        result[i] = temp;
   }
   console.log(result);
//    console.log(result_output);
   for(i in result_output) {
       if(result_output[i] != expect_result_output[i])
       {
            console.log("check_getproxyurl_case run fail!");
            return false;
       }
            
   }

   for(i in result) {
        for(j in result[i]) {
            if(result[i][j] != expect_result[i][j])
                {
                    console.log("check_getproxyurl_case run fail!");
                    return false;
                }
        }
   }
   console.log("check_getproxyurl_case run success!");
}

check_getDownloadUrl_case();

check_getproxyurl_case();
