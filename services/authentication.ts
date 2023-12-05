import { Request } from 'express'

export default async function authenticate(req: Request) : Promise<boolean> {
   // basic auth
   const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
   const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':')

   const response = await fetch(`${process.env.API_URI}/users/login/${login}/${password}`,{
      method: 'POST',
      cache: 'no-cache'
   })

   if (response.ok) {
      return true
   } else {
      console.log('Login Failed: ' + await response.json())
      return false
   }
}