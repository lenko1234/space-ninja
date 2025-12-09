const express = require('express');
const https = require('https');
const http = require('http');
const socketIo = require('socket.io');
const os = require('os');
const fs = require('fs');
const path = require('path');

const app = express();

// Intentar cargar certificados SSL
let server;
let protocol = 'http';
const PORT = 3000;

try {
    const keyPath = path.join(__dirname, 'server.key');
    const certPath = path.join(__dirname, 'server.cert');

    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
        const options = {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath)
        };
        server = https.createServer(options, app);
        protocol = 'https';
        console.log('🔒 Servidor HTTPS habilitado');
    } else {
        server = http.createServer(app);
        console.log('⚠️  Usando HTTP (certificados no encontrados)');
    }
} catch (error) {
    server = http.createServer(app);
    console.log('⚠️  Error al cargar certificados, usando HTTP');
}

const io = socketIo(server);

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static('public'));

// Obtener la dirección IP local
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Buscar IPv4 que no sea localhost
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const localIP = getLocalIP();

// Manejo de conexiones Socket.io
io.on('connection', (socket) => {
    console.log('✅ Nuevo cliente conectado:', socket.id);

    // Escuchar datos del controlador (celular)
    socket.on('hand-data', (data) => {
        // Reenviar la posición de la mano a todos los clientes (proyector)
        io.emit('hand-data', data);
    });

    socket.on('disconnect', () => {
        console.log('❌ Cliente desconectado:', socket.id);
    });
});

// Iniciar servidor
server.listen(PORT, () => {
    console.log('\n🚀 ========================================');
    console.log('   SERVIDOR INICIADO CORRECTAMENTE');
    console.log('========================================');
    console.log(`\n📺 PROYECTOR (Pantalla del juego):`);
    console.log(`   👉 ${protocol}://${localIP}:${PORT}/game.html`);
    console.log(`\n📱 CELULAR (Control de mano):`);
    console.log(`   👉 ${protocol}://${localIP}:${PORT}/controller.html`);
    console.log('\n💡 Asegúrate de que ambos dispositivos estén en la misma red WiFi');
    if (protocol === 'https') {
        console.log('⚠️  IMPORTANTE: Acepta el certificado autofirmado en tu navegador');
    }
    console.log('========================================\n');
});
