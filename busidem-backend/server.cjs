const uri = "mongodb+srv://antoniojitriagoc_db_user:CUFqT1mFUovek8LO@cluster0.plsuj08.mongodb.net/busidem_db?retryWrites=true&w=majority";
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

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
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(valorDefecto, null, 2), 'utf8');
    return valorDefecto;
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return data ? JSON.parse(data) : valorDefecto;
  } catch (err) {
    return valorDefecto;
  }
};

const guardarArchivo = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};

// --- RUTAS DE CONFIGURACIÓN ---
app.get('/api/config', (req, res) => {
  const config = leerArchivo(PATH_CONFIG, { 
    nombre: 'Línea de Transporte BUSIDEM', 
    ruta: 'Ruta Troncal Central', 
    valorPasaje: '15.00' 
  });
  res.json({ success: true, config });
});

app.post('/api/admin/config', (req, res) => {
  guardarArchivo(PATH_CONFIG, req.body);
  res.json({ success: true, message: "Guardado correctamente" });
});

// --- RUTAS DE DATOS (RESUMEN, DIRECTIVA, UNIDADES) ---
app.get('/api/admin/resumen', (req, res) => {
  const pasajeros = leerArchivo(PATH_USUARIOS, []);
  const choferes = leerArchivo(PATH_CHOFERES, []);
  res.json({ success: true, pasajeros, choferes });
});

app.get('/api/admin/directiva', (req, res) => {
  const directiva = leerArchivo(PATH_DIRECTIVA, {});
  res.json({ success: true, directiva });
});

app.get('/api/admin/unidades', (req, res) => {
  const unidades = leerArchivo(PATH_UNIDADES, []);
  res.json({ success: true, unidades });
});

// Importa fs y Mongoose/MongoDB si no lo has hecho
const fs = require('fs');
const path = require('path');

app.get('/api/migrar', async (req, res) => {
    try {
        const archivos = ['choferes.json', 'unidades.json', 'usuarios.json', 'configLinea.json', 'directiva.json'];
        
        for (const nombreArchivo of archivos) {
            const ruta = path.join(__dirname, nombreArchivo);
            if (fs.existsSync(ruta)) {
                const datos = JSON.parse(fs.readFileSync(ruta, 'utf8'));
                const coleccion = nombreArchivo.replace('.json', '');
                await mongoose.connection.db.collection(coleccion).deleteMany({});
                await mongoose.connection.db.collection(coleccion).insertMany(datos);
            }
        }
        res.send("¡Migración completada con éxito!");
    } catch (error) {
        res.status(500).send("Error en migración: " + error.message);
    }
});

// Inicio del servidor
server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});