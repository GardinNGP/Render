const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// A PORTA DA FRENTE (Para o robô bater e manter o servidor acordado)
app.get('/', (req, res) => {
    res.send('Servidor do SMA está acordado e operante!');
});

const io = new Server(server, {
    cors: { origin: "*" } 
});

// Quando um motorista abre o app do Rádio
io.on('connection', (socket) => {
    console.log('Um motorista conectou:', socket.id);

    // Quando ele escolhe uma frequência (ex: Canal 1)
    socket.on('join-channel', (channelId) => {
        socket.join(channelId);
        console.log(`Motorista ${socket.id} entrou no QRA: ${channelId}`);
        socket.to(channelId).emit('user-joined', socket.id);
    });

    // Repassa a "Oferta" de conexão WebRTC
    socket.on('offer', (payload) => {
        io.to(payload.target).emit('offer', payload);
    });

    // Repassa a "Resposta" de conexão WebRTC
    socket.on('answer', (payload) => {
        io.to(payload.target).emit('answer', payload);
    });

    // Repassa os pacotes de rede (ICE Candidates)
    socket.on('ice-candidate', (payload) => {
        io.to(payload.target).emit('ice-candidate', payload);
    });

    // Quando o cara sai do rádio ou o app fecha
    socket.on('disconnect', () => {
        console.log('Motorista desconectou:', socket.id);
    });

    // Quando alguém APERTA o botão PTT
    socket.on('ptt-start', (payload) => {
        // Envia o nome de quem falou para todos da sala (menos pra ele mesmo)
        socket.to(payload.channelId).emit('ptt-start', payload.userName);
    });

    // Quando alguém SOLTA o botão PTT
    socket.on('ptt-stop', (channelId) => {
        // Avisa a sala que o rádio ficou mudo
        socket.to(channelId).emit('ptt-stop');
    });
});

// A porta que o Render vai usar
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor de Rádio SMA rodando na porta ${PORT}`);
});
