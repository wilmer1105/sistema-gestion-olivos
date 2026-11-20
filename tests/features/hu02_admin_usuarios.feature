# language: es
Característica: Administración de Usuarios y Regla Reactiva de Unidad Orgánica (HU-02)
  Como Administrador de TI (OGTIC)
  Quiero registrar empleados en el sistema asegurando la correspondencia entre rol y unidad orgánica
  Para evitar que funcionarios sin área operen expedientes o que administradores queden atados a un área operativa

  Esquema del escenario: Validación reactiva de unidad orgánica
    Dado el catálogo oficial de áreas con Mesa de Partes "11111111-1111-4111-8111-111111111111" y Subgerencia SGOPCU "22222222-2222-4222-8222-222222222222"
    Cuando el Administrador TI intenta registrar un empleado con DNI "<dni>", rol "<rol>" y área seleccionada "<area_seleccionada>"
    Entonces la validación del esquema de empleado debe resultar "<resultado_validacion>"
    Y el área efectiva resuelta por la política del rol debe ser "<area_resuelta>"

    Ejemplos:
      | dni      | rol            | area_seleccionada                    | resultado_validacion | area_resuelta                        |
      | 41111111 | ADMIN_TI       | NINGUNA                              | VALIDO               | NULL                                 |
      | 42222222 | MESA_PARTES    | 22222222-2222-4222-8222-222222222222 | VALIDO               | 11111111-1111-4111-8111-111111111111 |
      | 43333333 | ASISTENTE_AREA | 22222222-2222-4222-8222-222222222222 | VALIDO               | 22222222-2222-4222-8222-222222222222 |
      | 44444444 | ASISTENTE_AREA | NINGUNA                              | RECHAZADO            | NULL                                 |
      | 45555555 | ESPECIALISTA   | 22222222-2222-4222-8222-222222222222 | VALIDO               | 22222222-2222-4222-8222-222222222222 |
      | 46666666 | ESPECIALISTA   | NINGUNA                              | RECHAZADO            | NULL                                 |
      | 47777777 | JEFE_AREA      | 22222222-2222-4222-8222-222222222222 | VALIDO               | 22222222-2222-4222-8222-222222222222 |
      | 48888888 | JEFE_AREA      | NINGUNA                              | RECHAZADO            | NULL                                 |
