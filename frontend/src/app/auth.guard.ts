import { CanActivateFn, Router } from '@angular/router'
import { AuthService } from './auth.service'
import { inject } from '@angular/core'

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService)
  if (authService.isUserLoggedIn) {
    return authService.verifyAuthorization()
  }

  return inject(Router).navigateByUrl('/')
}