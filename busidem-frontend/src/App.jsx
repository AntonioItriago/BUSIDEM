import { useState, useEffect } from 'react';
import Pasajero from './components/Pasajero';
import Chofer from './components/Chofer';
import Admin from './Admin'; // Importamos tu módulo de administración

function App() {
  const [cedula, setCedula] = useState('');
  // Validamos inicialmente si es un dispositivo móvil
  const [ambiente, setAmbiente] = useState('inicio'); // inicio, pasajero, chofer, admin
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // Efecto para detectar si NO es móvil al cargar la app y mandar directo al Admin
  useEffect(() => {
    const esMovil = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!esMovil) {
      setAmbiente('admin');
    }
  }, []);

  const manejarAccesoAutomatico = async (e) => {
    e.preventDefault();
    if (!cedula.trim()) {
      setError('Por favor, ingrese su número de cédula.');
      return;
    }

    setError('');
    setCargando(true);

    try {
      // Usamos ruta relativa para que funcione correctamente en producción dentro de Render
      const response = await fetch('/api/admin/resumen');
      const data = await response.json();

      if (data.success) {
        // Corrección mínima: Verificar en las listas del servidor para levantar el ambiente correcto
        const esChofer = data.choferes && data.choferes.some(ch => ch.cedula === cedula.trim());
        const esPasajero = data.pasajeros && data.pasajeros.some(p => p.id === cedula.trim());

        if (esChofer) {
          setAmbiente('chofer');
        } else if (esPasajero) {
          setAmbiente('pasajero');
        // Dentro de manejarAccesoAutomatico, en el bloque donde esPasajero es false:
} else {
  // En lugar de solo mostrar el error, habilitamos un estado de "registro"
  const confirmarRegistro = window.confirm("Cédula no encontrada. ¿Desea realizar el autoregistro como Pasajero Normal y obtener 2 pasajes de bienvenida?");
  
  if (confirmarRegistro) {
    const nombre = prompt("Ingrese su nombre y apellido:");
    if (nombre) {
      const response = await fetch('/api/pasajero/autoregistro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cedula.trim(), nombre, telefono: 'Sin teléfono' })
      });
      const data = await response.json();
      if (data.success) {
        alert(data.message);
        setAmbiente('pasajero'); // Entra directo al sistema
      } else {
        setError(data.error);
      }
    }
  } else {
    setError('Número de cédula no registrado en el sistema BUSIDEM.');
  }
}
      } else {
        setError('Error al conectar con la base de datos de control.');
      }
    } catch (err) {
      setError('No se pudo establecer comunicación con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  const regresarAlInicio = () => {
    setCedula('');
    setAmbiente('inicio');
    setError('');
  };

  // AMBIENTE ADMINISTRATIVO (ESCRITORIO / LOCALHOST)
  if (ambiente === 'admin') {
    return <Admin />;
  }

  // PANTALLA DE INICIO DE SESIÓN MÓVIL UNIFICADO
  if (ambiente === 'inicio') {
    return (
      <div style={{ backgroundColor: '#1a1e21', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'Segoe UI, sans-serif', padding: '15px', boxSizing: 'border-box' }}>
        
        <div style={{ width: '100%', maxWidth: '360px', backgroundColor: '#2b3035', padding: '30px 20px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', border: '1px solid #3d4349' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            <span style={{ fontSize: '50px' }}>🚍</span>
            <h1 style={{ margin: '10px 0 5px 0', color: '#fff', fontSize: '22px', fontWeight: 'bold', letterSpacing: '0.5px' }}>BUSIDEM MÓVIL</h1>
            <p style={{ margin: 0, color: '#9fa6b2', fontSize: '13px' }}>Billetera Digital y Control de Pasajes</p>
          </div>

          {error && (
            <div style={{ padding: '10px', backgroundColor: '#842029', color: '#f8d7da', border: '1px solid #f5c2c7', borderRadius: '6px', fontSize: '13px', marginBottom: '15px', textAlign: 'center', fontWeight: '500' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={manejarAccesoAutomatico} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', color: '#dee2e6', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', textTransform: 'uppercase' }}>
                Documento de Identidad (Cédula):
              </label>
              <input 
                type="text" 
                placeholder="Ej: V-12345678" 
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                disabled={cargando}
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #495057', backgroundColor: '#343a40', color: '#fff', fontSize: '15px', boxSizing: 'border-box', outline: 'none', textAlign: 'center', fontWeight: 'bold', letterSpacing: '1px' }}
              />
            </div>

            <button 
              type="submit"
              disabled={cargando}
              style={{ width: '100%', padding: '12px', backgroundColor: '#0056b3', color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s', marginTop: '5px' }}
            >
              {cargando ? 'Verificando...' : 'Ingresar al Sistema 🚀'}
            </button>
          </form>

          <div style={{ marginTop: '20px', fontSize: '10px', color: '#adb5bd', textAlign: 'center' }}>
            V-2026 BUSIDEM MÓVIL
          </div>
        </div>

      </div>
    );
  }

  // AMBIENTES DETECTADOS AUTOMÁTICAMENTE (PASAJERO / CHOFER)
  return (
    <div style={{ backgroundColor: '#212529', minHeight: '100vh', padding: '10px' }}>
      
      <div style={{ maxWidth: '360px', margin: '0 auto 10px auto', display: 'flex', justifyContent: 'flex-start' }}>
        <button 
          onClick={regresarAlInicio}
          style={{ padding: '6px 12px', backgroundColor: '#343a40', color: '#fff', border: '1px solid #495057', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
        >
          ⬅️ Salir / Volver
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {ambiente === 'pasajero' && <Pasajero cedulaInicial={cedula} />}
        {ambiente === 'chofer' && <Chofer cedulaInicial={cedula} />}
      </div>

    </div>
  );
}

export default App;