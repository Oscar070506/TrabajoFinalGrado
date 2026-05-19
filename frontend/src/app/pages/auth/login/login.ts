import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {

  loginForm: FormGroup;
  serverError = '';
  loading     = false;

  constructor(
    private fb:     FormBuilder,
    private router: Router,
    private auth:   AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  get email()    { return this.loginForm.get('email')!; }
  get password() { return this.loginForm.get('password')!; }

  onSubmit(): void {
      if (this.loginForm.invalid) return;
      this.serverError = '';
      this.loading     = true;
      this.auth.login({
        email:    this.email.value,
        password: this.password.value
      }).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/game']);
        },
        error: (err) => {
          this.loading     = false;
          this.serverError = err.error?.error ?? 'Credenciales incorrectas.';
          this.cdr.detectChanges();
        }
    });
  }
}
