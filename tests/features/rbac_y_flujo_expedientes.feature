# language: es
Característica: Arquitectura SOLID, Matriz RBAC y Flujo de Expedientes (MDLO Docs)
  Como Arquitecto de Software de la Municipalidad Distrital de Los Olivos
  Quiero validar las políticas polimórficas de permisos RBAC y los manejadores de acciones documentales
  Para garantizar el cumplimiento de los principios SOLID (SRP, OCP, LSP, ISP, DIP) sin acoplamiento a base de datos

  Esquema del escenario: Escenario 1 - Validación de reglas de negocio y permisos RBAC por rol usando la arquitectura limpia
    Dado un funcionario municipal autenticado con el rol "<rol>"
    Cuando se evalúa la política de permisos polimórfica para el rol "<rol>"
    Entonces el permiso para radicar expediente inicial debe ser "<puede_radicar>"
    Y el permiso para subir documentos intermedios debe ser "<puede_anexar>"
    Y el permiso para finalizar o archivar expediente debe ser "<puede_finalizar>"
    Y el permiso de acceso al panel de administración debe ser "<puede_admin>"

    Ejemplos:
      | rol            | puede_radicar | puede_anexar | puede_finalizar | puede_admin |
      | MESA_PARTES    | SI            | NO           | NO              | NO          |
      | ASISTENTE_AREA | NO            | SI           | NO              | NO          |
      | ESPECIALISTA   | NO            | SI           | NO              | NO          |
      | JEFE_AREA      | NO            | SI           | SI              | NO          |
      | ADMIN_TI       | NO            | NO           | NO              | SI          |

  Escenario: Escenario 2 - Flujo de derivación y cierre verificando la sustitución limpia de estados y trazabilidad
    Dado un expediente inicial radicado en "area-mesa-partes" con asunto "Solicitud de Licencia de Edificación"
    Cuando el operador de "area-mesa-partes" recepciona el expediente en bandeja
    Y el operador deriva el expediente desde "area-mesa-partes" hacia "area-obras-privadas" con proveído "Para evaluación técnica estructural"
    Y el especialista de "area-obras-privadas" recepciona el expediente derivado
    Y un usuario con rol "ESPECIALISTA" intenta finalizar el expediente como "ATENDIDO"
    Entonces el sistema rechaza el cierre por política RBAC manteniendo el estado en "RECEPCIONADO"
    Cuando un usuario con rol "JEFE_AREA" finaliza el expediente como "ATENDIDO" con observación "Licencia aprobada mediante Resolución N° 450-2026"
    Entonces el expediente cambia su estado final a "ATENDIDO" en el área "area-obras-privadas"
    Y la hoja de ruta registra exactamente 5 movimientos auditables en orden cronológico
