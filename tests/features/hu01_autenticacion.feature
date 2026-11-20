# language: es
Característica: Autenticación de Usuarios y Redirección Segura por Rol (HU-01)
  Como Funcionario de la Municipalidad Distrital de Los Olivos
  Quiero autenticarme con mis credenciales institucionales
  Para acceder a las funciones y rutas autorizadas según mi rol oficial

  Esquema del escenario: Inicio de sesión exitoso con redirección correcta según rol
    Dado un usuario registrado en el sistema con correo "<email>", rol "<rol>" y activo "true"
    Cuando intenta iniciar sesión con la contraseña correcta "Mdlo2026!"
    Entonces el inicio de sesión es exitoso
    Y es redirigido a la ruta de inicio "<ruta_inicio>"

    Ejemplos:
      | email                          | rol            | ruta_inicio        |
      | admin@mdlo.gob.pe              | ADMIN_TI       | /dashboard/admin   |
      | mesadepartes@mdlo.gob.pe       | MESA_PARTES    | /dashboard/bandeja |
      | asistente.obras@mdlo.gob.pe    | ASISTENTE_AREA | /dashboard/bandeja |
      | especialista.obras@mdlo.gob.pe | ESPECIALISTA   | /dashboard/bandeja |
      | jefe.obras@mdlo.gob.pe         | JEFE_AREA      | /dashboard/bandeja |

  Escenario: Bloqueo de inicio de sesión para empleados con activo = false
    Dado un usuario registrado en el sistema con correo "cesado@mdlo.gob.pe", rol "ESPECIALISTA" y activo "false"
    Cuando intenta iniciar sesión con la contraseña correcta "Mdlo2026!"
    Entonces el inicio de sesión es rechazado con el mensaje "Su cuenta se encuentra desactivada. Contacte a la OGTIC."

  Escenario: Rechazo de credenciales incorrectas
    Dado un usuario registrado en el sistema con correo "admin@mdlo.gob.pe", rol "ADMIN_TI" y activo "true"
    Cuando intenta iniciar sesión con una contraseña errónea "ClaveErronea123"
    Entonces el inicio de sesión es rechazado con el mensaje "Correo o contraseña incorrectos"
