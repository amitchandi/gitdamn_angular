import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from 'services/user.service';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent {
  users: any[] = [];
  
  userService: UserService = inject(UserService);

  constructor(private authService: AuthService) {
    console.log(authService.isUserLoggedIn)
  }

  ngOnInit() {
    this.userService.getUsers().then(users => this.users = users);
  }
}
