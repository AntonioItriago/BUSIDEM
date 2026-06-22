const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());

// --- DEFINICIÓN DE RUTAS DE ARCHIVOS ---
const PATH_CONFIG = path.join(__dirname, 'configLinea.json');
const PATH_CHOFERES = path.join(__dirname, 'choferes.json');
const PATH_USUARIOS = path.join(__dirname, 'usuarios.json');
const PATH_DIRECTIVA = path.join(__dirname, 'directiva.json');
const PATH_UNIDADES = path.join(__dirname, 'unidades.json');

// --- FUNCIONES AUXILIARES ---
const leerArchivo = (filePath, valorDefecto) => {
  if (!fs.existsSync(filePath)) return valorDefecto;
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return data ? JSON.parse(data) : valorDefecto;
  } catch (err) { return valorDefecto; }
};

const guardarArchivo = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};

app.get('/', (req, res) => {
  res.send('El servidor de BUSIDEM está funcionando correctamente.');
});

// --- RUTAS DE CONFIGURACIÓN Y DATOS ---
app.get('/api/config', (req, res) => {
  res.json({ success: true, config: leerArchivo(PATH_CONFIG, {}) });
});

app.post('/api/admin/config', (req, res) => {
  guardarArchivo(PATH_CONFIG, req.body);
  res.json({ success: true, message: "Guardado correctamente" });
});

app.get('/api/admin/resumen', (req, res) => {
  res.json({ 
    success: true, 
    pasajeros: leerArchivo(PATH_USUARIOS, []), 
    choferes: leerArchivo(PATH_CHOFERES, []) 
  });
});

app.get('/api/admin/directiva', (req, res) => {
  res.json({ success: true, directiva: leerArchivo(PATH_DIRECTIVA, {}) });
});

app.get('/api/admin/unidades', (req, res) => {
  res.json({ success: true, unidades: leerArchivo(PATH_UNIDADES, []) });
});

server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});