import { useState, useEffect } from 'react';
import io from 'socket.io-client';

// Ajuste dinámico de la dirección de red para producción o desarrollo local
const API_URL = window.location.hostname === 'busidem.onrender.com' 
  ? '' 
  : `http://${window.location.hostname}:3001`;

// Inicializa Socket sin puerto si está en producción en Render
const socket = window.location.hostname === 'busidem.onrender.com' ? io() : io(API_URL);

function Chofer({ cedulaInicial }) {
  // Control de navegación en pantalla móvil usando la cédula heredada
  const [choferLogueado, setChoferLogueado] = useState(null);
  const [unidadAsignada, setUnidadAsignada] = useState(null);
  const [vistaActiva, setVistaActiva] = useState('menu'); // menu, cobrar, billetera
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState(''); // success, error

  // Estados para el proceso de cobro
  const [idPasajero, setIdPasajero] = useState('');
  const [cantidadPasajes, setCantidadPasajes] = useState(1);
  const [pasajeCosto, setPasajeCosto] = useState(0);

  // Escuchar cuando la administración o transacciones actualicen datos
  useEffect(() => {
    if (choferLogueado) {
      socket.on('actualizar_unidades', () => {
        actualizarDatosChofer(choferLogueado.cedula);
      });
    }
    return () => {
      socket.off('actualizar_unidades');
    };
  }, [choferLogueado]);

  // 1. Carga inicial de datos al encender el módulo
  useEffect(() => {
    obtenerCostoPasaje();
    if (cedulaInicial) {
      verificarYLoguearChofer(cedulaInicial);
    }
  }, [cedulaInicial]);

  const obtenerCostoPasaje = async () => {
    try {
      const res = await fetch(`${API_URL}/api/config`);
      const data = await res.json();
      if (data.success && data.config) {
        setPasajeCosto(parseFloat(data.config.valorPasaje || 0));
      }
    } catch (err) {
      console.error('Error obteniendo tarifa');
    }
  };

  const verificarYLoguearChofer = async (cedula) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/resumen`);
      const data = await res.json();
      if (data.success && data.choferes) {
        const chofer = data.choferes.find(ch => ch.cedula.trim() === cedula.trim());
        if (chofer) {
          setChoferLogueado(chofer);
          buscarUnidadAsignada(chofer.cedula, data.unidades || []);
        } else {
          setMensaje('Su número de cédula no figura en la plantilla oficial de la línea.');
          setTipoMensaje('error');
        }
      }
    } catch (err) {
      setMensaje('Error de red. No se pudo validar credenciales.');
      setTipoMensaje('error');
    }
  };

  const actualizarDatosChofer = async (cedula) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/resumen`);
      const data = await res.json();
      if (data.success && data.choferes) {
        const chofer = data.choferes.find(ch => ch.cedula.trim() === cedula.trim());
        if (chofer) {
          setChoferLogueado(chofer);
          buscarUnidadAsignada(chofer.cedula, data.unidades || []);
        }
      }
    } catch (err) {
      console.error('Error sincronizando chofer');
    }
  };

  const buscarUnidadAsignada = (cedulaChofer, listaUnidades) => {
    // Corrección para validar si el texto de asignación de la central incluye la cédula del chofer
    const unidad = listaUnidades.find(u => u.choferAsignado && u.choferAsignado.includes(cedulaChofer.trim()));
    if (unidad) {
      setUnidadAsignada(unidad);
    } else {
      setUnidadAsignada(null);
    }
  };

  const procesarCobroDigital = async (e) => {
    e.preventDefault();
    setMensaje('');
    if (!idPasajero) {
      setMensaje('Debe ingresar la cédula o escanear el QR del pasajero.');
      setTipoMensaje('error');
      return;
    }
    if (!unidadAsignada) {
      setMensaje('No puedes cobrar pasajes si no tienes un autobús asignado en el Panel.');
      setTipoMensaje('error');
      return;
    }

    const totalDebitar = pasajeCosto * cantidadPasajes;

    try {
      const res = await fetch(`${API_URL}/api/chofer/cobrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idPasajero: idPasajero.trim(),
          cedulaChofer: choferLogueado.cedula,
          unidadId: unidadAsignada.id,
          monto: totalDebitar
        })
      });

      const data = await res.json();
      if (data.success) {
        setMensaje(`¡Cobro Exitoso! Se debitaron ${totalDebitar.toFixed(2)} Bs por ${cantidadPasajes} pasaje(s).`);
        setTipoMensaje('success');
        setIdPasajero('');
        setCantidadPasajes(1);
        actualizarDatosChofer(choferLogueado.cedula);
      } else {
        setMensaje(`Rechazado: ${data.message}`);
        setTipoMensaje('error');
      }
    } catch (err) {
      setMensaje('Error de comunicación con la central de cobros.');
      setTipoMensaje('error');
    }
  };

  if (!choferLogueado) {
    return (
      <div style={{ padding: '30px', fontFamily: 'sans-serif', textAlign: 'center' }}>
        <h3>Validando Credencial del Operador...</h3>
        {mensaje && <p style={{ color: 'red', fontWeight: 'bold' }}>{mensaje}</p>}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '450px', margin: '0 auto', padding: '15px', fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f8f9fa', minHeight: '92vh', boxSizing: 'border-box' }}>
      
      {/* ENCABEZADO DEL CHOFER */}
      <div style={{ backgroundColor: '#2e59d9', color: 'white', padding: '15px', borderRadius: '10px', marginBottom: '15px' }}>
        <span style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.8 }}>Conductor Autorizado</span>
        <h2 style={{ margin: '2px 0', fontSize: '18px' }}>{choferLogueado.nombre}</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '13px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '8px' }}>
          <span>C.I: {choferLogueado.cedula}</span>
          <strong>Autobús Nro: {unidadAsignada ? unidadAsignada.id : '⚠️ NINGUNO'}</strong>
        </div>
      </div>

      {mensaje && (
        <div style={{ padding: '12px', backgroundColor: tipoMensaje === 'success' ? '#d4edda' : '#f8d7da', color: tipoMensaje === 'success' ? '#155724' : '#721c24', borderRadius: '6px', marginBottom: '15px', fontSize: '13px', fontWeight: 'bold' }}>
          {mensaje}
        </div>
      )}

      {/* VISTAS MÓVILES */}
      {vistaActiva === 'menu' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button onClick={() => setVistaActiva('cobrar')} style={{ width: '100%', padding: '20px', backgroundColor: '#1cc88a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
            📥 Registrar Cobro de Pasaje
          </button>
          <button onClick={() => setVistaActiva('billetera')} style={{ width: '100%', padding: '20px', backgroundColor: '#36b9cc', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
            💰 Mi Billetera (Ingresos Virtuales)
          </button>
        </div>
      )}

      {vistaActiva === 'cobrar' && (
        <form onSubmit={procesarCobroDigital} style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e3e6f0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3 style={{ margin: 0, color: '#2e59d9', fontSize: '16px' }}>Punto de Cobro Virtual</h3>
          
          <div style={{ padding: '8px', backgroundColor: '#e2e3e5', borderRadius: '4px', fontSize: '12px', textAlign: 'center' }}>
            Tarifa por Pasaje: <strong>{pasajeCosto.toFixed(2)} Bs.</strong>
          </div>

          <label style={{ fontSize: '13px', fontWeight: 'bold' }}>
            Cédula del Pasajero (ID):
            <input 
              type="text" 
              placeholder="Ingrese o Escanee C.I." 
              value={idPasajero}
              onChange={(e) => setIdPasajero(e.target.value)}
              style={{ width: '100%', padding: '10px', marginTop: '5px', boxSizing: 'border-box', fontSize: '15px' }}
            />
          </label>

          <label style={{ fontSize: '13px', fontWeight: 'bold' }}>
            Cantidad de Pasajes a Cobrar:
            <select 
              value={cantidadPasajes} 
              onChange={(e) => setCantidadPasajes(parseInt(e.target.value))}
              style={{ width: '100%', padding: '10px', marginTop: '5px', fontSize: '15px' }}
            >
              <option value="1">1 Pasaje ({pasajeCosto.toFixed(2)} Bs.)</option>
              <option value="2">2 Pasajes ({(pasajeCosto * 2).toFixed(2)} Bs.)</option>
              <option value="3">3 Pasajes ({(pasajeCosto * 3).toFixed(2)} Bs.)</option>
              <option value="4">4 Pasajes ({(pasajeCosto * 4).toFixed(2)} Bs.)</option>
            </select>
          </label>

          <div style={{ marginTop: '10px', padding: '12px', backgroundColor: '#f8f9fc', borderRadius: '5px', textAlign: 'right', fontSize: '15px' }}>
            Total a Debitar: <strong style={{ color: '#e74a3b', fontSize: '18px' }}>{(pasajeCosto * cantidadPasajes).toFixed(2)} Bs.</strong>
          </div>

          <button type="submit" style={{ padding: '12px', backgroundColor: '#1cc88a', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>
            ⚡ Procesar Débito Seguro
          </button>

          <button type="button" onClick={() => { setVistaActiva('menu'); setMensaje(''); }} style={{ padding: '10px', backgroundColor: '#858796', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Volver Al Menú
          </button>
        </form>
      )}

      {vistaActiva === 'billetera' && (
        <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e3e6f0' }}>
          <h3 style={{ margin: 0, color: '#36b9cc', fontSize: '16px' }}>Mi Balance Operativo</h3>
          
          <div style={{ margin: '20px 0', padding: '20px', backgroundColor: '#f8f9fc', borderRadius: '8px', textAlign: 'center', borderLeft: '5px solid #28a745' }}>
            <span style={{ fontSize: '12px', color: '#6c757d', textTransform: 'uppercase' }}>Fondo Acumulado en Ruta</span>
            <h2 style={{ margin: '5px 0 0 0', color: '#28a745', fontSize: '32px' }}>
              {choferLogueado.saldo ? choferLogueado.saldo.toFixed(2) : '0.00'} Bs.
            </h2>
          </div>

          <div style={{ fontSize: '12px', color: '#495057', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '6px', border: '1px solid #e9ecef' }}>
            <p style={{ margin: 0 }}><strong>Banco Receptor:</strong> {choferLogueado.bancoNombre}</p>
            <p style={{ margin: 0 }}><strong>Nro. Cuenta:</strong> <span style={{ fontFamily: 'monospace' }}>{choferLogueado.bancoNumero}</span></p>
            <p style={{ margin: 0 }}><strong>Teléfono:</strong> {choferLogueado.telefono}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
            <p style={{ margin: 0, fontSize: '11px', color: '#6c757d', textAlign: 'center', fontStyle: 'italic' }}>
              Para transferir a su banco, solicite el vaciado al administrador en taquilla.
            </p>
            <button type="button" onClick={() => setVistaActiva('menu')} style={{ width: '100%', padding: '10px', backgroundColor: '#858796', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Regresar al Menú
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default Chofer;