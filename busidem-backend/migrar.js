const { MongoClient } = require('mongodb');
const fs = require('fs');

const uri = "mongodb+srv://antoniojitriagoc_db_user:CUFqT1mFUovek8LO@cluster0.plsuj08.mongodb.net/busidem_db?retryWrites=true&w=majority";
const client = new MongoClient(uri);

// Lista completa basada en tus archivos
const archivos = [
  { archivo: 'choferes.json', coleccion: 'choferes' },
  { archivo: 'configLinea.json', coleccion: 'configLinea' },
  { archivo: 'directiva.json', coleccion: 'directiva' },
  { archivo: 'unidades.json', coleccion: 'unidades' },
  { archivo: 'usuarios.json', coleccion: 'usuarios' }
];

async function migrarTodo() {
  try {
    await client.connect();
    console.log("Conectado a MongoDB Atlas...");
    const db = client.db("busidem_db");

    for (const item of archivos) {
      if (fs.existsSync(item.archivo)) {
        const contenido = fs.readFileSync(item.archivo, 'utf8');
        // Verificamos que el archivo no esté vacío
        if (contenido.trim() === "") {
          console.log(`⚠️ El archivo ${item.archivo} está vacío, saltando...`);
          continue;
        }
        
        const datos = JSON.parse(contenido);
        const col = db.collection(item.coleccion);
        
        // Limpiamos e insertamos
        await col.deleteMany({});
        await col.insertMany(Array.isArray(datos) ? datos : [datos]);
        console.log(`✅ ${item.archivo} subido a la colección '${item.coleccion}'`);
      } else {
        console.log(`⚠️ No se encontró el archivo: ${item.archivo}`);
      }
    }
  } catch (e) {
    console.error("Error en la migración:", e);
  } finally {
    await client.close();
    console.log("Proceso finalizado.");
  }
}

migrarTodo();