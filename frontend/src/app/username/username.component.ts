import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from 'services/user.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { RepositoryService } from 'services/repository.service';
import { formatDistance } from 'date-fns';

@Component({
  selector: 'app-username',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './username.component.html',
  styleUrls: ['./username.component.css']
})
export class UsernameComponent {
  username: string = ''

  isLoaded: boolean = false
  repos: RepositoryObject[] = []
  
  userService: UserService = inject(UserService)
  repositoryService: RepositoryService = inject(RepositoryService)

  constructor(private route: ActivatedRoute, private router: Router) {}

  async ngOnInit() {
    this.username = this.route.snapshot.paramMap.get('username') ?? ''
    
    const response = await this.userService.getUserRepos(this.username)
    if (response.ok) {
      this.repos = await response.json()
      this.isLoaded = true
      
      for (let i = 0; i < this.repos.length; i++) {
        const repo = this.repos[i]
        const latestCommit = await this.repositoryService.getRepositoryLatestCommitInfo(this.username, repo.name)
        if (latestCommit.date)
          repo.lastCommitDate = formatDistance(new Date(latestCommit.date), new Date(), { addSuffix: true })
        else
          repo.lastCommitDate = 'never'
      }
    } else {
      this.router.navigateByUrl('/notfound')
    }
  }
}

export interface RepositoryObject {
  _id: string;
  name: string;
  owner: string;
  accessList: UserPermission[];
  visibility: string;
  lastCommitDate: string;
}

export interface UserPermission {
  permission: string;
  username: string;
}