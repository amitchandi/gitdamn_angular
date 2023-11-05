import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { RepositoryService } from 'services/repository.service';

@Component({
  selector: 'app-commit',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './commit.component.html',
  styleUrls: ['./commit.component.css']
})
export class CommitComponent {
  username: string = ''
  repositoryName: string = ''
  commitHash: string = ''
  subject: string | undefined
  lastCommitDate: string | undefined
  abbreviatedCommit: string | undefined
  latestCommitInfo: any | undefined

  repositoryService: RepositoryService = inject(RepositoryService)

  constructor(
    private route: ActivatedRoute,
  ) {}

  async ngOnInit() {
    this.username = this.route.snapshot.params['username']
    this.repositoryName = this.route.snapshot.params['reponame']

    this.latestCommitInfo = await this.repositoryService.getRepositoryLatestCommitInfo(this.username, this.repositoryName, this.commitHash)
    console.log(this.latestCommitInfo)
  }
}
