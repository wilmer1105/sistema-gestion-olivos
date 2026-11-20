# language: es
Característica: Aislamiento Estricto de Bandeja por Unidad Orgánica (HU-04)
  Como Funcionario de la Municipalidad Distrital de Los Olivos
  Quiero ver únicamente los expedientes pertenecientes a mi unidad orgánica en la bandeja
  Para evitar filtración de trámites entre gerencias y subgerencias

  Escenario: Aislamiento estricto de bandeja por unidad orgánica
    Dado que existen expedientes radicados y ubicados actualmente en las unidades orgánicas "SGOPCU" y "SGFA"
    Cuando un funcionario adscrito a la unidad orgánica "SGOPCU" consulta los expedientes de su bandeja de entrada
    Entonces solo visualiza los expedientes cuya área actual es "SGOPCU" y ningún expediente de "SGFA"
