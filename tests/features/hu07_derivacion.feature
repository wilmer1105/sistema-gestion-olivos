# language: es
Característica: Derivación Segura de Expedientes entre Unidades Orgánicas (HU-07)
  Como Funcionario de la Municipalidad Distrital de Los Olivos
  Quiero derivar un expediente con su proveído obligatorio
  Para transferir la competencia del trámite a otra unidad orgánica y mantener la trazabilidad

  Escenario: Derivación interorgánica con proveído obligatorio
    Dado un expediente recepcionado en estado "RECEPCIONADO" en la unidad orgánica "SGOPCU"
    Cuando el funcionario de "SGOPCU" deriva el expediente hacia la unidad orgánica "OGAJ" con el proveído "Solicito opinión legal sobre parámetros urbanísticos"
    Entonces el expediente actualiza su estado a "DERIVADO" y su ubicación actual a "OGAJ"
    Y la hoja de ruta registra el movimiento de derivación desde "SGOPCU" hacia "OGAJ" con su proveído
