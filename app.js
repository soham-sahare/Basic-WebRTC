const express = require('express')
const app = express()
let http = require('http').Server(app)
const port = process.env.PORT || 3000
let io = require('socket.io')(http)

app.use(express.static('public'))

http.listen(port, () => {
  console.log("Listening on Port :",port)
  console.log("http://localhost:"+port)
})

io.on('connection', socket => {
    socket.on('create or join', room => {
        const myRoom = io.sockets.adapter.rooms[room] || { length: 0 }
        const numClients = myRoom.length

        if(numClients === 0){
            socket.join(room)
            socket.emit('created', room)
        } 
        else{
            socket.join(room)
            socket.emit('joined', room)
        }
    })

    socket.on('ready', room => {
        socket.broadcast.to(room).emit('ready')
    })

    socket.on('candidate', event => {
        socket.broadcast.to(event.room).emit('candidate', event)
    })

    socket.on('offer', event => {
        socket.broadcast.to(event.room).emit('offer', event.sdp)
    })

    socket.on('answer', event => {
        socket.broadcast.to(event.room).emit('answer', event.sdp)
    })
})