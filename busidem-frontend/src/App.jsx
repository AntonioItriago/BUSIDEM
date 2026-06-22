import { useState } from 'react';
import Pasajero from './components/Pasajero';
import Chofer from './components/Chofer';

function App() {
  const [cedula, setCedula] = useState('');
  const [ambiente, setAmbiente] = useState('inicio'); // inicio, pasajero, chofer
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const manejarAccesoAutomatico = async (e) => {
    e.preventDefault();
    if (!cedula.trim()) {
      setError('Por favor, ingrese su número de cédula.');
      return;
    }

    setError('');
    setCargando(true);

    try {
      // Consultamos al servidor local para verificar si está en la plantilla de choferes
      const response = await fetch('http://localhost:3001/api/admin/resumen');
      const data = await response.json();

      if (data.success) {
        // Buscamos si la cédula pertenece a un chofer registrado
        const esChofer = data.choferes.some(ch => ch.cedula === cedula.trim());

        if (esChofer) {
          setAmbiente('chofer');
        } else {
          // Si no es chofer, el sistema lo direcciona automáticamente al ambiente de pasajero
          setAmbiente('pasajero');
        }
      } else {
        // En caso de caída de la API, por seguridad por defecto habilitamos pasajero
        setAmbiente('pasajero');
      }
    } catch (err) {
      // Si el servidor está apagado temporalmente, permitimos pasar a pasajero para pruebas
      setAmbiente('pasajero');
    } finally {
      setCargando(false);
    }
  };

  const regresarAlInicio = () => {
    setAmbiente('inicio');
    setCedula('');
  };

  // PANTALLA DE INICIO UNIFICADA (DISEÑO CARNET AZUL)
  if (ambiente === 'inicio') {
    return (
      <div style={{ backgroundColor: '#212529', minHeight: '100vh', padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
        
        <div style={{ width: '100%', maxWidth: '350px', backgroundColor: '#0056b3', borderRadius: '15px', boxShadow: '0 8px 20px rgba(0,0,0,0.3)', padding: '4px', overflow: 'hidden' }}>
          
          {/* Franja superior estética del carnet */}
          <div style={{ backgroundColor: '#004085', padding: '15px 10px', textAlign: 'center', borderTopLeftRadius: '11px', borderTopRightRadius: '11px' }}>
            <h1 style={{ margin: 0, color: '#fff', fontSize: '22px', letterSpacing: '1px', fontWeight: 'bold' }}>BUSIDEM</h1>
            <p style={{ margin: '4px 0 0 0', color: '#82b1ff', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Sistema de Transporte Digital</p>
          </div>

          {/* Cuerpo interno blanco del carnet */}
          <div style={{ backgroundColor: '#ffffff', padding: '25px 20px', borderBottomLeftRadius: '11px', borderBottomRightRadius: '11px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            {/* Icono identificador del pase */}
            <div style={{ width: '70px', height: '70px', backgroundColor: '#e3f2fd', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '15px', border: '3px solid #0056b3' }}>
              <span style={{ fontSize: '35px' }}>🪪</span>
            </div>

            <h3 style={{ margin: '0 0 5px 0', color: '#333', fontSize: '16px' }}>Identificación de Usuario</h3>
            <p style={{ margin: '0 0 20px 0', color: '#6c757d', fontSize: '12px', textAlign: 'center' }}>Ingrese su documento para detectar su perfil</p>

            {error && (
              <div style={{ width: '100%', padding: '8px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px', fontSize: '12px', marginBottom: '12px', textAlign: 'center', boxSizing: 'border-box', fontWeight: 'bold' }}>
                {error}
              </div>
            )}

            <form onSubmit={manejarAccesoAutomatico} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  placeholder="Número de Cédula" 
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  disabled={cargando}
                  style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '6px', border: '2px solid #0056b3', boxSizing: 'border-box', textAlign: 'center', fontWeight: 'bold', letterSpacing: '1px', color: '#333' }} 
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

      </div>
    );
  }

  // AMBIENTES DETECTADOS AUTOMÁTICAMENTE
  return (
    <div style={{ backgroundColor: '#212529', minHeight: '100vh', padding: '10px' }}>
      
      {/* Botón flotante superior de retorno sólo visible en las vistas activas */}
      <div style={{ maxWidth: '360px', margin: '0 auto 10px auto', display: 'flex', justifyContent: 'flex-start' }}>
        <button 
          onClick={regresarAlInicio}
          style={{ padding: '6px 12px', backgroundColor: '#343a40', color: '#fff', border: '1px solid #495057', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
        >
          ⬅️ Cambiar Cédula / Salir
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {ambiente === 'pasajero' ? (
          <Pasajero cedulaInicial={cedula} />
        ) : (
          <Chofer cedulaInicial={cedula} />
        )}
      </div>

    </div>
  );
}

export default App;