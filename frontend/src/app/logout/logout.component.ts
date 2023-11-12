import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { AuthService } from '../auth.service'
import { Router } from '@angular/router'

import { ButtonModule } from 'primeng/button'

@Component({
  standalone: true,
  imports: [CommonModule, ButtonModule],
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.css']
})
export class LogoutComponent {
  constructor(private authService: AuthService, private router: Router) { }

  isLoggedIn(): boolean {
    return this.authService.isUserLoggedIn
  }
  
  logout() {
    this.authService.logout()
    this.router.navigate(['/'])
  }
}