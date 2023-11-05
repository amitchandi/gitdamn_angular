import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreateuserComponent } from './createuser/createuser.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, CreateuserComponent],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent {

}
