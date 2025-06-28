const express = require("express");
const fs = require('node:fs')
const app = express();

const server = require("http").createServer(app);
const io = require("socket.io")(server);
const port = 3000;

let clients = 0;

server.listen(port, "0.0.0.0", function () {
  console.log("Server is up!");
});


app.use("/", express.static("pages"));

// utills

function getRandom(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function replaceSync(filepath, replace, replaceWith) {
  var data = fs.readFileSync(filepath, 'utf-8');

  var newValue = data.replace(replace, replaceWith);

  fs.writeFileSync(filepath, newValue, 'utf-8');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

 function getOccurrence(array, value) {
  var count = 0;

  for (let i = 0; i < array.length; i++) if (array[i] === value) count++;

  return count;
}


io.on("connection", function (socket) {
  
  clients += 1
  console.log("clients connected: ", clients)
  
  
  
  socket.on("bugReport", function (data) {
    // check if @ is not where 
    if (getOccurrence(data, "@") > 2) return;

    let fileData = fs.readFileSync('bugs.txt', 'utf8').split("\n")
    let t = getOccurrence(fileData, data)
    
    console.log("new bug report: ", data, t);
    
    if(t > 0){
      console.log("can not have dupe reports!")
    }
    else{
      fs.appendFileSync('bugs.txt', data + "\n");
    }
    
    
    socket.broadcast.emit("bugReports", fileData);
    
  });
  
  // password check
  socket.on("enteredPassword", function (inputCode, code) {
    if(process.env.password == inputCode){
      socket.emit("passwordCorrect", code, arguments)
    }
    else{
      socket.emit("passwordIncorrect", code, arguments)
    }
    
  });
  
  
  // bug report stuff
  socket.on("getBugReports", function () {
    console.log("sending bug reports...")
    socket.emit("bugReports", fs.readFileSync('bugs.txt', 'utf8').split("\n"));
    
  });
  
  socket.on("bugReportStatusUpdate", function (r, index, passw) {
    
    if(passw != process.env.password) return;
    
    try{
    
      let fileData = fs.readFileSync('bugs.txt', 'utf8').split("\n")[index]

      console.log(fileData.split("@")[2])

      let newData = fileData.replace(fileData.split("@")[2], r);

      fileData = newData

      console.log(fileData)


      replaceSync("bugs.txt", fs.readFileSync('bugs.txt', 'utf8').split("\n")[index], fileData)
    }
    catch(e){
       console.log(e)
    }
    
  });
  
  socket.on("replaceDataLineFromReportBugFile", function (data, r, passw) {
    
    if(passw != process.env.password) return;
    
    try{
      console.log("Replacing... ", data)

      let fileData = fs.readFileSync('bugs.txt', 'utf8').split("\n")[data]

      console.log(fileData)

      replaceSync("bugs.txt", fileData, r)
    }
    catch(e) {
       console.log(e)
    }
  });
  
  socket.on("addDataFromReportBugFile", function (data, add, passw) {
    
    if(passw != process.env.password) return;
    
    try {
      console.log("Adding... ", data)

      let fileData = fs.readFileSync('bugs.txt', 'utf8').split("\n")[data]

      console.log(fileData)

      replaceSync("bugs.txt", fileData, fileData + add)
    } 
    catch (e) {
      console.log(e)
    }
  });
  
  
  // news repoorts
  
  socket.on("getNewsReports", function () {
    console.log("sending news reports...")
    socket.emit("newsReports", fs.readFileSync('news.txt', 'utf8').split("\n"));
    
  });
  
  // for sever down time
  socket.on("kickAll", function (passw) {
    if(passw != process.env.password) return;
    
    socket.broadcast.emit("kick");
  });
  
  socket.on("disconnect", function () {
    clients -= 1
    console.log("client disconntected, clients still connected", clients);
  });
});
