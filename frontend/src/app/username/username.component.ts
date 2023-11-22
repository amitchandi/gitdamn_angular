import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from 'services/user.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-username',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './username.component.html',
  styleUrls: ['./username.component.css']
})
export class UsernameComponent {
  isLoaded: boolean = false
  username: string = ''
  repos: RepositoryObject[] = []
  
  userService: UserService = inject(UserService)

  constructor(private route: ActivatedRoute, private router: Router) {}

  async ngOnInit() {
    this.username = this.route.snapshot.paramMap.get('username') ?? ''
    
    const response = await this.userService.getUserRepos(this.username)
    if (response.ok) {
      this.repos = await response.json()
      this.isLoaded = true
    } else {
      this.router.navigateByUrl('/notfound')
    }
  }
}

export interface RepositoryObject {
  name: string;
  isDirectory: boolean;
}