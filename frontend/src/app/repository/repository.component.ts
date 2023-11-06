import { Component, inject, HostListener  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CommitInfo, RepositoryService } from 'services/repository.service';
import { MatIconModule } from '@angular/material/icon';
import { HighlightService } from 'services/highlight.service';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { formatDistance } from 'date-fns';
import { ClipboardModule } from '@angular/cdk/clipboard'

@Component({
  selector: 'app-repository',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DropdownModule,
    FormsModule,
    TableModule,
    OverlayPanelModule,
    ButtonModule,
    InputTextModule,
    ClipboardModule
  ],
  templateUrl: './repository.component.html',
  styleUrls: ['./repository.component.css']
})
export class RepositoryComponent {
  isLoaded: boolean = false
  branch: string | undefined
  username: string = ''
  repositoryName: string = ''
  repositoryObjects: string[] = []
  repositoryData: RepositoryData | undefined
  currentBranch: string = 'main'
  branches: string[] = []
  branchesDD: any = []
  breadcrumbs: Breadcrumb[] = []
  isRoot: boolean = false
  currentRepositoryPath: string = ''
  previousRepositoryPath: string = ''
  currentRepositoryDirectory: string = ''
  latestCommitInfo: CommitInfo | undefined
  repositoryLink: string = ''

  repositoryService: RepositoryService = inject(RepositoryService)

  constructor(
    private route: ActivatedRoute,
    private highlightService: HighlightService,
    private router: Router
  ) {}

  async ngOnInit() {
    this.username = this.route.snapshot.params['username']
    this.repositoryName = this.route.snapshot.params['reponame']

    this.repositoryObjects = this.route.snapshot.url.map(urlSegment => urlSegment.path)
    this.isRoot = this.repositoryObjects.length === 0 || this.repositoryObjects.length === 2

    console.log(location.href)
    this.repositoryLink = location.href

    const branchSummary = await this.repositoryService.getBranches(this.username, this.repositoryName)

    this.currentBranch = branchSummary.current
    
    this.branches = branchSummary.all

    this.branchesDD = this.branches.map(e => {
      return {name: e, value: e}
    })

    if (!this.repositoryObjects.includes('tree')) {
      this.branch = this.currentBranch
      this.repositoryObjects.unshift(this.currentBranch)
      this.repositoryObjects.unshift('tree')
    } else {
      this.branch = this.repositoryObjects[1]
    }
    
    this.breadcrumbs.push({
      name: this.username,
      path: `/${this.username}`
    })

    this.breadcrumbs.push({
      name: this.repositoryName,
      path: `/${this.username}/${this.repositoryName}/tree/${this.currentBranch}`
    })

    let prevDir = `/${this.username}/${this.repositoryName}`

    const breadcrumbNames: string[] = [this.repositoryName]

    this.repositoryObjects.forEach(repo => {
      prevDir += `/${repo}`
      
      if (!(repo === 'tree' || repo === this.currentBranch)) {
        this.breadcrumbs.push({
          name: repo,
          path: prevDir
        })
        this.currentRepositoryDirectory = repo
      }
      breadcrumbNames.push(repo)
    })
    
    if (!this.currentRepositoryDirectory) {
      this.currentRepositoryDirectory = this.repositoryName
    }
    
    this.currentRepositoryPath = `${prevDir}`
    if (!this.isRoot) {
      const nodes = this.currentRepositoryPath.split('/')
      this.previousRepositoryPath = nodes.slice(0, nodes.length - 1).join('/')
    }
    
    const data = await this.repositoryService.getRepositoryData(this.username, breadcrumbNames)

    this.repositoryData = data

    if (this.repositoryData.type === 'folder') {
      this.repositoryData.body.sort(repoObject => repoObject.isDirectory ? -1 : 1).forEach(async (repoObject) => {
        let file = repoObject.name
        if (this.repositoryObjects.length > 2)
          file = this.repositoryObjects.filter(repoObject => repoObject !== 'tree' && repoObject !== this.branch).join('%2F') + '%2F' + repoObject.name
        
        const repositoryObjectLogInfo = await this.repositoryService.getRepositoryObjectInfo(this.username, this.repositoryName, this.branch as string, file)
        repoObject.message = repositoryObjectLogInfo[0]?.message
        
        if (repositoryObjectLogInfo[0]?.date)
          repoObject.date = formatDistance(new Date(repositoryObjectLogInfo[0]?.date), new Date(), { addSuffix: true })
      })
    }

    
    this.isLoaded = true

    this.latestCommitInfo = await this.repositoryService.getRepositoryLatestCommitInfo(this.username, this.repositoryName, this.branch)
    
    this.latestCommitInfo.date = formatDistance(new Date(this.latestCommitInfo.date), new Date(), { addSuffix: true })
  }

  ngAfterViewChecked() {
    this.highlightService.highlightAll()
  }

  async onClickBack() {
    await this.router.navigate([this.previousRepositoryPath])
    window.location.reload()
  }

  async onBranchDropDownChanged() {
    console.log(this.branch)
    const nodes = this.currentRepositoryPath.split('/')
    nodes[4] = this.branch as string
    await this.router.navigate([nodes.join('/')])
    window.location.reload()
  }

  // reload on browser back and forward buttons
  @HostListener('window:popstate', ['$event'])
  onPopState(event: any) {
    window.location.reload()
  }

}

export interface Breadcrumb {
  name: string;
  path: string;
}

export interface RepositoryData {
  type: string;
  body: any[];
}