var qs = require("querystring");
var net = require("net");
var http = require("http");
process.on('message', function (data) {
    pushIosMessage(data);

});

function pushIosMessage(push_data) {
    var content = qs.stringify(push_data);
    var options = {
        hostname: 'XXX.XXX.XXX.XXX',
        port: XXX,
        path: '/XXX/send',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        }
    };
    console.log(push_data);
    var req = http.request(options, function (res) {
        //console.log('STATUS: ' + res.statusCode);
        //console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function (data) {
            //console.log(post_data.MessageTime);
            process.send({result: 1});
        });
    });
    req.on('error', function (e) {
        console.log('problem with request: ' + e.message);
    });
    req.write(content);
    req.end();
}
