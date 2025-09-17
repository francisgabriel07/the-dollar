 let colaPacientes = crearCola();
        let pacientesAtendidos = [];
        let idCounter = 1;

        const form = $('#registro-form');
        const listaEspera = $('#lista-espera');
        const listaAtendidos = $('#lista-atendidos');
        const panelControl = $('#panel-control');
        const secciones = $$('.seccion-contenido');
        const botonesPanel = $$('#panel-control button');

        // Funciones de utilidad y renderizado
        const generarId = () => {
            const db = getDB();
            let lastId = 0;
            if (db.length > 0) {
                const lastTicket = db.reduce((max, p) => p.id > max ? p.id : max, "TICKET-0000");
                lastId = parseInt(lastTicket.split('-')[1]);
            }
            idCounter = lastId + 1;
            return `TICKET-${String(idCounter).padStart(4, '0')}`;
        };

        const esCasoEspecial = tipo => ['embarazada', 'anciano', 'nino', 'discapacitado', 'accidente'].includes(tipo);

        const mostrarSeccion = (idSeccion) => {
            secciones.forEach(seccion => {
                seccion.classList.remove('active');
            });
            $(`#${idSeccion}`).classList.add('active');
        };

        const actualizarBotonesPanel = (btnActivo) => {
            botonesPanel.forEach(btn => btn.classList.remove('active'));
            btnActivo.classList.add('active');
        };

        const crearTarjetaPaciente = (paciente, esAtendido = false) => {
            const li = document.createElement('li');
            li.dataset.id = paciente.id;
            li.classList.add('paciente-card');

            if (esCasoEspecial(paciente.casoEspecial) && !esAtendido) {
                li.classList.add('paciente-prioridad');
            }

            li.innerHTML = `
                <div class="paciente-info">
                    <div class="paciente-nombre">${paciente.nombre}</div>
                     <div class="paciente-nombre">${paciente.identificacion}</div>
                    <div>Doctor/a: ${paciente.doctor}</div>
                    <div>Fecha de Registro: ${paciente.fechaRegistro}</div>
                    ${esAtendido ? `<div>Fecha de Atención: ${paciente.fechaAtencion}</div>` : ''}
                </div>
                <div class="paciente-accion">
                    <div class="paciente-ticket">${paciente.id}</div>
                </div>
            `;
            return li;
        };

        const renderPacientes = (lista, elementos, esAtendido = false) => {
            if (elementos.length === 0) {
                lista.innerHTML = `<p class="vacio">No hay pacientes ${esAtendido ? 'atendidos' : 'en espera'}</p>`;
                return;
            }

            lista.innerHTML = '';
            elementos.forEach(paciente => {
                const tarjeta = crearTarjetaPaciente(paciente, esAtendido);
                
                if (!esAtendido) {
                    const contenedorAccion = tarjeta.querySelector('.paciente-accion');
                    const botonAtendido = document.createElement('button');
                    botonAtendido.textContent = 'Atender';
                    botonAtendido.classList.add('atendido-btn');
                    botonAtendido.onclick = () => atenderPaciente(paciente.id);
                    contenedorAccion.appendChild(botonAtendido);
                } else {
                    tarjeta.classList.add('atendido-card');
                    tarjeta.querySelector('.paciente-accion').remove();
                    tarjeta.style.borderLeftColor = '#ccc';
                }
                
                lista.appendChild(tarjeta);
            });
        };

        const actualizarListas = () => {
            renderPacientes(listaEspera, colaPacientes.obtenerCola());
            renderPacientes(listaAtendidos, pacientesAtendidos, true);
        };

        // Lógica de la aplicación
        const registrarPaciente = (evento) => {
            evento.preventDefault();

            const nuevoPaciente = {
                id: generarId(),
                nombre: $('#nombre').value,
                doctor: $('#doctor').value,
                casoEspecial: $('#caso-especial').value,
                fechaRegistro: new Date().toLocaleString(),
                fechaAtencion: null
            };

            // Guarda el paciente en la DB
            const db = getDB();
            db.push(nuevoPaciente);
            saveDB(db);

            // Reorganiza y actualiza las listas en pantalla
            cargarDatosDesdeDB();
            actualizarListas();
            form.reset();
            mostrarSeccion('espera');
            actualizarBotonesPanel($('#btn-espera'));
        };

        const atenderPaciente = (id) => {
            const db = getDB();
            const pacienteIndex = db.findIndex(p => p.id === id);

            if (pacienteIndex !== -1) {
                // Actualiza la fecha de atención y mueve el paciente a la lista de atendidos
                db[pacienteIndex].fechaAtencion = new Date().toLocaleString();
                saveDB(db);

                // Recarga los datos para reflejar el cambio
                cargarDatosDesdeDB();
                actualizarListas();
            }
        };

        const cargarDatosDesdeDB = () => {
            const db = getDB();
            colaPacientes = crearCola();
            pacientesAtendidos = [];

            db.forEach(paciente => {
                if (paciente.fechaAtencion === null) {
                    colaPacientes.encolar(paciente);
                } else {
                    pacientesAtendidos.push(paciente);
                }
            });
            colaPacientes.reorganizar();
        };
        
        // Event listeners
        form.addEventListener('submit', registrarPaciente);
        panelControl.addEventListener('click', (evento) => {
            const btn = evento.target.closest('button');
            if (btn) {
                const idSeccion = btn.id.split('-')[1];
                mostrarSeccion(idSeccion);
                actualizarBotonesPanel(btn);
            }
        });
        
        // Inicializar la vista
        cargarDatosDesdeDs();
        actualizarListas();