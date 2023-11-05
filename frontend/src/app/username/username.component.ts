import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
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

  constructor(private route: ActivatedRoute) {}

  async ngOnInit() {
    this.username = this.route.snapshot.paramMap.get('username') ?? ''
    
    const repos = await this.userService.getUserRepos(this.username)
    this.repos = repos
    this.isLoaded = true
  }
}

export interface RepositoryObject {
  name: string;
  isDirectory: boolean;
}