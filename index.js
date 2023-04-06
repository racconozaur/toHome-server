const express = require('express')
const mongoose = require('mongoose')
const config = require('config')
const http = require('http');
const authRouter = require('./routes/auth.routes')
const corsModdleware = require('./middleware/cors.middleware')
const filePathMiddleware = require('./middleware/filePath.middleware')


const app = express()
const PORT = process.env.PORT || config.get('serverPort')

const path = require('path')

const socketIo = require('socket.io')
const server = http.createServer(app)
const io = socketIo(server, {
    cors: {
        origin: [`http://localhost:3000`]
    }
})
// const io = require('socket.io')(`http://localhost:${PORT}`)

app.use(corsModdleware)

app.use(express.json())
app.use('/api/auth', authRouter)

io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);
  
    socket.on("join_room", (data) => {
      socket.join(data);
    });
  
    socket.on("send_message", (data) => {
        console.log(data);
        socket.to(data.room).emit("receive_message", data);
    //   socket.to(data.room).emit("receive_message", data);
    });
  });

const start = async () => {
    try {
        mongoose.connect(config.get('bdUrl'), {
                useNewUrlParser:true,
                useUnifiedTopology:true
            })

        // dbJasa123qwe
        //dbByJasa123


        server.listen(PORT, () => {
            console.log('Server is running on port', PORT);
            console.log(`http://localhost:${PORT}`);
        })
    } catch (error) {
        
    }
}

start()