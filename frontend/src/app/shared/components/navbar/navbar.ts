import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Trophy, Target, User, LogOut, ChevronDown } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth';
import { Subscription } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DaltonismFilterComponent } from '../filters/daltonism-filter/daltonism-filter';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterModule, LucideAngularModule, TranslateModule, DaltonismFilterComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit, OnDestroy {
  menuOpen = false;
  userMenuOpen = false;
  currentUser: any = null;
  langMenuOpen = false;
  currentLang = 'es';

  readonly ChevronDown = ChevronDown;
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