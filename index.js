const express = require("express");
const path = require("path");
const http = require("http");
const {Server} = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
  });

let arr = [];
let playingArray = [];

io.on("connection", (socket) => {

    //grasz klika "graj"

    socket.on("find", (e) => {

        if (!e.name) return;

      socket.playerName = e.name;
      socket.join(e.name);
        arr.push(e.name);

        if (arr.length >= 2){

            const p1obj = { p1name: arr[0], p1value: "X", p1move: "" };
            const p2obj = { p2name: arr[1], p2value: "O", p2move: "" };

            playingArray.push({ p1: p1obj, p2: p2obj, sum: 0});
            arr.splice(0, 2);

            io.emit("find", { allPlayers: playingArray });
        }
    });
    //ruch gracza

    socket.on("playing", (e) => {

        const game = playingArray.find(
            (obj) => obj.p1.p1name === e.name || obj.p2.p2name === e.name
        );
        if (!game) return;

        if (e.value === "X" && game.p1.p1name === e.name) {
            game.p1.p1move = e.id;
            game.sum++;
        }
        else if (e.value === "O" && game.p2.p2name === e.name) {
            game.p2.p2move = e.id;
            game.sum++;
        }

        io.emit("playing", {allPlayers:playingArray});

    });

    socket.on("chatMessage", ({name, text }) => {
        const game = playingArray.find(
            obj => obj.p1.p1name === name || obj.p2.p2name === name
        );
        if (!game) return;

        const payload = { from: name, text };

        io.to(game.p1.p1name).emit("chatMessage", payload);
        io.to(game.p2.p2name).emit("chatMessage", payload);
    });

    socket.on("gameOver", (e) => {
        playingArray = playingArray.filter(
            (obj) => obj.p1.p1name !== e.name && obj.p2.p2name !== e.name
        );

        arr = arr.filter((n) => n !== e.name);

        io.emit("find", { allPlayers: playingArray });
    });
    //gracz wychodzi bez "gameover"

    socket.on("disconnect", () => {
        const leaver = socket.playerName;
        if (!leaver) return;

        arr = arr.filter((n) => n !== leaver);
        playingArray = playingArray.filter(
            (obj) => obj.p1.p1name !== leaver && obj.p2.p2name !== leaver
          );
      
          io.emit("find", { allPlayers: playingArray });
        });
      });
      app.get("/", (req, res) => res.sendFile("index.html"));
      server.listen(3000, () => console.log("Server on :3000"));