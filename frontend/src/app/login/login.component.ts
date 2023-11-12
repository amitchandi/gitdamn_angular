import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

import { DialogModule } from 'primeng/dialog'
import { ButtonModule } from 'primeng/button'

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, DialogModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  visible: boolean = false

  loginForm = this.fb.group({
    username: [''],
    password: ['']
  })

  constructor(private authService: AuthService, private router: Router, private fb: FormBuilder) { }

  showDialog() {
    this.visible = true
  }

  async onClickSubmit() {
    const { username, password } = this.loginForm.value

    const success = await this.authService.login(username as string, password as string)
    if (success) {
      this.router.navigate(['/admin'])
      this.visible = false
    }
    else
      console.log('login failed')
  }
}