import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

function passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
  const password       = form.get('password')?.value;
  const repeatPassword = form.get('repeatPassword')?.value;
  return password === repeatPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {

  registerForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
    this.registerForm = this.fb.group(
      {
        username:       ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
        email:          ['', [Validators.required, Validators.email]],
        password:       ['', [Validators.required, Validators.minLength(6)]],
        repeatPassword: ['', [Validators.required]]
      },
      { validators: passwordMatchValidator }  // validador a nivel de formulario
    );
  }

  get username()       { return this.registerForm.get('username')!; }
  get email()          { return this.registerForm.get('email')!; }
  get password()       { return this.registerForm.get('password')!; }
  get repeatPassword() { return this.registerForm.get('repeatPassword')!; }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    const { username, email } = this.registerForm.value;

    this.router.navigate(['/login']);
  }
}