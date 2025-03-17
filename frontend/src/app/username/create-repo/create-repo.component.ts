import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RepositoryService } from 'services/repository.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-create-repo',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './create-repo.component.html',
  styleUrls: ['./create-repo.component.css']
})
export class CreateRepoComponent {
  username = ''
  
  hasTypedRepoName = false
  repoNameIsValid = true
  checkingValidity = false
  validateNewName_Timeout!: any

  repoNameInputStyle = 'focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500'

  @ViewChild('myInput') myInput: ElementRef | undefined;

  constructor(
    private titleService: Title,
    private fb: FormBuilder,
    private repositoryService: RepositoryService,
    private route: ActivatedRoute,
    private router: Router) {
      
    this.titleService.setTitle('New repository');
  }

  createRepoForm = this.fb.group({
    repositoryName: [''],
    repositoryDescription: [''],
    visibility: ['public']
  })

  async ngOnInit() {
    this.username = this.route.snapshot.params['username']
  }

  async onSubmit() {
    if (!this.repoNameIsValid) {
      this.myInput?.nativeElement.focus()
    } else if (!this.createRepoForm.value.repositoryName) {
      this.repoNameIsValid = false
      this.hasTypedRepoName = true
      this.myInput?.nativeElement.focus()
    } else {
      const response = await this.repositoryService.createRepository(this.username, this.createRepoForm.value)
      if (response.ok) {
        var repo_route = this.createRepoForm.value.repositoryName.endsWith('.git') ? this.createRepoForm.value.repositoryName : this.createRepoForm.value.repositoryName + '.git'
        this.router.navigate([this.username, repo_route])
      } else {
        console.log('bad')
      }
    }
  }

  async validateRepoName() {
    if (this.validateNewName_Timeout)
      clearTimeout(this.validateNewName_Timeout)

    this.hasTypedRepoName = true
    this.checkingValidity = true

    if (this.createRepoForm.value.repositoryName) {
      const repoName = this.createRepoForm.value.repositoryName

      this.validateNewName_Timeout = setTimeout(async () => {
        const newName = repoName?.includes('.git') ? repoName : repoName + '.git'
        const repoInfo = await this.repositoryService.getRepositoryInfo(this.username, newName)
        if (repoInfo) {
          this.repoNameIsValid = false
          this.repoNameInputStyle = 'bg-red-50 border border-red-500 focus:border-red-700 focus:ring-red-700 dark:border-red-500 dark:focus:border-red-700 dark:focus:ring-red-700'
        } else {
          this.repoNameIsValid = true
          this.repoNameInputStyle = 'bg-green-50 border border-green-500 focus:border-green-700 focus:ring-green-700 dark:border-green-500 dark:focus:border-green-700 dark:focus:ring-green-700'
        }
        this.checkingValidity = false
      }, 500)
    }
  }
}
