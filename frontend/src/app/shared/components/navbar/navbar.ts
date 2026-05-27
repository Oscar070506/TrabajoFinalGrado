import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Trophy, Target, User, LogOut, Eye, EyeOff} from 'lucide-angular';
import { AuthService } from '../../../core/services/auth';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit, OnDestroy {
  menuOpen: boolean = false;
  userMenuOpen: boolean = false;
  currentUser: any = null;

  daltonismActive = false;
  
  Eye = Eye;
  EyeOff = EyeOff;

  readonly Trophy = Trophy;
  readonly Target = Target;
  readonly User   = User;
  readonly LogOut = LogOut;

  private userSub!: Subscription;

  constructor(private auth: AuthService) {}

  ngOnInit(): void {

    const saved = localStorage.getItem('daltonism');
    
    if (saved === 'true') {
      this.daltonismActive = true;
      document.body.classList.add('daltonism');
    }

    this.userSub = this.auth.user$.subscribe(user => {
      this.currentUser = user;
    });
  }

  ngOnDestroy(): void {
    this.userSub.unsubscribe();
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  logout(): void {
    this.userMenuOpen = false;
    this.auth.logout();
  }


  toggleDaltonism(): void {
    this.daltonismActive = !this.daltonismActive;
    document.body.classList.toggle('daltonism', this.daltonismActive);
    localStorage.setItem('daltonism', String(this.daltonismActive));
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.userMenuOpen = false;
    }
  }
}