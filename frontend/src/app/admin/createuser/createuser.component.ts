import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { UserService } from 'services/user.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-createuser',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ToastModule],
  templateUrl: './createuser.component.html',
  styleUrls: ['./createuser.component.css'],
  providers: [MessageService]
})
export class CreateuserComponent {
  userService: UserService = inject(UserService)

  constructor(private fb: FormBuilder, private messageService: MessageService) {}

  createUserForm = this.fb.group({
    email: [''],
    username: [''],
    role: [''],
    password: ['']
  })

  async onSubmit() {
    const response = await this.userService.registerUser(this.createUserForm.value)
    
    if (response.ok) {
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'User Created' });
    } else {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error creating user' });
    }
    
    this.createUserForm.reset()
  }
}
