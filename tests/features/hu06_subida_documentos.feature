# language: es
Característica: Subida de Documentos Sustentatorios Intermedios (HU-06)
  Como Especialista Técnico o Legal de la MDLO
  Quiero adjuntar documentos intermedios agrupados bajo mi unidad orgánica
  Para sustentar la evaluación del expediente conforme al TUPA

  Escenario: Subida de documento intermedio por ESPECIALISTA agrupado bajo OGAJ
    Dado un expediente recepcionado en estado "RECEPCIONADO" en la unidad orgánica "OGAJ"
    Cuando el funcionario con rol "ESPECIALISTA" de "OGAJ" sube el archivo PDF "Opinion_Legal_045_2026.pdf" catalogado como "INFORME_LEGAL"
    Entonces el documento intermedio se registra exitosamente en el repositorio de adjuntos
    Y el adjunto queda etiquetado con tipo de documento "INFORME_LEGAL" y agrupado bajo la unidad orgánica emisora "OGAJ"
