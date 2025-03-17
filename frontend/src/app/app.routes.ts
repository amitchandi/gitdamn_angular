import { Routes } from '@angular/router';
import { UsersComponent } from './users/users.component';
import { UsernameComponent } from './username/username.component';
import { RepositoryComponent } from './repository/repository.component';
import { AdminComponent } from './admin/admin.component';
import { HomepageComponent } from './homepage/homepage.component';
import { CreateuserComponent } from './admin/createuser/createuser.component';
import { CommitComponent } from './commit/commit.component';
import { authGuard } from './auth.guard';
import { SettingsComponent } from './admin/settings/settings.component';
import { NotfoundComponent } from './notfound/notfound.component';
import { SettingsComponent as RepoSettings } from './repository/settings/settings.component'
import { CreateRepoComponent } from './username/create-repo/create-repo.component';

export const routes: Routes = [
    { path: '', component: HomepageComponent },
    { path: 'notfound', component: NotfoundComponent },
    {
      path: 'admin',
      canActivateChild: [authGuard],
      children: [
        { path: '', component: AdminComponent },
        { path: 'register', component: CreateuserComponent },
        { path: 'settings', component: SettingsComponent },
        { path: '**', redirectTo: '' }
      ]
    },
    {
      path: 'users',
      canActivateChild: [authGuard],
      children: [
        { path: '', component: UsersComponent },
        { path: '**', redirectTo: '' }
      ]
    },
    { path: ':username', component: UsernameComponent, canActivate: [authGuard] },
    { path: ':username/new', component: CreateRepoComponent, canActivate: [authGuard] },
    { 
      path: ':username/:reponame',
      canActivateChild: [authGuard],
      children: [
        { path: 'commit', component: CommitComponent },
        { path: 'settings', component: RepoSettings },
        { path: '**', component: RepositoryComponent },
      ]
    },
];
