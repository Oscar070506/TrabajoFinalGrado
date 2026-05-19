import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth';

function passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
  const pw  = form.get('password')?.value;
  const pw2 = form.get('repeatPassword')?.value;
  return pw === pw2 ? null : { passwordMismatch: true };
}

function noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
  return (control.value ?? '').trim().length === 0 ? { whitespace: true } : null;
}

function noSpacesValidator(control: AbstractControl): ValidationErrors | null {
  return /\s/.test(control.value ?? '') ? { hasSpaces: true } : null;
}

function strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
  const v = control.value ?? '';
  if (!/[A-Z]/.test(v))    return { noUppercase: true };
  if (!/[0-9]/.test(v))    return { noNumber: true };
  return null;
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
  serverError = '';
  loading     = false;

  constructor(
    private fb:     FormBuilder,
    private router: Router,
    private auth:   AuthService
  ) {
    this.registerForm = this.fb.group(
      {
        username: ['', [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(20),
          noWhitespaceValidator,
          noSpacesValidator,
          Validators.pattern(/^[a-zA-Z0-9_\-]+$/)   
        ]],
        email: ['', [
          Validators.required,
          Validators.email,
          Validators.maxLength(100)
        ]],
        password: ['', [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(72),   
          strongPasswordValidator
        ]],
        repeatPassword: ['', [Validators.required]]
      },
      { validators: passwordMatchValidator }
    );
  }

  get username()       { return this.registerForm.get('username')!; }
  get email()          { return this.registerForm.get('email')!; }
  get password()       { return this.registerForm.get('password')!; }
  get repeatPassword() { return this.registerForm.get('repeatPassword')!; }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.serverError = '';
    this.loading     = true;

    const { username, email, password } = this.registerForm.value;

    this.auth.register({ username, email, password }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/game']);
      },
      error: (err) => {
        this.loading     = false;
        this.serverError = err.error?.error ?? 'Error al registrarse. Inténtalo de nuevo.';
      }
    });
  }
}