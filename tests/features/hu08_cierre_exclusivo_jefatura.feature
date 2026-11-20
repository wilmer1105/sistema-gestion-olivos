# language: es
Característica: Potestad Exclusiva de Cierre y Archivo de Expedientes por Jefatura (HU-08)
  Como Jefe de Unidad Orgánica de la Municipalidad Distrital de Los Olivos
  Quiero tener la potestad exclusiva de finalizar y archivar expedientes
  Para asegurar la legalidad resolutiva y que ningún otro rol dé por concluido un trámite indebidamente

  Escenario: Finalización autorizada exclusivamente para JEFE_AREA y rechazo categórico con 403 Forbidden para MESA_PARTES, ASISTENTE_AREA y ESPECIALISTA
    Dado un expediente recepcionado en estado "RECEPCIONADO" en la unidad orgánica "GDU"
    Cuando los roles no resolutivos "MESA_PARTES", "ASISTENTE_AREA" y "ESPECIALISTA" intentan finalizar el expediente en "GDU"
    Entonces el sistema deniega cada intento con el error de autorización "403 Forbidden: Solo el Jefe de Área puede finalizar o archivar expedientes."
    Cuando la autoridad con rol "JEFE_AREA" de "GDU" finaliza el expediente como "ATENDIDO" con proveído de cierre "Se emitió Resolución Gerencial N° 890-2026-MDLO-GDU"
    Entonces el expediente queda cerrado con estado final "ATENDIDO" en la unidad orgánica "GDU"

  Escenario: Bloqueo de cierre por JEFE_AREA sobre expediente en estado DERIVADO (sin recepcionar) o en estado terminal ATENDIDO
    Dado un expediente recepcionado en estado "DERIVADO" en la unidad orgánica "GDU"
    Cuando se verifica la autorización de cierre de "JEFE_AREA" de "GDU" sobre el estado actual del expediente
    Entonces la política RBAC deniega el cierre por estado no habilitado
    Dado un expediente recepcionado en estado "ATENDIDO" en la unidad orgánica "GDU"
    Cuando se verifica la autorización de cierre de "JEFE_AREA" de "GDU" sobre el estado actual del expediente
    Entonces la política RBAC deniega el cierre por estado no habilitado

