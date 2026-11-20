// scripts/seed-users.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: Faltan las variables NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

interface SeedUserDef {
  email: string
  nombres: string
  apellidos: string
  dni: string
  rol: 'ADMIN_TI' | 'MESA_PARTES' | 'ASISTENTE_AREA' | 'ESPECIALISTA' | 'JEFE_AREA'
  areaSiglas: 'OACGD-MDP' | 'SGOPCU' | null
}

const MASTER_PASSWORD = 'Mdlo2026!'

const USERS_TO_SEED: SeedUserDef[] = [
  {
    email: 'admin@mdlo.gob.pe',
    nombres: 'Administrador TI',
    apellidos: 'OGTIC',
    dni: '10000001',
    rol: 'ADMIN_TI',
    areaSiglas: null,
  },
  {
    email: 'mesadepartes@mdlo.gob.pe',
    nombres: 'Operador',
    apellidos: 'Mesa de Partes',
    dni: '20000002',
    rol: 'MESA_PARTES',
    areaSiglas: 'OACGD-MDP',
  },
  {
    email: 'asistente.obras@mdlo.gob.pe',
    nombres: 'Asistente',
    apellidos: 'Obras Privadas',
    dni: '30000003',
    rol: 'ASISTENTE_AREA',
    areaSiglas: 'SGOPCU',
  },
  {
    email: 'especialista.obras@mdlo.gob.pe',
    nombres: 'Especialista',
    apellidos: 'Obras Privadas',
    dni: '40000004',
    rol: 'ESPECIALISTA',
    areaSiglas: 'SGOPCU',
  },
  {
    email: 'jefe.obras@mdlo.gob.pe',
    nombres: 'Jefe',
    apellidos: 'Obras Privadas',
    dni: '50000005',
    rol: 'JEFE_AREA',
    areaSiglas: 'SGOPCU',
  },
]

async function seed() {
  console.log('--- INICIANDO SEMBRADO DE USUARIOS Y ROLES (MDLO Docs) ---')

  // 1. Obtener o crear catálogo de áreas mínimas requeridas
  const { data: areasExistentes, error: errorAreas } = await supabase
    .from('areas')
    .select('id, nombre, siglas')

  if (errorAreas) {
    console.error('Error al consultar áreas:', errorAreas)
    process.exit(1)
  }

  const areasMap = new Map<string, string>()
  for (const a of areasExistentes || []) {
    if (a.siglas) {
      areasMap.set(a.siglas, a.id)
    }
  }

  // Verificar o insertar OACGD-MDP
  if (!areasMap.has('OACGD-MDP')) {
    console.log('Insertando área OACGD-MDP...')
    const { data: inserted, error: insertErr } = await supabase
      .from('areas')
      .insert({
        nombre: 'Oficina de Atención al Ciudadano y Gestión Documental (Mesa de Partes)',
        siglas: 'OACGD-MDP',
      })
      .select('id, siglas')
      .single()

    if (insertErr || !inserted) {
      console.error('Error al insertar OACGD-MDP:', insertErr)
      process.exit(1)
    }
    areasMap.set('OACGD-MDP', inserted.id)
  }

  // Verificar o insertar SGOPCU
  if (!areasMap.has('SGOPCU')) {
    console.log('Insertando área SGOPCU...')
    const { data: inserted, error: insertErr } = await supabase
      .from('areas')
      .insert({
        nombre: 'Subgerencia de Obras Privadas y Control Urbano',
        siglas: 'SGOPCU',
      })
      .select('id, siglas')
      .single()

    if (insertErr || !inserted) {
      console.error('Error al insertar SGOPCU:', insertErr)
      process.exit(1)
    }
    areasMap.set('SGOPCU', inserted.id)
  }

  // 2. Obtener lista actual de usuarios en Supabase Auth
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
    perPage: 100,
  })

  if (listError) {
    console.error('Error al listar usuarios en Auth:', listError)
    process.exit(1)
  }

  const existingAuthUsers = new Map<string, string>()
  for (const u of listData.users) {
    if (u.email) {
      existingAuthUsers.set(u.email.toLowerCase(), u.id)
    }
  }

  // 3. Sembrar cada uno de los 5 usuarios
  for (const userDef of USERS_TO_SEED) {
    const emailLower = userDef.email.toLowerCase()
    let userId = existingAuthUsers.get(emailLower)
    const areaId = userDef.areaSiglas ? areasMap.get(userDef.areaSiglas) || null : null

    if (userId) {
      console.log(`[AUTH] Actualizando usuario existente: ${emailLower} (${userId})`)
      const { error: updateErr } = await supabase.auth.admin.updateUserById(userId, {
        password: MASTER_PASSWORD,
        email_confirm: true,
        user_metadata: {
          nombres: userDef.nombres,
          apellidos: userDef.apellidos,
          rol: userDef.rol,
        },
      })
      if (updateErr) {
        console.error(`Error actualizando ${emailLower} en Auth:`, updateErr)
      }
    } else {
      console.log(`[AUTH] Creando nuevo usuario: ${emailLower}`)
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: emailLower,
        password: MASTER_PASSWORD,
        email_confirm: true,
        user_metadata: {
          nombres: userDef.nombres,
          apellidos: userDef.apellidos,
          rol: userDef.rol,
        },
      })
      if (createErr || !created.user) {
        console.error(`Error creando ${emailLower} en Auth:`, createErr)
        continue
      }
      userId = created.user.id
    }

    // 4. Sincronizar public.perfiles
    const { error: perfilErr } = await supabase
      .from('perfiles')
      .upsert({
        id: userId,
        nombres: userDef.nombres,
        apellidos: userDef.apellidos,
        dni: userDef.dni,
        correo: emailLower,
        rol: userDef.rol,
        area_id: areaId,
        activo: true,
      })

    if (perfilErr) {
      console.error(`Error upserting perfil para ${emailLower}:`, perfilErr)
    } else {
      console.log(`[PERFILES] ✓ Perfil sincronizado: ${userDef.rol} (${emailLower}) -> area_id: ${areaId || 'NULL'}`)
    }
  }

  console.log('--- SEMBRADO COMPLETADO EXITOSAMENTE ---')
}

seed().catch((err) => {
  console.error('Error fatal durante el sembrado:', err)
  process.exit(1)
})
