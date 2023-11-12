import { Injectable } from '@angular/core'
import { environment } from 'src/environments/environment'

@Injectable({
   providedIn: 'root'
})
export class AuthService {
   isUserLoggedIn: boolean = false
   userId: string = ''

   async login(username: string, password: string) : Promise<boolean> {
      console.log(username)
      console.log(password)

      const response = await fetch(`${environment.apiUrl}/users/login/${username}/${password}`,
      {
         method: 'POST',
         cache: 'no-cache'
      })

      if (response.ok) {
         const json = await response.json()
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

   constructor() {
      const userId = localStorage.getItem('userId')
      const isUserLoggedIn = localStorage.getItem('isUserLoggedIn')
      if (userId && isUserLoggedIn) {
         this.userId = userId
         this.isUserLoggedIn = isUserLoggedIn === 'true'
      }
   }
}