import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuItem } from 'primeng/api/menuitem';
import { TabMenuModule  } from 'primeng/tabmenu';
import { ActivatedRoute } from '@angular/router';
import { RepositoryService } from 'services/repository.service';

@Component({
  selector: 'app-repository-menu',
  standalone: true,
  imports: [
    CommonModule,
    TabMenuModule,
  ],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent {
  username: string = ''
  repositoryName: string = ''

  items: MenuItem[] | undefined
  activeItem: MenuItem | undefined
  @Input() index = 0;

  constructor(
    private route: ActivatedRoute,
  ) {}

  async ngOnInit() {
    this.username = this.route.snapshot.params['username']
    this.repositoryName = this.route.snapshot.params['reponame']

    this.items = [
        {
          label: 'Code',
          icon: 'pi pi-fw pi-code',
          url: `/${this.username}/${this.repositoryName}/`,
          target: '_self'
        },
        { 
          label: 'Settings',
          icon: 'pi pi-fw pi-cog',
          url: `/${this.username}/${this.repositoryName}/settings`,
          target: '_self'
        }
    ];

    this.activeItem = this.items[this.index]
  }

  onActiveItemChange(event: MenuItem) {
      this.activeItem = event;
  }
}
