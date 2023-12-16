export default async function authenticate(login: string, password: string) : Promise<boolean> {
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