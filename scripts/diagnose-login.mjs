import { createClient } from '@supabase/supabase-js'
const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
for (const email of ['admin@mdlo.gob.pe','jefe.obras@mdlo.gob.pe','mesadepartes@mdlo.gob.pe']) {
  const s=createClient(url,key)
  const {data,error}=await s.auth.signInWithPassword({email,password:'Mdlo2026!'})
  console.log(email,'auth:',error?.message??'OK')
  if(data?.user){
    const r=await s.from('perfiles').select('id,rol,area_id,activo').eq('id',data.user.id).single()
    console.log('  perfil:',JSON.stringify(r.data),r.error?.message??'')
  }
}
