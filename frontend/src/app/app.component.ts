import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterOutlet, RouterModule } from '@angular/router'
import { UsersComponent } from './users/users.component'
import { LogoutComponent } from './logout/logout.component'
import { DialogModule } from 'primeng/dialog'
import { ButtonModule } from 'primeng/button'
import { LoginComponent } from './login/login.component'
import { AuthService } from './auth.service'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, UsersComponent, RouterModule, LogoutComponent, DialogModule, ButtonModule, LoginComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'frontend'

  constructor(private authService: AuthService) {}

  isAuthenticated() {
    return this.authService.isUserLoggedIn
  }
}
