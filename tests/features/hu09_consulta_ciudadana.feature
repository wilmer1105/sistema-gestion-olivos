# language: es
Característica: Consulta Pública Ciudadana Anonimizada por Código CUT (HU-09)
  Como Ciudadano / Administrado de la Municipalidad Distrital de Los Olivos
  Quiero consultar el estado actual y la hoja de ruta de mi trámite ingresando únicamente mi código CUT
  Para conocer en qué unidad orgánica se encuentra mi expediente protegiendo mi privacidad y datos personales

  Escenario: HU-09 - Consulta pública por código CUT mostrando hoja de ruta y anonimizando datos sensibles del remitente
    Dado un expediente público registrado con CUT "EXP-2026-000550-MDLO", asunto "Licencia de Edificación Modalidad A", estado "EN_TRAMITE" en "Subgerencia de Obras Privadas y Control Urbano" y datos sensibles del administrado
    Cuando un ciudadano sin sesión consulta públicamente el expediente por el código CUT "EXP-2026-000550-MDLO"
    Entonces la vista de consulta ciudadana retorna el estado "EN_TRAMITE", el área actual "Subgerencia de Obras Privadas y Control Urbano" y el historial de movimientos
    Y la respuesta pública anonimiza completamente el DNI, teléfono, correo electrónico y dirección domiciliaria del remitente

  Escenario: HU-09 (2) - Consulta pública con código CUT inexistente retorna respuesta controlada sin exponer datos
    Dado un expediente público registrado con CUT "EXP-2026-000550-MDLO", asunto "Licencia de Edificación Modalidad A", estado "EN_TRAMITE" en "Subgerencia de Obras Privadas y Control Urbano" y datos sensibles del administrado
    Cuando un ciudadano sin sesión consulta públicamente un código CUT inexistente "EXP-2026-999999-MDLO"
    Entonces la vista pública no retorna expediente ni datos personales del administrado

