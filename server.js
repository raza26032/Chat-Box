var PORT = process.env.PORT || 3000;
var express = require("express");
var app = express();
const http = require("http").createServer(app);

var moment = require("moment");

var clientInfo = {};

var io = require("socket.io")(http);

app.use(express.static(__dirname + '/'));

function sendCurrentUsers(socket) {
    var info = clientInfo[socket.id];
    var users = [];
    if (typeof info === 'undefined') {
        return;
    }
    Object.keys(clientInfo).forEach(function (socketId) {
        var userinfo = clientInfo[socketId];
        if (info.room == userinfo.room) {
            users.push(userinfo.name);
        }

    });

    socket.emit("message", {
        name: "System",
        text: "Current Users : " + users.join(', '),
        timestamp: moment().valueOf()
    });

}

io.on("connection", function (socket) {
    console.log("User is connected");

    socket.on("disconnect", function () {
        var userdata = clientInfo[socket.id];
        if (typeof (userdata !== undefined)) {
            socket.leave(userdata.room);
            socket.broadcast.to(userdata.room).emit("message", {
                text: userdata.name + " has left",
                name: "System",
                timestamp: moment().valueOf()
            });

            delete clientInfo[socket.id];

        }
    });

    socket.on('joinRoom', function (req) {
        clientInfo[socket.id] = req;
        socket.join(req.room);
        socket.broadcast.to(req.room).emit("message", {
            name: "System",
            text: req.name + ' has joined',
            timestamp: moment().valueOf()
        });

    });

    socket.on('typing', function (message) {
        socket.broadcast.to(clientInfo[socket.id].room).emit("typing", message);
    });

    socket.on("userSeen", function (msg) {
        socket.broadcast.to(clientInfo[socket.id].room).emit("userSeen", msg);

    });

    socket.emit("message", {
        text: "Welcome to Chat Box !",
        timestamp: moment().valueOf(),
        name: "System"
    });

    socket.on("message", function (message) {
        console.log("Message Received : " + message.text);
        if (message.text === "@currentUsers") {
            sendCurrentUsers(socket);
        } else {
            message.timestamp = moment().valueOf();
            socket.broadcast.to(clientInfo[socket.id].room).emit("message", message);
        }

    });
});

http.listen(PORT, function () {
    console.log("server started");
});