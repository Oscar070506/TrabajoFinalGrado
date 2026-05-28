import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { UserAvatarComponent } from '../user-avatar/user-avatar';
import { LucideAngularModule, Calendar, Clock, Twitch, Youtube, Twitter, Globe } from 'lucide-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-user-info',
  standalone: true,
  imports: [CommonModule, UserAvatarComponent, LucideAngularModule, TranslateModule],
  templateUrl: './user-info.html',
  styleUrls: ['./user-info.css']
})
export class UserInfoComponent implements OnInit {
  @Input() user: any = null;
  lastActivity: string | null = null;

  readonly Calendar = Calendar;
  readonly Clock    = Clock;
  readonly Twitch   = Twitch;
  readonly Youtube  = Youtube;
  readonly Twitter  = Twitter;
  readonly Globe    = Globe;

  private readonly API = 'https://www.speedrun.com/api/v1';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    if (this.user?.id) this.fetchLastActivity(this.user.id);
  }

  fetchLastActivity(userId: string): void {
    this.http.get<any>(`${this.API}/runs`, {
      params: { user: userId, orderby: 'date', direction: 'desc', max: 1 }
    }).subscribe({
      next: res => {
        const run  = res.data?.[0];
        const date = run?.date ?? run?.submitted;
        this.lastActivity = date ?? null;
        this.cdr.detectChanges();
      },
      error: () => { this.lastActivity = null; }
    });
  }

  getNameStyle(): any {
    const style = this.user?.['name-style'];
    if (!style) return {};
    if (style.style === 'solid') {
      return { color: style.color?.light ?? 'var(--text-primary)' };
    }
    if (style.style === 'gradient') {
      const from = style['color-from']?.light ?? '#fff';
      const to   = style['color-to']?.light   ?? '#fff';
      return {
        background:                `linear-gradient(90deg, ${from}, ${to})`,
        '-webkit-background-clip': 'text',
        '-webkit-text-fill-color': 'transparent',
        'background-clip':         'text'
      };
    }
    return {};
  }

  getCountry(): string {
    return this.user?.location?.country?.names?.international ?? null;
  }

  getCountryFlag(): string {
    const code = this.user?.location?.country?.code;
    if (!code) return '';
    return code.toUpperCase().replace(/./g, (c: string) =>
      String.fromCodePoint(127397 + c.charCodeAt(0))
    );
  }

  getSignupDate(): string {
    const date = this.user?.signup;
    if (!date) return this.translate.instant('USER.UNKNOWN_DATE');
    const lang = this.translate.currentLang || 'es';
    const localeMap: Record<string, string> = {
      es: 'es-ES',
      en: 'en-US',
      cn: 'zh-CN'
    };
    return new Date(date).toLocaleDateString(localeMap[lang] || 'es-ES', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  getLastActivityLabel(): string {
    if (!this.lastActivity) return this.translate.instant('USER.NO_ACTIVITY');
    const diff = Date.now() - new Date(this.lastActivity).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return this.translate.instant('USER.ACTIVITY.TODAY');
    if (days === 1) return this.translate.instant('USER.ACTIVITY.ONE_DAY');
    if (days < 30)  return this.translate.instant('USER.ACTIVITY.DAYS', { days });
    const months = Math.floor(days / 30);
    if (months < 12) return this.translate.instant('USER.ACTIVITY.MONTHS', { months });
    const years = Math.floor(months / 12);
    return this.translate.instant('USER.ACTIVITY.YEARS', { years });
  }

  getSocialLinks(): { label: string; icon: any; url: string }[] {
    const links = [];
    if (this.user?.twitch?.uri)  links.push({ label: 'Twitch',   icon: this.Twitch,  url: this.user.twitch.uri });
    if (this.user?.youtube?.uri) links.push({ label: 'YouTube',  icon: this.Youtube, url: this.user.youtube.uri });
    if (this.user?.twitter?.uri) links.push({ label: 'Twitter',  icon: this.Twitter, url: this.user.twitter.uri });
    if (this.user?.weblink)      links.push({ label: this.translate.instant('USER.PROFILE'), icon: this.Globe, url: this.user.weblink });
    return links;
  }

  getRole(): string {
    const roleKey = this.user?.role;
    if (!roleKey) return this.translate.instant('USER.ROLES.USER');
    const validRoles = ['admin', 'moderator', 'user', 'banned'];
    if (validRoles.includes(roleKey)) {
      return this.translate.instant(`USER.ROLES.${roleKey.toUpperCase()}`);
    }
    return roleKey;
  }
}