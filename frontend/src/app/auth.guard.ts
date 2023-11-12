import { CanActivateFn, Router } from '@angular/router'
import { AuthService } from './auth.service'
import { inject } from '@angular/core'

export const authGuard: CanActivateFn = (route, state) => {
  if (inject(AuthService).isUserLoggedIn)
    return true
  else
    return inject(Router).navigateByUrl('/')
}
