const express = require('express')
const app = express();
const http = require('http')
const {Server} = require('socket.io')
const ACTIONS = require('./src/Actions')

const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 5000;

app.use(express.static('build'));

app.use((req, res, next)=>{
    res.sendFile(__dirname+'/build/index.html')
})

// Storing socket ID and username of that socket id (Binding socketid with username)

const userSocketMap = {};

// Getting all the socket ids present in particular roomId (passed as argument) 
// and returning all socket ids as array of objects

function getAllConnectedCients(roomId){

    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId)=>{

        return {

            socketId,
            username: userSocketMap[socketId]  // getting username by using socketid

        }

    });


}

// To do when each connection was established

io.on('connection', (socket)=>{

    // received the event from frontend

    socket.on(ACTIONS.JOIN, ({roomId, username})=>{
    
        userSocketMap[socket.id] = username;

        socket.join(roomId);  // if roomid already exists, it adds the socketid to the room.Otherwise, creates the room id and add the socketid to that room 

        const clients = getAllConnectedCients(roomId)  // Calling above declared function

        // looping through the array of objects received from the above function

        clients.forEach(({socketId})=>{ 

            // sending joined event to frontend of all the socketids present in the array

            io.to(socketId).emit(ACTIONS.JOINED, {

                clients, // list of all the users present int the room
                username, 
                socketId: socket.id

            })

        })

    })

    // this event was got from frontend as soon as the code changes
    // And we are sending the code to all the sockets present in particular room

    socket.on(ACTIONS.CODE_CHANGE, ({roomId, code}) => {

        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, {code})

    });

    // this event was got from frontend as soon as any new user joines
    // This is used for sending the code which is already written in the room to the new user just joined

    socket.on(ACTIONS.SYNC_CODE, ({code, socketId}) => {

        io.to(socketId).emit(ACTIONS.CODE_CHANGE, {code})

    });

    // This event triggers as soon as any user disconnects (close the browser / leave the room)

    socket.on('disconnecting', () => {

        // Getting all the rooms where the socketId was present
       
        const rooms = [...socket.rooms] 

         // Most cases, socketId will be present in one room only.We are looping through all the rooms just for (incase of same socketid has multiple rooms)

        rooms.forEach((roomId)=>{ 

            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {  // Emitting disconnect event to particular room where the socketId was present

                socketId: socket.id,
                username: userSocketMap[socket.id]

            })
            
        })

        delete userSocketMap[socket.id];   // deleting the socketId from our variable
        socket.leave();

    })

})









server.listen(PORT, ()=>{
    console.log(`Server started on port ${PORT}`);
})
