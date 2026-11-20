// tests/unit/rbac.test.ts

import { describe, expect, it } from 'vitest'
import {
  esUsuarioActivo,
  puedeAccederIntranet,
  puedeAsignarEspecialista,
  puedeDerivarExpediente,
  puedeFinalizarExpediente,
  puedeGestionarUsuarios,
  puedeRadicarExpediente,
  puedeRecepcionarExpediente,
  puedeSubirDocumentoIntermedio,
  perteneceAlAreaActual,
  puedeAccederRuta,
  obtenerRutaInicioPorRol,
  obtenerItemsNavegacionPorRol,
  obtenerTiposDocumentoPermitidosPorRol,
  obtenerEtiquetaRol,
  formatearRolUsuario,
  type ExpedienteRBACContext,
  type PerfilRBACContext,
} from '@/lib/domain/rbac'

const AREA_MESA_PARTES = 'area-oacgd-mdp'
const AREA_SGOPCU = 'area-sgopcu'
const AREA_SGFA = 'area-sgfa'
const AREA_OGAJ = 'area-ogaj'

const perfilMesaPartes: PerfilRBACContext = {
  id: 'u-mp',
  rol: 'MESA_PARTES',
  area_id: AREA_MESA_PARTES,
  activo: true,
}

const perfilAsistenteSgopcu: PerfilRBACContext = {
  id: 'u-asist-sgopcu',
  rol: 'ASISTENTE_AREA',
  area_id: AREA_SGOPCU,
  activo: true,
}

const perfilEspecialistaSgopcu: PerfilRBACContext = {
  id: 'u-esp-sgopcu',
  rol: 'ESPECIALISTA',
  area_id: AREA_SGOPCU,
  activo: true,
}

const perfilJefeSgopcu: PerfilRBACContext = {
  id: 'u-jefe-sgopcu',
  rol: 'JEFE_AREA',
  area_id: AREA_SGOPCU,
  activo: true,
}

const perfilAdminTI: PerfilRBACContext = {
  id: 'u-admin-ti',
  rol: 'ADMIN_TI',
  area_id: null,
  activo: true,
}

describe('Motor de Dominio RBAC y Aislamiento por Unidad Orgánica (lib/domain/rbac.ts)', () => {
  describe('1. Control de Acceso e Inactivación Lógica (activo = false)', () => {
    it('bloquea absolutamente todas las operaciones cuando activo === false o perfil es nulo/inválido', () => {
      const inactivoJefe: PerfilRBACContext = {
        ...perfilJefeSgopcu,
        activo: false,
      }
      const inactivoAdmin: PerfilRBACContext = {
        ...perfilAdminTI,
        activo: false,
      }
      const inactivoAsistente: PerfilRBACContext = {
        ...perfilAsistenteSgopcu,
        activo: false,
      }
      const inactivoEspecialista: PerfilRBACContext = {
        ...perfilEspecialistaSgopcu,
        activo: false,
      }
      const expRecepcionado: ExpedienteRBACContext = {
        id: 'exp-1',
        area_actual_id: AREA_SGOPCU,
        estado: 'RECEPCIONADO',
      }
      const expDerivado: ExpedienteRBACContext = {
        id: 'exp-2',
        area_actual_id: AREA_SGOPCU,
        estado: 'DERIVADO',
      }

      // Verificación completa de rechazo para cuentas inactivas
      expect(esUsuarioActivo(inactivoJefe)).toBe(false)
      expect(puedeAccederIntranet(inactivoJefe)).toBe(false)
      expect(puedeRadicarExpediente({ ...perfilMesaPartes, activo: false })).toBe(false)
      expect(puedeRecepcionarExpediente(inactivoAsistente, expDerivado)).toBe(false)
      expect(puedeAsignarEspecialista(inactivoJefe, expRecepcionado)).toBe(false)
      expect(puedeSubirDocumentoIntermedio(inactivoEspecialista, expRecepcionado)).toBe(false)
      expect(puedeDerivarExpediente(inactivoJefe, expRecepcionado)).toBe(false)
      expect(puedeFinalizarExpediente(inactivoJefe, expRecepcionado)).toBe(false)
      expect(puedeGestionarUsuarios(inactivoAdmin)).toBe(false)
      expect(perteneceAlAreaActual(inactivoJefe, expRecepcionado)).toBe(false)

      // Verificación con null / undefined
      expect(esUsuarioActivo(null)).toBe(false)
      expect(esUsuarioActivo(undefined)).toBe(false)
      expect(puedeRadicarExpediente(null)).toBe(false)
      expect(puedeRecepcionarExpediente(null, expDerivado)).toBe(false)
      expect(puedeAsignarEspecialista(null, expRecepcionado)).toBe(false)
      expect(puedeSubirDocumentoIntermedio(null, expRecepcionado)).toBe(false)
      expect(puedeDerivarExpediente(null, expRecepcionado)).toBe(false)
      expect(puedeFinalizarExpediente(null, expRecepcionado)).toBe(false)
      expect(puedeGestionarUsuarios(null)).toBe(false)
    })
  })

  describe('2. Rol ADMIN_TI: Gobernanza Global TI vs. Operatividad Documental', () => {
    it('ADMIN_TI puede gestionar usuarios ÚNICAMENTE con area_id === null, y tiene prohibido operar expedientes', () => {
      const expSgopcu: ExpedienteRBACContext = {
        id: 'exp-test',
        area_actual_id: AREA_SGOPCU,
        estado: 'RECEPCIONADO',
      }

      // Permiso exclusivo de gestión
      expect(puedeGestionarUsuarios(perfilAdminTI)).toBe(true)

      // Si por anomalía tuviera un area_id, se revoca la potestad de superadministrador
      expect(puedeGestionarUsuarios({ ...perfilAdminTI, area_id: AREA_SGOPCU })).toBe(false)

      // Estrictamente prohibido operar expedientes ciudadanos
      expect(puedeRadicarExpediente(perfilAdminTI)).toBe(false)
      expect(puedeRecepcionarExpediente(perfilAdminTI, { ...expSgopcu, estado: 'DERIVADO' })).toBe(false)
      expect(puedeAsignarEspecialista(perfilAdminTI, expSgopcu)).toBe(false)
      expect(puedeSubirDocumentoIntermedio(perfilAdminTI, expSgopcu)).toBe(false)
      expect(puedeDerivarExpediente(perfilAdminTI, expSgopcu)).toBe(false)
      expect(puedeFinalizarExpediente(perfilAdminTI, expSgopcu)).toBe(false)
    })
  })

  describe('3. Rol MESA_PARTES: Radicación y Derivación Inicial', () => {
    it('solo permite radicar expedientes a MESA_PARTES con area_id no nulo', () => {
      expect(puedeRadicarExpediente(perfilMesaPartes)).toBe(true)
      expect(puedeRadicarExpediente({ ...perfilMesaPartes, area_id: null })).toBe(false)
      expect(puedeRadicarExpediente({ ...perfilMesaPartes, area_id: '' })).toBe(false)
      expect(puedeRadicarExpediente(perfilAsistenteSgopcu)).toBe(false)
      expect(puedeRadicarExpediente(perfilEspecialistaSgopcu)).toBe(false)
      expect(puedeRadicarExpediente(perfilJefeSgopcu)).toBe(false)
      expect(puedeRadicarExpediente(perfilAdminTI)).toBe(false)
    })

    it('MESA_PARTES jamás puede finalizar o archivar expedientes en ningún estado ni área', () => {
      const expMesa: ExpedienteRBACContext = {
        id: 'exp-mp',
        area_actual_id: AREA_MESA_PARTES,
        estado: 'RECEPCIONADO',
      }
      expect(puedeFinalizarExpediente(perfilMesaPartes, expMesa)).toBe(false)
      expect(puedeFinalizarExpediente(perfilMesaPartes, { ...expMesa, estado: 'EN_TRAMITE' })).toBe(false)
      expect(puedeFinalizarExpediente(perfilMesaPartes, { ...expMesa, estado: 'OBSERVADO' })).toBe(false)
    })

    it('permite derivar expedientes en estado REGISTRADO a MESA_PARTES y JEFE_AREA de su área, bloqueando a roles no autorizados', () => {
      const expRegistradoMesa: ExpedienteRBACContext = {
        id: 'exp-reg-mp',
        area_actual_id: AREA_MESA_PARTES,
        estado: 'REGISTRADO',
      }
      const expRegistradoSgopcu: ExpedienteRBACContext = {
        id: 'exp-reg-sgopcu',
        area_actual_id: AREA_SGOPCU,
        estado: 'REGISTRADO',
      }

      // MESA_PARTES en su área
      expect(puedeDerivarExpediente(perfilMesaPartes, expRegistradoMesa)).toBe(true)
      // MESA_PARTES en otra área
      expect(puedeDerivarExpediente(perfilMesaPartes, expRegistradoSgopcu)).toBe(false)

      // JEFE_AREA en su área para trámite REGISTRADO
      expect(puedeDerivarExpediente(perfilJefeSgopcu, expRegistradoSgopcu)).toBe(true)
      // JEFE_AREA en otra área
      expect(puedeDerivarExpediente(perfilJefeSgopcu, expRegistradoMesa)).toBe(false)

      // ASISTENTE y ESPECIALISTA NO pueden derivar en estado REGISTRADO
      expect(puedeDerivarExpediente(perfilAsistenteSgopcu, expRegistradoSgopcu)).toBe(false)
      expect(puedeDerivarExpediente(perfilEspecialistaSgopcu, expRegistradoSgopcu)).toBe(false)
    })

    it('permite derivar en estados activos (RECEPCIONADO, EN_TRAMITE, OBSERVADO) a ASISTENTE, ESPECIALISTA, JEFE y MESA_PARTES de su área', () => {
      const estadosActivos = ['RECEPCIONADO', 'EN_TRAMITE', 'OBSERVADO'] as const
      for (const estado of estadosActivos) {
        const expActivo: ExpedienteRBACContext = {
          id: `exp-${estado}`,
          area_actual_id: AREA_SGOPCU,
          estado,
        }
        expect(puedeDerivarExpediente(perfilAsistenteSgopcu, expActivo)).toBe(true)
        expect(puedeDerivarExpediente(perfilEspecialistaSgopcu, expActivo)).toBe(true)
        expect(puedeDerivarExpediente(perfilJefeSgopcu, expActivo)).toBe(true)
      }
    })
  })

  describe('4. Roles ASISTENTE_AREA vs. ESPECIALISTA en la Unidad Orgánica', () => {
    const expDerivado: ExpedienteRBACContext = {
      id: 'exp-der',
      area_actual_id: AREA_SGOPCU,
      estado: 'DERIVADO',
    }
    const expRecepcionado: ExpedienteRBACContext = {
      id: 'exp-rec',
      area_actual_id: AREA_SGOPCU,
      estado: 'RECEPCIONADO',
    }
    const expEnTramite: ExpedienteRBACContext = {
      id: 'exp-tra',
      area_actual_id: AREA_SGOPCU,
      estado: 'EN_TRAMITE',
    }

    it('ASISTENTE_AREA puede recepcionar y asignar especialistas, pero no emitir INFORME_TECNICO ni finalizar', () => {
      // Recepción
      expect(puedeRecepcionarExpediente(perfilAsistenteSgopcu, expDerivado)).toBe(true)
      // Asignación interna
      expect(puedeAsignarEspecialista(perfilAsistenteSgopcu, expRecepcionado)).toBe(true)
      expect(puedeAsignarEspecialista(perfilAsistenteSgopcu, expEnTramite)).toBe(true)
      // Catálogo documental: NO contiene INFORME_TECNICO ni RESOLUCION
      const docsAsistente = obtenerTiposDocumentoPermitidosPorRol(perfilAsistenteSgopcu.rol)
      expect(docsAsistente).toContain('NOTIFICACION')
      expect(docsAsistente).not.toContain('INFORME_TECNICO')
      expect(docsAsistente).not.toContain('RESOLUCION')
      // No finaliza trámites
      expect(puedeFinalizarExpediente(perfilAsistenteSgopcu, expRecepcionado)).toBe(false)
    })

    it('ESPECIALISTA puede recepcionar y emitir INFORME_TECNICO/LEGAL, pero NO puede asignar especialistas ni finalizar', () => {
      // Recepción
      expect(puedeRecepcionarExpediente(perfilEspecialistaSgopcu, expDerivado)).toBe(true)
      // No puede asignar a otros especialistas
      expect(puedeAsignarEspecialista(perfilEspecialistaSgopcu, expRecepcionado)).toBe(false)
      // Catálogo documental: contiene INFORME_TECNICO e INFORME_LEGAL, pero NO RESOLUCION
      const docsEspecialista = obtenerTiposDocumentoPermitidosPorRol(perfilEspecialistaSgopcu.rol)
      expect(docsEspecialista).toContain('INFORME_TECNICO')
      expect(docsEspecialista).toContain('INFORME_LEGAL')
      expect(docsEspecialista).toContain('ACTA_FISCALIZACION')
      expect(docsEspecialista).not.toContain('RESOLUCION')
      // No finaliza trámites
      expect(puedeFinalizarExpediente(perfilEspecialistaSgopcu, expRecepcionado)).toBe(false)
    })
  })

  describe('5. Potestad EXCLUSIVA de Cierre de Expedientes (JEFE_AREA)', () => {
    const expSgopcuRecepcionado: ExpedienteRBACContext = {
      id: 'exp-sgopcu-rec',
      area_actual_id: AREA_SGOPCU,
      estado: 'RECEPCIONADO',
    }
    const expSgopcuEnTramite: ExpedienteRBACContext = {
      id: 'exp-sgopcu-tra',
      area_actual_id: AREA_SGOPCU,
      estado: 'EN_TRAMITE',
    }
    const expSgopcuObservado: ExpedienteRBACContext = {
      id: 'exp-sgopcu-obs',
      area_actual_id: AREA_SGOPCU,
      estado: 'OBSERVADO',
    }
    const expSgopcuDerivadoSinRecepcionar: ExpedienteRBACContext = {
      id: 'exp-sgopcu-der',
      area_actual_id: AREA_SGOPCU,
      estado: 'DERIVADO',
    }
    const expSgfaRecepcionado: ExpedienteRBACContext = {
      id: 'exp-sgfa-rec',
      area_actual_id: AREA_SGFA,
      estado: 'RECEPCIONADO',
    }

    it('solo JEFE_AREA de la misma área y en estado recepcionado/en trámite/observado puede finalizar', () => {
      // Éxito para Jefe en su área
      expect(puedeFinalizarExpediente(perfilJefeSgopcu, expSgopcuRecepcionado)).toBe(true)
      expect(puedeFinalizarExpediente(perfilJefeSgopcu, expSgopcuEnTramite)).toBe(true)
      expect(puedeFinalizarExpediente(perfilJefeSgopcu, expSgopcuObservado)).toBe(true)

      // Rechazo si sigue en DERIVADO (sin recepcionar)
      expect(puedeFinalizarExpediente(perfilJefeSgopcu, expSgopcuDerivadoSinRecepcionar)).toBe(false)

      // Rechazo estricto si el expediente pertenece a OTRA área (SGFA)
      expect(puedeFinalizarExpediente(perfilJefeSgopcu, expSgfaRecepcionado)).toBe(false)

      // Rechazo categórico para los otros 4 roles
      expect(puedeFinalizarExpediente(perfilAdminTI, expSgopcuRecepcionado)).toBe(false)
      expect(puedeFinalizarExpediente(perfilMesaPartes, expSgopcuRecepcionado)).toBe(false)
      expect(puedeFinalizarExpediente(perfilAsistenteSgopcu, expSgopcuRecepcionado)).toBe(false)
      expect(puedeFinalizarExpediente(perfilEspecialistaSgopcu, expSgopcuRecepcionado)).toBe(false)
    })
  })

  describe('6. Bloqueo Estricto de Acciones en Estado DERIVADO (Sin Recepcionar)', () => {
    const expDerivado: ExpedienteRBACContext = {
      id: 'exp-bloqueo',
      area_actual_id: AREA_SGOPCU,
      estado: 'DERIVADO',
    }

    it('impide asignar especialista, subir documentos intermedios, derivar o finalizar mientras siga en DERIVADO', () => {
      // La única acción habilitada es acuse de recepción
      expect(puedeRecepcionarExpediente(perfilAsistenteSgopcu, expDerivado)).toBe(true)
      expect(puedeRecepcionarExpediente(perfilEspecialistaSgopcu, expDerivado)).toBe(true)
      expect(puedeRecepcionarExpediente(perfilJefeSgopcu, expDerivado)).toBe(true)

      // Todo lo demás está rotundamente bloqueado
      expect(puedeAsignarEspecialista(perfilAsistenteSgopcu, expDerivado)).toBe(false)
      expect(puedeAsignarEspecialista(perfilJefeSgopcu, expDerivado)).toBe(false)
      expect(puedeSubirDocumentoIntermedio(perfilEspecialistaSgopcu, expDerivado)).toBe(false)
      expect(puedeSubirDocumentoIntermedio(perfilJefeSgopcu, expDerivado)).toBe(false)
      expect(puedeDerivarExpediente(perfilEspecialistaSgopcu, expDerivado)).toBe(false)
      expect(puedeDerivarExpediente(perfilJefeSgopcu, expDerivado)).toBe(false)
      expect(puedeFinalizarExpediente(perfilJefeSgopcu, expDerivado)).toBe(false)
    })
  })

  describe('7. Enrutamiento, Navegación y Etiquetas Institucionales', () => {
    it('resuelve rutas de inicio y navegación exacta por rol', () => {
      expect(obtenerRutaInicioPorRol('ADMIN_TI')).toBe('/dashboard/admin')
      expect(obtenerRutaInicioPorRol('MESA_PARTES')).toBe('/dashboard/bandeja')
      expect(obtenerRutaInicioPorRol('ASISTENTE_AREA')).toBe('/dashboard/bandeja')
      expect(obtenerRutaInicioPorRol('ESPECIALISTA')).toBe('/dashboard/bandeja')
      expect(obtenerRutaInicioPorRol('JEFE_AREA')).toBe('/dashboard/bandeja')

      const navAdmin = obtenerItemsNavegacionPorRol('ADMIN_TI')
      expect(navAdmin).toHaveLength(1)
      expect(navAdmin[0]?.href).toBe('/dashboard/admin')

      const navMesa = obtenerItemsNavegacionPorRol('MESA_PARTES')
      expect(navMesa.map((n) => n.href)).toContain('/dashboard/expedientes/nuevo')
      expect(navMesa.map((n) => n.href)).not.toContain('/dashboard/admin')

      const navAsistente = obtenerItemsNavegacionPorRol('ASISTENTE_AREA')
      expect(navAsistente.map((n) => n.href)).not.toContain('/dashboard/expedientes/nuevo')
      expect(navAsistente.map((n) => n.href)).not.toContain('/dashboard/admin')
    })

    it('valida acceso a rutas por perfil con puedeAccederRuta', () => {
      expect(puedeAccederRuta(perfilAdminTI, '/dashboard/admin')).toBe(true)
      expect(puedeAccederRuta(perfilAdminTI, '/dashboard/admin/usuarios')).toBe(true)
      expect(puedeAccederRuta(perfilAdminTI, '/dashboard')).toBe(false)
      expect(puedeAccederRuta(perfilAdminTI, '/dashboard/bandeja')).toBe(false)
      expect(puedeAccederRuta(perfilAdminTI, '/dashboard/expedientes/nuevo')).toBe(false)

      expect(puedeAccederRuta(perfilMesaPartes, '/dashboard/expedientes/nuevo')).toBe(true)
      expect(puedeAccederRuta(perfilMesaPartes, '/dashboard/admin')).toBe(false)

      expect(puedeAccederRuta(perfilAsistenteSgopcu, '/dashboard/expedientes/nuevo')).toBe(false)
      expect(puedeAccederRuta(perfilAsistenteSgopcu, '/dashboard/admin')).toBe(false)
    })

    it('evalúa pertenencia al área actual correctamente (perteneceAlAreaActual)', () => {
      const expSgopcu = { area_actual_id: AREA_SGOPCU, estado: 'EN_TRAMITE' }
      expect(perteneceAlAreaActual(perfilAsistenteSgopcu, expSgopcu)).toBe(true)
      expect(perteneceAlAreaActual(perfilMesaPartes, expSgopcu)).toBe(false)
      expect(perteneceAlAreaActual(perfilAdminTI, expSgopcu)).toBe(false)
      expect(
        perteneceAlAreaActual(perfilAsistenteSgopcu, {
          area_actual_id: AREA_OGAJ,
          estado: 'RECEPCIONADO',
        })
      ).toBe(false)
    })

    it('formatea etiquetas de rol institucionales', () => {
      expect(obtenerEtiquetaRol('ADMIN_TI')).toContain('Administrador')
      expect(obtenerEtiquetaRol('MESA_PARTES')).toBe('Operador de Mesa de Partes')
      expect(obtenerEtiquetaRol('ASISTENTE_AREA')).toBe('Asistente de Área')
      expect(obtenerEtiquetaRol('ESPECIALISTA')).toBe('Especialista')
      expect(obtenerEtiquetaRol('JEFE_AREA')).toBe('Jefe de Área')
      expect(formatearRolUsuario('JEFE_AREA')).toBe('Jefe de Área')
    })
  })
})
