var net = require("net");
var http = require("http");
var child_process = require("child_process");
var getDate = require("./getDate.js");
//..
var accounts = [];
var post_data = {
    SourceId: 0,
    DestionationId: 0,
    MessageCon: "",
    MessageTime: "",
    online: false
};
var post_groupdata = {
    SourceId: 0,
    DestionationId: "",
    MessageCon: "",
    MessageTime: "",
    online: false
};
//iospush tokens
var tokens = [];
//iospush data
var push_data = {
    token: 0,
    msg: ""
};
var group_data = {
    SourceId: 0,
    DestionationId: 0,
    MessageCon: "",
    MessageTime: "",
    online: false
};
var createGroupData = {
    groupName: "",
    ownerId: 0,
    members: "",
    type: 1,
    groupId: ""
};
var deleteGroupData = {
    id: ""
};
var deleteGroupMembersData = {
    id: "",
    members: ""
};
var addGroupMembersData = {
    id: "",
    members: ""
};
var get_data = {
    DestionationId: 0
};
var get_groupdata = {
    id: 0
}
var getGroupData = {
    id: ""
}
var saveGroupMessagedata = {
    GroupId: "",
    MemberIds: "",
    MessageCon: "",
    MessageSourceId: "",
    MessageTime: ""
};
var groups = [];
var baseDataMsg = "";
getBaseData(server, function () {
    server();
    var options = {
        hostname: 'XXX.XXX.XXX.XXX',
        port: 9000,
        path: '/webReference.asmx/getBaseData',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        }
    };
    var req = http.request(options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (data) {
            baseDataMsg += data;

        });
        res.on('end', function () {
            try {
                var data = JSON.parse(baseDataMsg);
                if (data["MsgCode"] !== 0) {
                    for (var i = 0, l = data["Entity"].length; i < l; i++)
                        groups["Q" + data["Entity"][i]["GroupId"]] = data["Entity"][i]["MemberIds"];
                }
                console.log("> All base data has been acquired..." + getDate.getDate());
            } catch (e) {
                console.log("> Error.the active to acquire the base data is wrong...")
            }
        });
    });
    req.on('error', function (e) {
        console.log('> problem with request: ' + e.message);

    });
    req.write("");
    req.end(function () {
        console.log("> Getting data from databases...");
        setTimeout(function () {
            console.log("> Please wait...");
        }, 1);
    });
});
function server() {
    net.createServer(function (socket) {
        socket.name = socket.remoteAddress;
        socket.on('data', function (data) {
            console.log(socket.name + "[" + new Date() + '].get data:' + data);
            try {
                var obj = JSON.parse(data);
                switch (obj["code"]) {
                    case 1:
                        //login
                        //register member
                        if (accounts["U" + parseInt(obj["sid"])]) {
                            delete accounts["U" + parseInt(obj["sid"])];
                        }
                        accounts["U" + parseInt(obj["sid"])] = socket;
                        //register ios token
                        if (tokens["K" + obj["sid"]])
                            delete tokens[obj["sid"]];
                        tokens["K" + obj["sid"]] = obj["token"];
                        if (accounts["U" + parseInt(obj["sid"])]) {
                            console.log(obj["sid"] + " login." + getDate.getDate());
                        }
                        get_data.DestionationId = obj["sid"];
                        get_groupdata.id = obj["sid"];
                        closure(getUnreadMessage, get_data);
                        closure(getUnreadGroupMessage, get_groupdata);
                        break;
                    case 2:
                        //member message
                        //setTimeout(pushIosMessageFork(push_data), 0);
                        post_data.MessageTime = getDate.getDate();
                        post_data.SourceId = obj["entity"]["sid"];
                        post_data.DestionationId = obj["entity"]["did"];
                        post_data.MessageCon = obj["entity"]["con"];
                        if (accounts["U" + parseInt(obj["entity"]["did"])]) {
                            var obj = JSON.parse(data);
                            obj["time"] = getDate.getDate();
                            accounts["U" + parseInt(obj["entity"]["did"])].write(JSON.stringify(obj) + '\r\n');
                            post_data.online = true;
                        }
                        else {
                            post_data.online = false;
                        }
                        if (!accounts["U" + parseInt(obj["entity"]["sid"])])
                            accounts["U" + parseInt(obj["entity"]["sid"])] = socket;
                        tokens["K" + obj["entity"]["sid"]] = obj["entity"]["token"];
                        push_data.token = tokens["K" + obj["entity"]["did"]];
                        push_data.msg = obj["entity"]["sid"] + ":" + obj["entity"]["con"];
                        (function (e) {
                            setImmediate(function () {
                                saveMessageFork(e);
                            });
                        })(post_data);
                        (function (e) {
                            setImmediate(function () {
                                pushIosMessageFork(e);
                            });
                        })(post_data);
                        break;
                    case 3:
                        //heart
                        if (!accounts["U" + parseInt(obj["sid"])])
                            accounts["U" + parseInt(obj["sid"])] = socket;
                        break;
                    case 4:
                        //exit
                        if (accounts["U" + parseInt(obj["sid"])]) {
                            delete accounts["U" + parseInt(obj["sid"])];
                        }
                        socket.end();
                        break;
                    case 5:
                        //create talkGroup OR add new member(s)
                        //..
                        createGroupData.ownerId = obj["entity"]["sid"];
                        createGroupData.groupName = obj["entity"]["name"];
                        createGroupData.groupId = obj["entity"]["id"];
                        var arrMembers = obj["entity"]["list"];
                        var members = [];
                        members.push(obj["entity"]["sid"]);
                        for (var i = 0, l = arrMembers.length; i < l; i++) {
                            if (accounts["U" + parseInt(arrMembers[i]["id"])]) {
                                var obj = JSON.parse(data);
                                obj["time"] = getDate.getDate();
                                accounts["U" + parseInt(arrMembers[i]["id"])].write(JSON.stringify(obj) + '\r\n');
                                console.log(arrMembers[i]["id"].toString());
                            }
                            createGroupData.members += "." + arrMembers[i]["id"];
                            members.push(parseInt(arrMembers[i]["id"]));
                        }
                        groups["Q" + obj["entity"]["id"]] = members;
                        closure(createGroupFork, createGroupData);
                        break;
                    case 6:
                        //delete talkGroup
                        deleteGroupData.id = obj["entity"]["id"];
                        if (groups["Q" + obj["entity"]["id"]]) {
                            var memberlist = groups["Q" + obj["entity"]["id"]];
                            console.log(memberlist);
                            for (var i = 0, l = memberlist.length; i < l; i++) {
                                console.log("delete group" + memberlist[i]);
                                if (accounts["U" + parseInt(memberlist[i])]) {
                                    var obj = JSON.parse(data);
                                    obj["time"] = getDate.getDate();
                                    accounts["U" + parseInt(memberlist[i])].write(JSON.stringify(obj) + '\r\n');
                                    //console.log("delete talkGroup " + memberlist[i].toString().replace(/\s/g, ''));
                                }
                            }
                        }
                        delete groups["Q" + obj["entity"]["id"]];
                        (function (e) {
                            setImmediate(function () {
                                deleteGroupFork(e);
                            });
                        })(deleteGroupData);
                        break;
                    case 7:
                        //remove member(s) from talkGroup
                        deleteGroupMembersData.id = obj["entity"]["id"];
                        var arrMembers = obj["entity"]["list"];
                        if (groups["Q" + obj["entity"]["id"]]) {
                            for (var i = 0, l = arrMembers.length; i < l; i++) {
                                deleteGroupMembersData.members += "." + parseInt(arrMembers[i]["id"]);
                            }
                            var memberlist = groups["Q" + obj["entity"]["id"]];
                            for (var i = 0, l = memberlist.length; i < l; i++) {
                                if (accounts["U" + parseInt(memberlist[i])]) {
                                    var obj = JSON.parse(data);
                                    obj["time"] = getDate.getDate();
                                    accounts["U" + parseInt(memberlist[i])].write(JSON.stringify(obj) + '\r\n');
                                }
                            }

                            for (var i = 0, l = arrMembers.length; i < l; i++) {
                                if (groups["Q" + obj["entity"]["id"]].indexOf(parseInt(arrMembers[i]["id"])) > 0) {
                                    delete  groups["Q" + obj["entity"]["id"]].splice(groups["Q" + obj["entity"]["id"]].indexOf(parseInt(arrMembers[i]["id"])).toString(), 1);
                                }
                            }
                        }
                        (function (e) {
                            setImmediate(function () {
                                deleteGroupMembersFork(e);
                            });
                        })(deleteGroupMembersData);
                        break;
                    case 8:
                        //group message
                        if (groups["Q" + obj["entity"]["did"]]) {
                            var memberlist = groups["Q" + obj["entity"]["did"]];
                            var members = "";
                            for (var i = 0, l = memberlist.length; i < l; i++) {
                                if (accounts["U" + parseInt(memberlist[i])] && parseInt(obj["entity"]["sid"]) !== parseInt(memberlist[i])) {
                                    var obj = JSON.parse(data);
                                    obj["time"] = getDate.getDate();
                                    accounts["U" + parseInt(memberlist[i])].write(JSON.stringify(obj) + '\r\n');
                                    members += "." + parseInt(memberlist[i]);
                                }
                            }
                            saveGroupMessagedata.MemberIds = members;
                            saveGroupMessagedata.GroupId = obj["entity"]["did"];
                            saveGroupMessagedata.MessageCon = obj["entity"]["con"];
                            saveGroupMessagedata.MessageSourceId = obj["entity"]["sid"];
                            saveGroupMessagedata.MessageTime = getDate.getDate();
                            //console.log(saveGroupMessagedata);
                            (function (e) {
                                setImmediate(function () {
                                    saveGroupMessageFork(e);
                                });
                            })(saveGroupMessagedata);

                            post_groupdata.MessageTime = getDate.getDate();
                            post_groupdata.SourceId = obj["entity"]["sid"];
                            post_groupdata.DestionationId = obj["entity"]["did"];
                            post_groupdata.MessageCon = obj["entity"]["con"];
                            if (accounts["U" + obj["entity"]["did"]]) {
                                post_groupdata.online = true;
                            }
                            else {
                                post_groupdata.online = false;
                            }
                            (function (e) {
                                setImmediate(function () {
                                    pushIosMessageFork(e);
                                });
                            })(post_groupdata);
                        } else {
                            console.log("the group " + obj["entity"]["did"] + " doesnot exists.")
                        }
                        break;
                    case 9:
                        //add group members
                        addGroupMembersData.id = obj["entity"]["id"];
                        var arrMembers = obj["entity"]["list"];
                        for (var i = 0, l = arrMembers.length; i < l; i++) {
                            addGroupMembersData.members += "." + parseInt(arrMembers[i]["id"]);
                        }
                        for (var i = 0, l = arrMembers.length; i < l; i++) {
                            if (groups["Q" + obj["entity"]["id"]].indexOf(parseInt(arrMembers[i]["id"])) < 0) {
                                groups["Q" + obj["entity"]["id"]].push(parseInt(arrMembers[i]["id"]));
                                if (groups["Q" + obj["entity"]["id"]]) {
                                    var memberlist = groups["Q" + obj["entity"]["id"]];
                                    for (var i = 0, l = memberlist.length; i < l; i++) {
                                        if (accounts["U" + parseInt(memberlist[i])]) {
                                            var obj = JSON.parse(data);
                                            obj["time"] = getDate.getDate();
                                            accounts["U" + parseInt(memberlist[i])].write(JSON.stringify(obj) + '\r\n');
                                        }
                                    }
                                }
                                //if (accounts["U" + parseInt(arrMembers[i]["id"])]) {
                                //    var obj = JSON.parse(data);
                                //    obj["time"] = getDate.getDate();
                                //    accounts["U" + parseInt(arrMembers[i]["id"])].write(JSON.stringify(obj) + '\r\n');
                                //}
                            }
                        }
                        (function (e) {
                            setImmediate(function () {
                                addGroupMembersFork(e);
                            });
                        })(addGroupMembersData);
                        break;
                    case 10:
                        //get group detail from the base data or webservice
                        if (groups["Q" + obj["entity"]["id"]]) {
                            getGroupData.id = obj["entity"]["id"];
                            (function (e) {
                                setImmediate(function () {
                                    getGroupFork(e);
                                });
                            })(getGroupData);
                        } else {
                            //
                            getGroupData.id = obj["entity"]["id"];
                            (function (e) {
                                setImmediate(function () {
                                    getGroupFork(e);
                                });
                            })(getGroupData);
                        }
                        break;
                    default:
                        console.log("the paramater 'Code' isnot the default format,close this socket to keep safety.");
                        socket.end();
                        break;
                }
            }
            catch (e) {
                console.log('\r', e);
            }
        });
        socket.on('end', function () {
            console.log(socket.name + "'s socket is end.");
        });
        socket.on('error', function (e, data) {
            try {
                var obj = JSON.parse(data);
                if (accounts[obj["sid"]]) {
                    delete accounts[obj["sid"]];
                }
                console.log("very sorry, because of some unknow things occured on " + getDate.getDate() + " [" + e + "]");
            }
            catch (e) {
                console.log('\r', e);
            }
        });
    }).listen(9007);
    console.log("> The server has started ..." + getDate.getDate());
}
function getBaseData(server, basedata) {
    basedata();
}
function saveMessageFork(post_data) {
    (function (e) {
        try {
            var pss = child_process.fork("./saveMessage.js");
            pss.send(e);
            pss.on("message", function (msg) {
                //console.log(msg["result"])
                if (msg["result"] === 1)
                    pss.kill();
                else pss.kill();
            });
        } catch (e) {
            console.log('\r', e);
        }
    })(post_data);
}
function saveGroupMessageFork(saveGroupMessageData) {
    (function (e) {
        try {
            var pss = child_process.fork("./saveGroupMessage.js");
            pss.send(e);
            pss.on("message", function (msg) {
                //console.log(msg["result"])
                if (msg["result"] === 1)
                    pss.kill();
                else pss.kill();
            });
        } catch (e) {
            console.log('\r', e);
        }
    })(saveGroupMessageData);
}
function getUnreadMessage(get_data) {
    (function (e) {
        try {
            var pss = child_process.fork("./getUnreadMessage.js");
            pss.send(e);
            pss.on("message", function (msg) {
                var obj = JSON.parse(msg);
                if (obj["Entity"]) {
                    for (var i = 0, l = obj["Entity"].length; i < l; i++)
                        if (accounts["U" + parseInt(e["DestionationId"])]) {
                            console.log("weidu geren " + JSON.stringify(obj["Entity"][i]));
                            accounts["U" + parseInt(e["DestionationId"])].write(JSON.stringify(obj["Entity"][i]) + '\r\n');
                        }
                }
                pss.kill();
            });
        } catch (e) {
            console.log('\r', e);
        }
    })(get_data);
}
function getUnreadGroupMessage(get_groupdata) {
    (function (e) {
        try {
            var pss = child_process.fork("./getUnreadGroupMessage.js");
            pss.send(e);
            pss.on("message", function (msg) {
                var obj = JSON.parse(msg);
                if (obj["Entity"]) {
                    for (var i = 0, l = obj["Entity"].length; i < l; i++)
                        if (accounts["U" + parseInt(e["id"])]) {
                            console.log("weidu qun " + JSON.stringify(obj["Entity"][i]));
                            accounts["U" + parseInt(e["id"])].write(JSON.stringify(obj["Entity"][i]) + '\r\n');
                        }
                }
                pss.kill();
            });
        } catch (e) {
            console.log('\r', e);
        }
    })(get_groupdata);
}
function getGroupFork(getGroupData) {
    (function (e) {
        try {
            var pss = child_process.fork("./getGroup.js");
            pss.send(e);
            pss.on("message", function (msg) {
                if (msg["result"] !== 1)
                    pss.kill();
                else pss.kill();
            });
        } catch (e) {
            console.log('\r', e);
        }
    })(getGroupData);
}
function createGroupFork(createGroupData) {
    (function (e) {
        try {
            var pss = child_process.fork("./createGroup.js");
            pss.send(e);
            pss.on("message", function (msg) {
                if (msg["result"] !== 1)
                    pss.kill();
                else pss.kill();
            });
        } catch (e) {
            console.log('\r', e);
        }
    })(createGroupData);
}
function deleteGroupFork(deleteGroupData) {
    (function (e) {
        try {
            var pss = child_process.fork("./deleteGroup.js");
            pss.send(e);
            pss.on("message", function (msg) {
                if (msg["result"] !== 1)
                    pss.kill();
                else pss.kill();
            });
        } catch (e) {
            console.log('\r', e);
        }
    })(deleteGroupData);
}
function deleteGroupMembersFork(deleteGroupMembersData) {
    (function (e) {
        try {
            var pss = child_process.fork("./deleteGroupMembers.js");
            pss.send(e);
            pss.on("message", function (msg) {
                if (msg["result"] !== 1)
                    pss.kill();
                else pss.kill();
            });
        } catch (e) {
            console.log('\r', e);
        }
    })(deleteGroupMembersData);
}
function addGroupMembersFork(addGroupMembersData) {
    (function (e) {
        try {
            var pss = child_process.fork("./addGroupMembers.js");
            pss.send(e);
            pss.on("message", function (msg) {
                if (msg["result"] !== 1)
                    pss.kill();
                else pss.kill();
            });
        } catch (e) {
            console.log('\r', e);
        }
    })(addGroupMembersData);
}
function pushIosMessageFork(post_data) {
    (function (e) {
        try {
            var pss = child_process.fork("./iospush.js");
            pss.send(e);
            pss.on("message", function (msg) {
                //console.log(msg["result"])
                if (msg["result"] === 1) {
                    console.log("push");
                    pss.kill();
                } else pss.kill();
            });
        } catch (e) {
            console.log('\r', e);
        }
    })(post_data);
}
function closure(func, args) {
    function byfunc() {
        setImmediate(function () {
            func(args);
        });
    }

    return byfunc();
}
