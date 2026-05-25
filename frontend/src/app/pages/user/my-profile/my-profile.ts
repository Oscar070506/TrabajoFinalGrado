import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserInfoComponent } from '../../../shared/components/profile/user-info/user-info';
import { UserTabsComponent } from '../../../shared/components/profile/user-tabs/user-tabs';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, UserInfoComponent, UserTabsComponent],
  templateUrl: './my-profile.html',
  styleUrls: ['./my-profile.css']
})
export class MyProfileComponent implements OnInit {
  user: any = null;
  loading: boolean = false;
  error: string | null = null;

  constructor(
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const localUser = this.auth.getUser();
    console.log(this.user)
    if (!localUser) {
      this.error = 'No has iniciado sesión.';
      return;
    }

    this.user = {
      id: localUser.id ?? 'local',
      names: {
        international: localUser.username,
        japanese: null,
        twitch: localUser.username
      },
      pronouns: null,
      weblink: null,
      role: 'user',
      signup: localUser.created_at ?? new Date().toISOString(),
      location: null,
      twitch: null,
      hitbox: null,
      youtube: null,
      twitter: null,
      assets: {
        icon:          { uri: null },
        image:         { uri: null },
        'cover-medium': { uri: null },
        'cover-small':  { uri: null }
      },
      'name-style': {
        style: 'solid',
        color: {
          light: localUser.favoriteColor ?? 'var(--accent)',
          dark:  localUser.favoriteColor ?? 'var(--accent)'
        }
      }
    };

    this.cdr.detectChanges();
  }
}