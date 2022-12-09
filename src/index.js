const express= require("express");
const http=require("http");
const path=require("path");
const socketio=require("socket.io");
const Filter=require("bad-words");
const {generateMessage,generateLocationMessage}=require("./utils/message");
const {addUser,removeUser,getUser,getUsersInRoom}= require('./utils/user');

const app= express();
const server=http.createServer(app);
const io=socketio(server);

const port=process.env.PORT || 3000;
const publicDirectoryPath=path.join(__dirname,'../public');

app.use(express.static(publicDirectoryPath));
app.use(express.json());

app.get('/',async(req,res)=>{
    res.render('index');
})

io.on('connection',(socket)=>{
    
    socket.on('join',(options,callback)=>{
        const{error,user}= addUser({id:socket.id,...options})
        if(error){
            return callback(error);
        }
        socket.join(user.room)
        socket.emit("message",generateMessage("Welcome!","Admin"))
        socket.broadcast.to(user.room).emit('message',generateMessage(`${user.username} has joined`,"Admin"));
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        })
        callback()
    })

    socket.on("message",(message,callback)=>{
        const filter= new Filter()
        if(filter.isProfane(message)){
            return callback("Profanity not allowed")
        }
        const user=getUser(socket.id)
        if(user){
            io.to(user.room).emit('message',generateMessage(message,user.username))
            callback()
        }
        
    })

    socket.on('send-location',(res,callback)=>{
        const url=`https://www.google.com/maps?q=${res.longitude},${res.latitude}`
        const user=getUser(socket.id)
        if(user){
            io.to(user.room).emit('locationMessage',generateLocationMessage(url,user.username))
            callback()
        }
        
    })
    socket.on('disconnect',()=>{
        const user= removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message',generateMessage(`${user.username} has left!`,"Admin"))
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getUsersInRoom(user.room)
            })
        }
        
    })
})








server.listen(port, ()=>{
    console.log(`server started at port ${port}`);
})