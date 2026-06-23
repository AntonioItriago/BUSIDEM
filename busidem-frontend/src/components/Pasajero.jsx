import { useState, useEffect } from 'react';
import io from 'socket.io-client';

// Ajuste dinámico de la dirección de red para producción o desarrollo local
const API_URL = window.location.hostname === 'busidem.onrender.com' 
  ? '' 
  : `http://${window.location.hostname}:3001`;

// Inicializa Socket sin puerto si está en producción en Render
const socket = window.location.hostname === 'busidem.onrender.com' ? io() : io(API_URL);

function Pasajero({ cedulaInicial }) {
// ... Todo el resto de tu código de Pasajero.jsx se mantiene exactamente idéntico
  const [valorPasaje, setValorPasaje] = useState(0); // Nuevo estado para la tarifa

  const cargarTarifaVigente = async () => {
    try {
      const res = await fetch(`${API_URL}/api/config`);
      const data = await res.json();
      if (data.success) {
        setValorPasaje(parseFloat(data.config.valorPasaje));
      }
    } catch (err) {
      console.error("Error al obtener tarifa:", err);
    }
  };

  useEffect(() => {
    if (cedulaInicial) {
      cargarDatosPasajero(cedulaInicial);
      cargarTarifaVigente(); // <--- Llamamos a la actualización al iniciar
    }
  }, [cedulaInicial]);

  // ... resto del componente
  // Control de entorno y navegación interna del pasajero
  const [usuario, setUsuario] = useState(null);
  const [vistaActiva, setVistaActiva] = useState('menu'); // menu, c2p, pagar, opcion_pago
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState(''); // success, error

  // Estados originales para la ventana de Operación C2P
  const [bancoC2P, setBancoC2P] = useState('');
  const [telefonoC2P, setTelefonoC2P] = useState('');
  const [montoC2P, setMontoC2P] = useState('');
  const [tokenC2P, setTokenC2P] = useState('');

  // Estados para el flujo de Pago de Pasajes
  const [cantidadPasajes, setCantidadPasajes] = useState(1);

  // Al iniciar, cargamos los datos del pasajero usando la cédula recibida
  useEffect(() => {
    if (cedulaInicial) {
      cargarDatosPasajero(cedulaInicial);
    }
  }, [cedulaInicial]);

  // Escuchar actualizaciones en tiempo real cuando el backend emita un cambio global
  useEffect(() => {
    socket.on('actualizar_unidades', () => {
      if (cedulaInicial) {
        actualizarSaldoSilencioso(cedulaInicial.trim());
      }
    });

    return () => {
      socket.off('actualizar_unidades');
    };
  }, [cedulaInicial]);

  const cargarDatosPasajero = async (cedula) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/resumen`);
      const data = await res.json();
      if (data.success && data.pasajeros) {
        const pasajero = data.pasajeros.find(p => p.id.trim() === cedula.trim());
        if (pasajero) {
          setUsuario(pasajero);
        } else {
          setMensaje('Pasajero no encontrado en la base de datos local de la línea.');
          setTipoMensaje('error');
        }
      }
    } catch (err) {
      setMensaje('Error de conexión con el servidor de la Línea.');
      setTipoMensaje('error');
    }
  };

  const actualizarSaldoSilencioso = async (cedula) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/resumen`);
      const data = await res.json();
      if (data.success && data.pasajeros) {
        const pasajero = data.pasajeros.find(p => p.id.trim() === cedula);
        if (pasajero) setUsuario(pasajero);
      }
    } catch (err) {
      console.error('Error en sincronización silenciosa');
    }
  };

  const procesarPagoMovilC2P = async (e) => {
    e.preventDefault();
    if (!bancoC2P || !telefonoC2P || !montoC2P || !tokenC2P) {
      setMensaje('Todos los campos del protocolo de pago C2P son requeridos.');
      setTipoMensaje('error');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/admin/pasajeros/${usuario.id}/recarga`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monto: parseFloat(montoC2P) })
      });
      const data = await res.json();
      if (data.success) {
        setMensaje(`Recarga C2P aprobada por el banco. Se abonaron ${montoC2P} Bs a tu billetera virtual.`);
        setTipoMensaje('success');
        setBancoC2P('');
        setTelefonoC2P('');
        setMontoC2P('');
        setTokenC2P('');
        setVistaActiva('menu');
      }
    } catch (err) {
      setMensaje('La pasarela de pago local rechazó el token o no respondió.');
      setTipoMensaje('error');
    }
  };

  if (!usuario) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif', textAlign: 'center' }}>
        <h3>Validando Credencial Digital de Acceso...</h3>
        {mensaje && <p style={{ color: 'red' }}>{mensaje}</p>}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '450px', margin: '0 auto', padding: '15px', fontFamily: 'Segoe UI, Roboto, Helvetica, Arial, sans-serif', backgroundColor: '#f4f6f9', minHeight: '92vh', boxSizing: 'border-box' }}>
      
      {/* TARJETA DE IDENTIFICACIÓN VIRTUAL */}
      <div style={{ backgroundColor: '#4e73df', color: 'white', padding: '20px', borderRadius: '12px', marginBottom: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}>
        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Pase Digital de Pasajero</span>
        <h2 style={{ margin: '5px 0 2px 0', fontSize: '20px', fontWeight: 'bold' }}>{usuario.nombre}</h2>
        <p style={{ margin: 0, fontSize: '13px', opacity: 0.9 }}>C.I. {usuario.id}</p>
        
        <div style={{ marginTop: '15px', backgroundColor: 'rgba(255,255,255,0.15)', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px' }}>Saldo en Billetera:</span>
          <span style={{ fontSize: '22px', fontWeight: 'bold' }}>{usuario.saldo ? usuario.saldo.toFixed(2) : '0.00'} Bs.</span>
        </div>
      </div>

      {mensaje && (
        <div style={{ padding: '12px', backgroundColor: tipoMensaje === 'success' ? '#d4edda' : '#f8d7da', color: tipoMensaje === 'success' ? '#155724' : '#721c24', borderRadius: '6px', marginBottom: '15px', fontSize: '13px', fontWeight: 'bold' }}>
          {mensaje}
        </div>
      )}

      {/* MENÚ DE ACCIONES */}
      {vistaActiva === 'menu' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* CÓDIGO QR SIN BLOQUEO CLIENTE */}
          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 'bold', color: '#4e73df' }}>Presenta este QR para abordar el autobús:</p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`http://localhost:5173/?cedula=${usuario.id}`)}`} 
                alt="Mi QR de Pasaje"
                style={{ width: '180px', height: '180px', border: '1px solid #eaecf4', padding: '5px', borderRadius: '4px' }}
              />
            </div>
            <span style={{ display: 'block', fontSize: '11px', color: '#858796', marginTop: '5px' }}>Código Seguro Interoperable</span>
          </div>

          <button 
            onClick={() => { setVistaActiva('c2p'); setMensaje(''); }}
            style={{ width: '100%', padding: '14px', backgroundColor: '#1cc88a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
          >
            📲 Cargar Saldo vía Pago Móvil C2P
          </button>
        </div>
      )}

      {/* VISTA: INTERFAZ DE CONFIGURACIÓN C2P VENEZUELA */}
      {vistaActiva === 'c2p' && (
        <form onSubmit={procesarPagoMovilC2P} style={{ backgroundColor: 'white', padding: '18px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 5px 0', color: '#4e73df', fontSize: '16px' }}>Pasarela Transaccional C2P</h3>
          
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#495057' }}>
            Banco Emisor del Tarjetahabiente:
            <select 
              value={bancoC2P} 
              onChange={(e) => setBancoC2P(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '13px', boxSizing: 'border-box' }}
            >
              <option value="">-- Seleccione su Banco --</option>
              <option value="0102">Banco de Venezuela</option>
              <option value="0134">Banesco</option>
              <option value="0105">Mercantil</option>
              <option value="0108">Provincial</option>
              <option value="0172">Bancamiga</option>
            </select>
          </label>

          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#495057' }}>
            Teléfono Celular Afiliado (Pago Móvil):
            <input 
              type="tel" 
              placeholder="Ej: 04122525407" 
              value={telefonoC2P}
              onChange={(e) => setTelefonoC2P(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </label>

          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#495057' }}>
            Monto Neto a Recargar (Bs):
            <input 
              type="number" 
              step="0.01"
              placeholder="Monto en Bolívares" 
              value={montoC2P}
              onChange={(e) => setMontoC2P(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '13px', boxSizing: 'border-box', fontWeight: 'bold' }}
            />
          </label>

          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#495057' }}>
            Código Token Dinámico C2P:
            <input 
              type="text" 
              placeholder="Clave Temporal C2P" 
              value={tokenC2P}
              onChange={(e) => setTokenC2P(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '13px', boxSizing: 'border-box', textAlign: 'center', fontWeight: 'bold', letterSpacing: '2px' }}
            />
          </label>

          <button 
            type="submit"
            style={{ width: '100%', padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' }}
          >
            Confirmar Pago Móvil C2P ✔️
          </button>

          <button 
            type="button" 
            onClick={() => { setVistaActiva('menu'); setMensaje(''); setBancoC2P(''); }}
            style={{ width: '100%', padding: '9px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', fontSize: '13px', cursor: 'pointer' }}
          >
            Cancelar Regresar
          </button>
        </form>
      )}

    </div>
  );
}

export default Pasajero;