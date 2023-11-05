import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from 'services/user.service';
import { MatIconModule } from '@angular/material/icon';

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

  constructor() {}

  ngOnInit() {
    this.userService.getUsers().then(users => this.users = users);
  }
}
