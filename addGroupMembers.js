var qs = require("querystring");
var net = require("net");
var http = require("http");
process.on('message', function(data) {
    addGroupMembers(data);

});

function addGroupMembers(post_data) {
    console.log(post_data);
    var content = qs.stringify(post_data);
    var options = {
        hostname: 'XXX.XXX.XXXX.XXX',
        port: XXX,
        path: '/X/addGroupMembers',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        }
    };
    var req = http.request(options, function (res) {
        //console.log('STATUS: ' + res.statusCode);
        //console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function (data) {
            var data = JSON.parse(data);
            process.send({ result: data["MsgCode"] });
        });
    });
    req.on('error', function (e) {
        console.log('problem with request: ' + e.message);
    });
    req.write(content);
    req.end();
}
