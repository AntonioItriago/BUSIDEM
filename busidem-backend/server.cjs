const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const uri = process.env.MONGODB_URI || "mongodb+srv://antoniojitriagoc_db_user:CUFqT1mFUovek8LO@cluster0.plsuj08.mongodb.net/busidem_db?retryWrites=true&w=majority";

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

// --- RUTA DE MIGRACIÓN (TEMPORAL) ---
app.get('/api/migrar', async (req, res) => {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db("busidem_db");
        const archivos = [
            { path: PATH_CHOFERES, col: 'choferes' },
            { path: PATH_UNIDADES, col: 'unidades' },
            { path: PATH_USUARIOS, col: 'usuarios' },
            { path: PATH_CONFIG, col: 'configLinea' },
            { path: PATH_DIRECTIVA, col: 'directiva' }
        ];
        
        for (const item of archivos) {
            if (fs.existsSync(item.path)) {
                const contenido = fs.readFileSync(item.path, 'utf8');
                if (contenido.trim()) {
                    const datos = JSON.parse(contenido);
                    const col = db.collection(item.col);
                    await col.deleteMany({});
                    await col.insertMany(Array.isArray(datos) ? datos : [datos]);
                }
            }
        }
        await client.close();
        res.send("¡Migración completada con éxito!");
    } catch (error) {
        await client.close();
        res.status(500).send("Error en migración: " + error.message);
    }
});

// --- FUNCIONES AUXILIARES Y RUTAS EXISTENTES ---
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

app.get('/api/config', (req, res) => {
  res.json({ success: true, config: leerArchivo(PATH_CONFIG, {}) });
});

app.post('/api/admin/config', (req, res) => {
  guardarArchivo(PATH_CONFIG, req.body);
  res.json({ success: true, message: "Guardado correctamente" });
});

app.get('/api/admin/resumen', (req, res) => {
  res.json({ success: true, pasajeros: leerArchivo(PATH_USUARIOS, []), choferes: leerArchivo(PATH_CHOFERES, []) });
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