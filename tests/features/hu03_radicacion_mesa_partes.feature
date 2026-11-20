# language: es
Característica: Radicación de Expedientes en Mesa de Partes (HU-03)
  Como Operador de Mesa de Partes (OACGD-MDP) de la Municipalidad Distrital de Los Olivos
  Quiero registrar expedientes nuevos validando el documento del administrado y el archivo PDF inicial
  Para generar el Código Único de Trámite (CUT) y asegurar la integridad documental desde el ingreso

  Escenario: HU-03 (1) - Radicación exitosa de expediente por MESA_PARTES con datos válidos y PDF menor a 10MB
    Dado un operador activo con rol "MESA_PARTES" adscrito a la unidad orgánica "OACGD-MDP"
    Cuando registra un nuevo expediente con tipo de documento "DNI", número "45892134", remitente "Juan Carlos Pérez Quispe", asunto "Solicitud de Licencia de Funcionamiento Comercial", 8 folios y un archivo PDF de 2 MB
    Entonces la radicación del expediente finaliza con éxito generando un código CUT con formato "EXP-2026-000001-MDLO"
    Y el expediente queda registrado con estado inicial "REGISTRADO" en la unidad orgánica "OACGD-MDP"
    Y el repositorio de adjuntos almacena 1 archivo PDF asociado a la unidad orgánica "OACGD-MDP"

  Escenario: HU-03 (2) - Rechazo de radicación por DNI inválido o archivo no permitido
    Dado un operador activo con rol "MESA_PARTES" adscrito a la unidad orgánica "OACGD-MDP"
    Cuando intenta validar un expediente con tipo de documento "DNI", número inválido "12345" y asunto "Solicitud de Inspección Técnica"
    Entonces el validador rechaza los datos de radicación indicando error en el documento de identidad
    Cuando intenta validar un archivo adjunto con nombre "script_malicioso.exe", tipo MIME "application/x-msdownload" y peso 1 MB
    Entonces el validador de archivos rechaza el adjunto por no ser formato PDF válido

  Escenario: HU-03 (3) - Casos borde de RUC (10 y 12 dígitos), campos vacíos y límite exacto de PDF (10 MB vs 10 MB + 1 byte)
    Dado un operador activo con rol "MESA_PARTES" adscrito a la unidad orgánica "OACGD-MDP"
    Cuando intenta validar un expediente con tipo de documento "RUC", número inválido "205544332219" y asunto "Solicitud de Licencia Comercial"
    Entonces el validador rechaza los datos de radicación indicando error en el documento de identidad
    Cuando intenta validar un archivo PDF de exactamente 10485760 bytes
    Entonces el validador de archivos acepta el PDF en el límite permitido
    Cuando intenta validar un archivo PDF de exactamente 10485761 bytes
    Entonces el validador de archivos rechaza el adjunto por exceder el límite de 10 MB

