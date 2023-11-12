import { Routes } from '@angular/router';
import { UsersComponent } from './users/users.component';
import { UsernameComponent } from './username/username.component';
import { RepositoryComponent } from './repository/repository.component';
import { AdminComponent } from './admin/admin.component';
import { HomepageComponent } from './homepage/homepage.component';
import { CreateuserComponent } from './admin/createuser/createuser.component';
import { CommitComponent } from './commit/commit.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
    { path: '', component: HomepageComponent },
    {
      path: 'admin',
      canActivateChild: [authGuard],
      children: [
        { path: '', component: AdminComponent },
        { path: 'register', component: CreateuserComponent }
      ]
    },
    { path: 'users', component: UsersComponent, canActivate: [authGuard] },
    { path: ':username', component: UsernameComponent },
    { path: ':username/:reponame',
      children: [
        { path: 'commit', component: CommitComponent },
        { path: '**', component: RepositoryComponent },
      ]
    },
];
