import { useState, useEffect } from 'react';

// Si está en producción (Render), usa rutas relativas; si estás en local, usa el puerto 3001
const API_URL = window.location.hostname === 'busidem.onrender.com' 
  ? '' 
  : `http://${window.location.hostname}:3001`;


function Admin() {
  const [pestanaActiva, setPestanaActiva] = useState('buses');
  const [error, setError] = useState('');
  const [qrAppPasajero, setQrAppPasajero] = useState(null);

const cargarConfiguracion = async () => {
  try {
    const res = await fetch(`${API_URL}/api/config`);
    const data = await res.json();
    if (data.success && data.config) {
      setConfigLinea(data.config);
    }
  } catch (err) {
    console.error("Error al cargar configuración");
  }
};

  // 1. ESTADOS - CONFIGURACIÓN DE LA LÍNEA
  const [configLinea, setConfigLinea] = useState({
    nombre: 'Línea de Transporte BUSIDEM',
    ruta: 'Ruta Troncal Central',
    valorPasaje: '15.00'
  });

  const [directiva, setDirectiva] = useState({
    presidente: { cargo: 'Presidente', cedula: '' },
    vicepresidente: { cargo: 'Vicepresidente', cedula: '' },
    secretario: { cargo: 'Secretario', cedula: '' },
    tesorero: { cargo: 'Tesorero', cedula: '' },
    vocal: { cargo: 'Vocal', cedula: '' }
  });

  // 2. ESTADOS - LOS BUSES
  const [unidades, setUnidades] = useState([]);
  const [nuevaUnidad, setNuevaUnidad] = useState({
    id: '',
    marca: '',
    modelo: '',
    placa: '',
    duenoNombre: '',
    duenoCedula: '',
    duenoTelefono: ''
  });
  const [choferesSeleccionados, setChoferesSeleccionados] = useState({});

  // 3. ESTADOS - PASAJEROS FRECUENTES
  const [pasajeros, setPasajeros] = useState([]);
  const [nuevoPasajero, setNuevoPasajero] = useState({ id: '', nombre: '', telefono: '' });
  const [montoRecarga, setMontoRecarga] = useState({});
  
// 4. ESTADOS - PLANTILLA DE PERSONAL OPERATIVO (ANTES CHOFERES)
const [choferes, setChoferes] = useState([]);
const [nuevoChofer, setNuevoChofer] = useState({
  cedula: '',
  nombre: '',
  telefono: '',
  bancoNombre: '',
  bancoNumero: '',
  rol: 'Chófer' // Nuevo campo para el rol
});

  // CARGA DE DATOS INICIAL AL MONTAR EL COMPONENTE
  useEffect(() => {
    cargarUnidades();
    cargarResumenGeneral();
    cargarMiembrosDirectiva();
    cargarConfiguracion();
  }, []);

  const cargarMiembrosDirectiva = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/directiva`);
      const data = await res.json();
      if (data.success && data.directiva) {
        setDirectiva(data.directiva);
      }
    } catch (err) {
      console.error("Error al cargar directiva");
    }
  };

  const guardarMiembrosDirectiva = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/directiva`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(directiva)
      });
      const data = await res.json();
      if (data.success) {
        alert("Miembros de la directiva vial updated correctamente.");
      }
    } catch (err) {
      alert("Error al guardar directiva.");
    }
  };

  const cargarUnidades = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/unidades`);
      const data = await res.json();
      if (data.success) {
        setUnidades(data.unidades);
        const asignacionesIniciales = {};
        data.unidades.forEach(u => {
          asignacionesIniciales[u.id] = u.choferAsignado || '';
        });
        setChoferesSeleccionados(asignacionesIniciales);
      }
    } catch (err) {
      setError('No se pudo conectar con el servidor local.');
    }
  };

  const cargarResumenGeneral = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/resumen`);
      const data = await res.json();
      if (data.success) {
        setPasajeros(data.pasajeros || []);
        setChoferes(data.choferes || []);
      }
    } catch (err) {
      console.error('Error cargando pasajeros y choferes');
    }
  };

  const registrarUnidad = async (e) => {
    e.preventDefault();
    if (!nuevaUnidad.id || !nuevaUnidad.placa || !nuevaUnidad.duenoCedula) {
      alert('Por favor complete los campos obligatorios del Bus (Número, Placa y Cédula Dueño)');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/admin/unidades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaUnidad)
      });
      const data = await res.json();
      if (data.success) {
        setNuevaUnidad({ id: '', marca: '', modelo: '', placa: '', duenoNombre: '', duenoCedula: '', duenoTelefono: '' });
        cargarUnidades();
      }
    } catch (err) {
      alert('Error al registrar unidad');
    }
  };

  const eliminarUnidad = async (id) => {
    if (!confirm(`¿Está seguro de eliminar el Bus Nro. ${id}?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/unidades/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) cargarUnidades();
    } catch (err) {
      alert('Error al eliminar unidad');
    }
  };

  const asignarChoferAUnidad = async (unidadId, choferCedula) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/unidades/asignar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unidadId, choferCedula })
      });
      const data = await res.json();
      if (data.success) {
        setChoferesSeleccionados(prev => ({ ...prev, [unidadId]: choferCedula }));
        cargarUnidades();
      }
    } catch (err) {
      alert('Error al asignar chofer');
    }
  };

  const registrarPasajero = async (e) => {
    e.preventDefault();
    if (!nuevoPasajero.id || !nuevoPasajero.nombre) {
      alert('Todos los campos son requeridos');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/admin/pasajeros`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoPasajero)
      });
      const data = await res.json();
      if (data.success) {
        setNuevoPasajero({ id: '', nombre: '', telefono: '' });
        cargarResumenGeneral();
      }
    } catch (err) {
      alert('Error al crear pasajero');
    }
  };

  const eliminarPasajero = async (id) => {
    if (!confirm('¿Desea borrar este pasajero de la base de datos?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/pasajeros/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) cargarResumenGeneral();
    } catch (err) {
      alert('Error al eliminar pasajero');
    }
  };

  const realizarRecargaPasajero = async (id) => {
    const monto = parseFloat(montoRecarga[id]);
    if (!monto || monto <= 0) {
      alert('Ingrese un monto válido mayor a 0');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/admin/pasajeros/${id}/recarga`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monto })
      });
      const data = await res.json();
      if (data.success) {
        alert('Recarga exitosa ✔️');
        setMontoRecarga(prev => ({ ...prev, [id]: '' }));
        cargarResumenGeneral();
      }
    } catch (err) {
      alert('Error procesando recarga');
    }
  };

  const registrarChofer = async (e) => {
    e.preventDefault();
    if (!nuevoChofer.cedula || !nuevoChofer.nombre || !nuevoChofer.bancoNumero) {
      alert('Cédula, Nombre y Número de Cuenta son obligatorios.');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/admin/choferes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoChofer)
      });
      const data = await res.json();
      if (data.success) {
        setNuevoChofer({ cedula: '', nombre: '', telefono: '', bancoNombre: '', bancoNumero: '' });
        cargarResumenGeneral();
        cargarUnidades();
      }
    } catch (err) {
      alert('Error al registrar chofer');
    }
  };

  const eliminarChofer = async (cedula) => {
    if (!confirm('¿Seguro que desea eliminar este chofer de la plantilla? Se desvinculará de su unidad.')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/choferes/${cedula}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        cargarResumenGeneral();
        cargarUnidades();
      }
    } catch (err) {
      alert('Error al eliminar chofer');
    }
  };

  const vaciarBilleteraChofer = async (cedula) => {
    if (!confirm('¿Confirma que ha entregado el efectivo y desea vaciar la billetera virtual de este chofer?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/choferes/${cedula}/vaciar`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('Billetera vaciada exitosamente.');
        cargarResumenGeneral();
      }
    } catch (err) {
      alert('Error al vaciar billetera');
    }
  };

  const guardarConfiguracionLinea = async () => {
  try {
    const res = await fetch(`${API_URL}/api/admin/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(configLinea) // configLinea contiene el nuevo valor
    });
    const data = await res.json();
    if (data.success) {
      alert("Configuración guardada.");
    }
  } catch (err) {
    alert("Error al guardar.");
  }
};

// Función para generar QR único de la App Movil (Pasajeros y Choferes)
  const generarQrApp = () => {
    const host = window.location.hostname; 
    // Corrección mínima: Apunta directamente al inicio unificado donde el sistema solicita la cédula
    const url = window.location.hostname === 'busidem.onrender.com'
      ? 'https://busidem.onrender.com/'
      : `http://${host}:5173/`;
    setQrAppPasajero({ url: url });
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', color: '#333', backgroundColor: '#f8f9fc' }}>
      
      {/* HEADER DE CONTROL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#4e73df', padding: '20px', borderRadius: '10px', color: '#fff', marginBottom: '25px', boxShadow: '0 4px 12px rgba(78,115,223,0.15)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>Panel Administrativo de Control Vial</h1>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#eaecf4' }}>BUSIDEM SERVER - Gestión General</p>
        </div>
        <div style={{ backgroundColor: '#2e59d9', padding: '10px 15px', borderRadius: '5px', fontSize: '13px', fontWeight: 'bold', fontFamily: 'monospace' }}>
          CONEXIÓN LOCAL: {API_URL}
        </div>
      </div>

      {error && (
        <div style={{ padding: '15px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '5px', marginBottom: '20px', fontWeight: 'bold', fontSize: '14px', border: '1px solid #f5c6cb' }}>
          ⚠️ {error}
        </div>
      )}

      {/* MENÚ DE PESTAÑAS PRINCIPALES */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e3e6f0', paddingBottom: '10px' }}>
        <button 
          onClick={() => setPestanaActiva('buses')} 
          style={{ padding: '12px 20px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', border: 'none', borderRadius: '5px', backgroundColor: pestanaActiva === 'buses' ? '#4e73df' : '#eaecf4', color: pestanaActiva === 'buses' ? '#fff' : '#4e73df', transition: 'all 0.2s' }}
        >
          🚍 Control de Unidades (Buses)
        </button>
        <button 
          onClick={() => setPestanaActiva('pasajeros')} 
          style={{ padding: '12px 20px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', border: 'none', borderRadius: '5px', backgroundColor: pestanaActiva === 'pasajeros' ? '#4e73df' : '#eaecf4', color: pestanaActiva === 'pasajeros' ? '#fff' : '#4e73df', transition: 'all 0.2s' }}
        >
          👥 Pasajeros Frecuentes
        </button>
        <button 
          onClick={() => setPestanaActiva('choferes')} 
          style={{ padding: '12px 20px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', border: 'none', borderRadius: '5px', backgroundColor: pestanaActiva === 'choferes' ? '#4e73df' : '#eaecf4', color: pestanaActiva === 'choferes' ? '#fff' : '#4e73df', transition: 'all 0.2s' }}
        >
          🪪 Plantilla de Choferes
        </button>
        <button 
          onClick={() => setPestanaActiva('linea')} 
          style={{ padding: '12px 20px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', border: 'none', borderRadius: '5px', backgroundColor: pestanaActiva === 'linea' ? '#4e73df' : '#eaecf4', color: pestanaActiva === 'linea' ? '#fff' : '#4e73df', transition: 'all 0.2s' }}
        >
          ⚙️ Configuración e Inf. de Línea
        </button>
      </div>

      {/* CONTENIDO DINÁMICO SEGÚN PESTAÑA */}
      <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 0 15px rgba(0,0,0,0.05)', minHeight: '400px' }}>
        
        {/* PESTAÑA 1: GESTIÓN DE BUSES */}
        {pestanaActiva === 'buses' && (
          <div>
            <h2 style={{ marginTop: 0, color: '#4e73df', fontSize: '18px', borderBottom: '1px solid #eaecf4', paddingBottom: '10px' }}>Registro de Nuevas Unidades Colectivas</h2>
            <form onSubmit={registrarUnidad} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '30px', backgroundColor: '#f8f9fc', padding: '15px', borderRadius: '6px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4e73df' }}>Nro. Unidad (Control): *</label>
                <input type="text" placeholder="Ej: 05, 12, 44" value={nuevaUnidad.id} onChange={(e) => setNuevaUnidad({...nuevaUnidad, id: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4e73df' }}>Marca:</label>
                <input type="text" placeholder="Ej: Encava, Kamaz" value={nuevaUnidad.marca} onChange={(e) => setNuevaUnidad({...nuevaUnidad, marca: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4e73df' }}>Modelo:</label>
                <input type="text" placeholder="Ej: ENT-610" value={nuevaUnidad.modelo} onChange={(e) => setNuevaUnidad({...nuevaUnidad, modelo: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4e73df' }}>Placa Real: *</label>
                <input type="text" placeholder="Ej: A01AA2A" value={nuevaUnidad.placa} onChange={(e) => setNuevaUnidad({...nuevaUnidad, placa: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4e73df' }}>Nombre Dueño Bus:</label>
                <input type="text" placeholder="Propietario legal" value={nuevaUnidad.duenoNombre} onChange={(e) => setNuevaUnidad({...nuevaUnidad, duenoNombre: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4e73df' }}>Cédula Dueño Bus: *</label>
                <input type="text" placeholder="V-00000000" value={nuevaUnidad.duenoCedula} onChange={(e) => setNuevaUnidad({...nuevaUnidad, duenoCedula: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4e73df' }}>Teléfono Dueño:</label>
                <input type="text" placeholder="Contacto telefónico" value={nuevaUnidad.duenoTelefono} onChange={(e) => setNuevaUnidad({...nuevaUnidad, duenoTelefono: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#1cc88a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>➕ Registrar Autobús</button>
              </div>
            </form>

            <h3 style={{ color: '#5a5c69', fontSize: '16px', marginBottom: '15px' }}>Inventario de Unidades y Asignación de Operadores</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#4e73df', color: '#fff', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Nro. Bus</th>
                  <th style={{ padding: '10px' }}>Marca / Modelo</th>
                  <th style={{ padding: '10px' }}>Placa</th>
                  <th style={{ padding: '10px' }}>Dueño Registrado</th>
                  <th style={{ padding: '10px' }}>Personal Operativo (Asignado)</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {unidades.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #e3e6f0' }}>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{u.id}</td>
                    <td style={{ padding: '10px' }}>{u.marca} {u.modelo}</td>
                    <td style={{ padding: '10px', fontFamily: 'monospace' }}>{u.placa}</td>
                    <td style={{ padding: '10px' }}>{u.duenoNombre} (C.I. {u.duenoCedula})</td>
                    <td style={{ padding: '10px' }}>
                      <select 
                        value={choferesSeleccionados[u.id] || ''} 
                        onChange={(e) => asignarChoferAUnidad(u.id, e.target.value)}
                        style={{ padding: '5px', width: '100%' }}
                      >
                        <option value="">-- Sin Personal Asignado --</option>
                        {choferes
                          .filter(ch => ch.rol === 'Chófer' || !ch.rol)
                          .map(ch => (
                            <option key={ch.cedula} value={ch.cedula}>{ch.nombre} (C.I. {ch.cedula})</option>
                          ))
                        }
                      </select>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <button onClick={() => eliminarUnidad(u.id)} style={{ padding: '5px 8px', backgroundColor: '#e74a3b', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>❌ Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PESTAÑA 2: GESTIÓN DE PASAJEROS FRECUENTES */}
        {pestanaActiva === 'pasajeros' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ marginTop: 0, color: '#4e73df', fontSize: '18px' }}>Registro Único de Pasajeros</h2>
              <button type="button" onClick={generarQrApp} style={{ padding: '10px 15px', backgroundColor: '#36b9cc', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                📱 Generar QR Único (App Móvil Compartida)
              </button>
            </div>

            <form onSubmit={registrarPasajero} style={{ display: 'flex', gap: '15px', marginBottom: '30px', backgroundColor: '#f8f9fc', padding: '15px', borderRadius: '6px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4e73df' }}>Cédula / ID de Identificación: *</label>
                <input type="text" placeholder="Ej: V-12345678" value={nuevoPasajero.id} onChange={(e) => setNuevoPasajero({...nuevoPasajero, id: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1.5 }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4e73df' }}>Nombre y Apellido completo: *</label>
                <input type="text" placeholder="Ej: Juan Pérez" value={nuevoPasajero.nombre} onChange={(e) => setNuevoPasajero({...nuevoPasajero, nombre: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1.5 }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4e73df' }}>Teléfono Celular (WhatsApp): *</label>
                <input type="text" placeholder="Ej: +584120000000" value={nuevoPasajero.telefono} onChange={(e) => setNuevoPasajero({...nuevoPasajero, telefono: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#1cc88a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>➕ Agregar Pasajero</button>
              </div>
            </form>

            <h3 style={{ color: '#5a5c69', fontSize: '16px', marginBottom: '15px' }}>Padrón y Estado de Billeteras Virtuales de Pasajeros</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#4e73df', color: '#fff', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Cédula / Identificador</th>
                  <th style={{ padding: '10px' }}>Nombre del Beneficiario</th>
                  <th style={{ padding: '10px' }}>Teléfono Celular</th>
                  <th style={{ padding: '10px' }}>Saldo Disponible</th>
                  <th style={{ padding: '10px', width: '250px' }}>Recarga Directa (Taquilla)</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pasajeros.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #e3e6f0' }}>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{p.id}</td>
                    <td style={{ padding: '10px' }}>{p.nombre}</td>
                    <td style={{ padding: '10px' }}>{p.telefono || <span style={{ fontStyle: 'italic', color: '#999' }}>No registrado</span>}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: p.saldo >= 15 ? '#1cc88a' : '#e74a3b' }}>{p.saldo ? p.saldo.toFixed(2) : '0.00'} Bs.</td>
                    <td style={{ padding: '10px' }}>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <input 
                          type="number" 
                          placeholder="Monto Bs." 
                          value={montoRecarga[p.id] || ''} 
                          onChange={(e) => setMontoRecarga({...montoRecarga, [p.id]: e.target.value})}
                          style={{ width: '90px', padding: '5px' }}
                        />
                        <button onClick={() => realizarRecargaPasajero(p.id)} style={{ padding: '5px 8px', backgroundColor: '#4e73df', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}>💰 Recargar</button>
                      </div>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center', display: 'flex', gap: '5px', justifyContent: 'center' }}>
                      <button onClick={() => eliminarPasajero(p.id)} style={{ padding: '5px 8px', backgroundColor: '#e74a3b', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>❌ Borrar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* MODAL PARA MOSTRAR QR DE LA APP */}
            {qrAppPasajero && (
  <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', textAlign: 'center', maxWidth: '340px' }}>
      <h3>Enlace Único BUSIDEM Móvil</h3>
      <p style={{ fontSize: '13px', color: '#6c757d' }}>Envía esta app por WhatsApp a pasajeros y choferes. Al ingresar su cédula, el sistema levantará el ambiente correspondiente.</p>
      <img 
        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrAppPasajero.url)}`} 
        alt="QR PWA"
        style={{ margin: '10px 0' }}
      />
      <p style={{ wordBreak: 'break-all', fontSize: '14px', fontWeight: 'bold', color: '#4e73df' }}>{qrAppPasajero.url}</p>
      <button onClick={() => setQrAppPasajero(null)} style={{ padding: '8px 15px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cerrar</button>
    </div>
  </div>
)}
          </div>
        )}

        {/* PESTAÑA 3: PLANTILLA DE PERSONAL OPERATIVO */}
        {pestanaActiva === 'choferes' && (
          <div>
            <h2 style={{ marginTop: 0, color: '#4e73df', fontSize: '18px', borderBottom: '1px solid #eaecf4', paddingBottom: '10px' }}>Ingresar Nuevo Personal Operativo</h2>
            <form onSubmit={registrarChofer} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '30px', backgroundColor: '#f8f9fc', padding: '15px', borderRadius: '6px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4e73df' }}>Cédula de Identidad: *</label>
                <input type="text" placeholder="Ej: V-11222333" value={nuevoChofer.cedula} onChange={(e) => setNuevoChofer({...nuevoChofer, cedula: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4e73df' }}>Nombre y Apellido: *</label>
                <input type="text" placeholder="Nombre del trabajador" value={nuevoChofer.nombre} onChange={(e) => setNuevoChofer({...nuevoChofer, nombre: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4e73df' }}>Rol: *</label>
                <select value={nuevoChofer.rol || 'Chófer'} onChange={(e) => setNuevoChofer({...nuevoChofer, rol: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }}>
                  <option value="Chófer">Chófer</option>
                  <option value="Fiscal">Fiscal</option>
                  <option value="Colector">Colector</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4e73df' }}>Teléfono Móvil:</label>
                <input type="text" placeholder="Contacto" value={nuevoChofer.telefono} onChange={(e) => setNuevoChofer({...nuevoChofer, telefono: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4e73df' }}>Banco para Liquidación:</label>
                <input type="text" placeholder="Ej: Banesco" value={nuevoChofer.bancoNombre} onChange={(e) => setNuevoChofer({...nuevoChofer, bancoNombre: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ gridColumn: 'span 3' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4e73df' }}>Número de Cuenta Bancaria (20 Dígitos): *</label>
                <input type="text" placeholder="0102..." value={nuevoChofer.bancoNumero} onChange={(e) => setNuevoChofer({...nuevoChofer, bancoNumero: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box', fontFamily: 'monospace' }} />
              </div>
              <div style={{ gridColumn: 'span 4', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" style={{ padding: '10px 25px', backgroundColor: '#1cc88a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>✍️ Registrar Personal Operativo</button>
              </div>
            </form>

            <h3 style={{ color: '#5a5c69', fontSize: '16px', marginBottom: '15px' }}>Nómina General de Personal Operativo</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#4e73df', color: '#fff', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>Cédula</th>
                  <th style={{ padding: '12px' }}>Nombre</th>
                  <th style={{ padding: '12px' }}>Rol</th>
                  <th style={{ padding: '12px' }}>Banco / Cuenta</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Billetera Digital</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {choferes.map(p => (
                  <tr key={p.cedula} style={{ borderBottom: '1px solid #e3e6f0' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{p.cedula}</td>
                    <td style={{ padding: '12px' }}>{p.nombre}</td>
                    <td style={{ padding: '12px' }}>{p.rol || 'Chófer'}</td>
                    <td style={{ padding: '12px' }}>{p.bancoNombre} <br/><span style={{fontFamily: 'monospace'}}>{p.bancoNumero}</span></td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#28a745' }}>{p.saldo ? p.saldo.toFixed(2) : '0.00'} Bs.</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {p.saldo > 0 && <button onClick={() => vaciarBilleteraChofer(p.cedula)} style={{ padding: '5px 8px', marginRight: '5px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>📥 Vaciar</button>}
                      <button onClick={() => eliminarChofer(p.cedula)} style={{ padding: '5px 8px', backgroundColor: '#e74a3b', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>❌ Quitar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PESTAÑA 4: CONFIGURACIÓN E INFORMACIÓN DE LA LÍNEA */}
        {pestanaActiva === 'linea' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e3e6f0' }}>
              <h3 style={{ marginTop: 0, color: '#4e73df', borderBottom: '1px solid #eaecf4', paddingBottom: '8px' }}>Tarifas e Identidad Operativa</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#5a5c69' }}>
                  Nombre Comercial de la Línea:
                  <input
                    type="text"
                    value={configLinea.nombre}
                    onChange={(e) => setConfigLinea({ ...configLinea, nombre: e.target.value })}
                    style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }}
                  />
                </label>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#5a5c69' }}>
                  Ruta Autorizada Principal:
                  <input
                    type="text"
                    value={configLinea.ruta}
                    onChange={(e) => setConfigLinea({ ...configLinea, ruta: e.target.value })}
                    style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }}
                  />
                </label>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#5a5c69' }}>
                  Valor del Pasaje Plano Urbano (Bs):
                  <input
                    type="text"
                    value={configLinea.valorPasaje}
                    onChange={(e) => setConfigLinea({ ...configLinea, valorPasaje: e.target.value })}
                    style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box', fontWeight: 'bold', color: '#2e59d9' }}
                  />
                </label>
                <button onClick={guardarConfiguracionLinea} style={{ padding: '10px', backgroundColor: '#4e73df', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>💾 Guardar Parámetros de Ruta</button>
              </div>
            </div>

            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e3e6f0' }}>
              <h3 style={{ marginTop: 0, color: '#858796', borderBottom: '1px solid #eaecf4', paddingBottom: '8px' }}>Miembros de la Directiva Vial</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.keys(directiva).map((cargoKey) => (
                  <div key={cargoKey} style={{ borderBottom: '1px solid #f8f9fc', paddingBottom: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'capitalize', color: '#4e73df' }}>{cargoKey}:</span>
                    <input
                      type="text"
                      placeholder="Cédula de Identidad"
                      value={directiva[cargoKey].cedula}
                      onChange={(e) => setDirectiva({ ...directiva, [cargoKey]: { ...directiva[cargoKey], cedula: e.target.value } })}
                      style={{ padding: '6px', fontSize: '12px' }}
                    />
                  </div>
                ))}
                <button onClick={guardarMiembrosDirectiva} style={{ padding: '10px', backgroundColor: '#858796', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>✍️ Actualizar Junta Directiva</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Admin;