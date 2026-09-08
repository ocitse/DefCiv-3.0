// Obtener relevamientos en espera ('completado')
export const obtenerEnEspera = async (req, res) => {
    try {
        const enEspera = await Relevamiento.findAll({ 
            where: { estado: 'completado' },
            order: [['createdAt', 'DESC']]
        });

        // Obtenemos los usuarios de la misma forma exacta que en relevamientoController
        const listaUsuarios = await Usuario.findAll().catch(() => []);
        const mapaNombres = {};

        listaUsuarios.forEach(usr => {
            if (usr) {
                const usrJSON = usr.toJSON ? usr.toJSON() : usr;
                const idUsr = usrJSON.id_usuario || usrJSON.id;

                if (idUsr) {
                    const nombreProp = usrJSON.nombres || usrJSON.nombre || '';
                    const apellidoProp = usrJSON.apellido || '';
                    const nombreCompleto = `${apellidoProp}, ${nombreProp}`;
                    
                    mapaNombres[String(idUsr)] = nombreCompleto;
                    mapaNombres[nombreCompleto] = nombreCompleto;
                }
            }
        });

        // Traducimos el ID o valor de relevador_asignado usando el mismo mapa seguro
        const resultadosFinales = enEspera.map(item => {
            const itemJSON = item.toJSON ? item.toJSON() : item;
            const asignado = String(itemJSON.relevador_asignado || '').trim();
            
            itemJSON.relevador_asignado = mapaNombres[asignado] || (asignado !== '' ? asignado : 'Sin asignar');
            return itemJSON;
        });

        res.json(resultadosFinales);
    } catch (error) {
        console.error("Error al obtener relevamientos en espera:", error);
        res.status(500).json({ error: "Error al obtener relevamientos en espera" });
    }
};