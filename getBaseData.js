var qs = require("querystring");
var net = require("net");
var http = require("http");
process.on('message', function () {
    getBaseData();

});

function getBaseData() {
    var options = {
        hostname: 'XXX.XXX.XXX.XXX',
        port: XXXX,
        path: '/X/getBaseData',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        }
    };
    var req = http.request(options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (data) {
            //console.log(data);
            process.send(data);
        });
    });
    req.on('error', function (e) {
        console.log('problem with request: ' + e.message);
    });
    req.write("");
    req.end();
}
