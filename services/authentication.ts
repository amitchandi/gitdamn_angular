export default async function authenticate(login: string, password: string) : Promise<boolean> {
   const url = `${process.env.API_URI}/users/validateCredentials/${login}/${password}`
   const options: RequestInit =  {
      method: 'POST',
      cache: 'no-cache'
   }
   const response = await fetch(url, options)
   if (!response.ok)
      console.log('Login Failed: ' + await response.json())
   return response.ok
}