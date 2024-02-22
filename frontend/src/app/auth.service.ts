import { Injectable } from '@angular/core'
import { environment } from 'src/environments/environment'

@Injectable({
   providedIn: 'root'
})
export class AuthService {
   isUserLoggedIn: boolean = false
   userId: string = ''
   
   constructor() {
      const userId = localStorage.getItem('userId')
      const isUserLoggedIn = localStorage.getItem('isUserLoggedIn')
      if (userId && isUserLoggedIn) {
         this.userId = userId
         this.isUserLoggedIn = isUserLoggedIn === 'true'
      }
   }

   async login(username: string, password: string) : Promise<boolean> {
      const url = `${environment.apiUrl}/auth/login`
      const options: RequestInit = {
         method: 'POST',
         cache: 'no-cache',
         headers: {
            'Content-Type': 'application/json'
         },
         credentials: 'include',
         body: JSON.stringify({
            username: username,
            password: password
         })
      }
      const response = await fetch(url, options)

      if (response.ok) {
         const json = await response.json()
         console.log(response.headers)
         this.userId = json._id
         this.isUserLoggedIn = true
         localStorage.setItem('isUserLoggedIn', this.isUserLoggedIn ? 'true' : 'false')
         localStorage.setItem('userId', this.userId)
         return true
      } else {
         console.log('Login Failed: ' + await response.json())
         return false
      }
   }

   logout(): void {
      this.isUserLoggedIn = false;
      localStorage.removeItem('isUserLoggedIn')
      localStorage.removeItem('userId')
   }

   async verifyAuthorization() {
      const url = `${environment.apiUrl}/auth/verify`
      const options: RequestInit = {
         method: 'GET',
         cache: 'no-cache',
         headers: {
            'Content-Type': 'application/json'
         },
         credentials: 'include'
      }
      const response = await fetch(url, options)
      
      return response.ok
   }
}