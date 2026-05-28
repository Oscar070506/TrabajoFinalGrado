import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Trophy, Target, User, LogOut, Eye, EyeOff, ChevronDown } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth';
import { Subscription } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterModule, LucideAngularModule, TranslateModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit, OnDestroy {
  menuOpen = false;
  userMenuOpen = false;
  currentUser: any = null;
  daltonismActive = false;
  langMenuOpen = false;
  currentLang = 'es';

  Eye = Eye;
  EyeOff = EyeOff;
  ChevronDown = ChevronDown;
  readonly Trophy = Trophy;
  readonly Target = Target;
  readonly User = User;
  readonly LogOut = LogOut;

  private userSub!: Subscription;

  constructor(
    private auth: AuthService,
    private translate: TranslateService
  ) {
    this.currentLang = this.translate.currentLang || 'es';
  }

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

  changeLang(lang: string): void {
    this.currentLang = lang;
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
    this.langMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.userMenuOpen = false;
    }
    if (!target.closest('.lang-menu')) {
      this.langMenuOpen = false;
    }
  }
}