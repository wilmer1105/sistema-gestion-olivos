# language: es
Característica: Acuse de Recepción y Asignación Interna a Especialista (HU-05)
  Como Funcionario de Unidad Orgánica de la Municipalidad Distrital de Los Olivos
  Quiero acusar recibo de los trámites derivados a mi área y asignarlos internamente a un especialista
  Para cambiar el estado de DERIVADO a RECEPCIONADO y habilitar el flujo documental activo

  Escenario: Acuse de recepción por ASISTENTE_AREA e impedimento de acciones previas en DERIVADO
    Dado un expediente con estado "DERIVADO" ubicado en la bandeja de la unidad orgánica "SGOPCU"
    Cuando un funcionario con rol "ESPECIALISTA" de "SGOPCU" intenta subir un documento intermedio o derivar el expediente sin haberlo recepcionado
    Entonces el motor RBAC bloquea la subida de documentos y la derivación porque el expediente sigue en estado "DERIVADO"
    Cuando el funcionario con rol "ASISTENTE_AREA" de "SGOPCU" acusa la recepción del expediente en su bandeja
    Entonces el expediente cambia su estado a "RECEPCIONADO" en la unidad orgánica "SGOPCU"
    Y el asistente asigna internamente el expediente al especialista "u-esp-sgopcu" pasando a estado "EN_TRAMITE"
