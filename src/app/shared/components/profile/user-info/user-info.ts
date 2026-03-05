import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { UserAvatarComponent } from '../user-avatar/user-avatar';

/**
 * @component UserInfoComponent
 * @description Muestra la información personal de un usuario de speedrun.com:
 * avatar, nombre con color, pronombres, nacionalidad, fecha de registro,
 * última actividad y redes sociales.
 *
 * @example
 * <app-user-info [user]="userData"></app-user-info>
 */
@Component({
  selector: 'app-user-info',
  standalone: true,
  imports: [CommonModule, UserAvatarComponent],
  templateUrl: './user-info.html',
  styleUrls: ['./user-info.css']
})
export class UserInfoComponent implements OnInit {

  /** Objeto usuario devuelto por la API de speedrun.com. */
  @Input() user: any = null;

  /** Fecha de la run más reciente del usuario (última actividad). */
  lastActivity: string | null = null;

  private readonly API = 'https://www.speedrun.com/api/v1';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.user?.id) this.fetchLastActivity(this.user.id);
  }

  /**
   * @method fetchLastActivity
   * @description Obtiene la run más reciente del usuario para
   * calcular su última actividad.
   * @param {string} userId
   */
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

  /**
   * @method getNameStyle
   * @description Devuelve el estilo CSS del nombre según `name-style` de la API.
   * Soporta `solid` y `gradient`.
   * @returns {any} Objeto de estilos para `[ngStyle]`.
   */
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
        background:              `linear-gradient(90deg, ${from}, ${to})`,
        '-webkit-background-clip': 'text',
        '-webkit-text-fill-color': 'transparent',
        'background-clip':         'text'
      };
    }

    return {};
  }

  /**
   * @method getCountry
   * @returns {string}
   */
  getCountry(): string {
    return this.user?.location?.country?.names?.international ?? null;
  }

  /**
   * @method getCountryFlag
   * @description Devuelve el emoji de bandera a partir del código de país ISO 3166-1.
   * @returns {string}
   */
  getCountryFlag(): string {
    const code = this.user?.location?.country?.code;
    if (!code) return '';
    return code.toUpperCase().replace(/./g, (c: string) =>
      String.fromCodePoint(127397 + c.charCodeAt(0))
    );
  }

  /**
   * @method getSignupDate
   * @returns {string}
   */
  getSignupDate(): string {
    const date = this.user?.signup;
    if (!date) return 'Desconocida';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  /**
   * @method getLastActivityLabel
   * @description Devuelve una etiqueta legible de la última actividad.
   * @returns {string}
   */
  getLastActivityLabel(): string {
    if (!this.lastActivity) return 'Sin actividad reciente';
    const diff = Date.now() - new Date(this.lastActivity).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Activo hoy';
    if (days === 1) return 'Hace 1 día';
    if (days < 30)  return `Hace ${days} días`;
    const months = Math.floor(days / 30);
    if (months < 12) return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
    const years = Math.floor(months / 12);
    return `Hace ${years} ${years === 1 ? 'año' : 'años'}`;
  }

  /**
   * @method getSocialLinks
   * @description Devuelve las redes sociales disponibles del usuario.
   * @returns {{ label: string; icon: string; url: string }[]}
   */
  getSocialLinks(): { label: string; favicon: string; url: string }[] {
    const links = [];
    if (this.user?.twitch?.uri)  links.push({ label: 'Twitch',  favicon: 'https://www.google.com/s2/favicons?domain=twitch.tv&sz=16',  url: this.user.twitch.uri });
    if (this.user?.youtube?.uri) links.push({ label: 'YouTube', favicon: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=16', url: this.user.youtube.uri });
    if (this.user?.twitter?.uri) links.push({ label: 'Twitter', favicon: 'https://www.google.com/s2/favicons?domain=twitter.com&sz=16', url: this.user.twitter.uri });
    if (this.user?.weblink)      links.push({ label: 'Perfil',  favicon: 'https://www.google.com/s2/favicons?domain=speedrun.com&sz=16', url: this.user.weblink });
    return links;
  }

  /**
   * @method getRole
   * @returns {string}
   */
  getRole(): string {
    const roles: Record<string, string> = {
      admin:     'Administrador',
      moderator: 'Moderador',
      user:      'Usuario',
      banned:    'Baneado'
    };
    return roles[this.user?.role] ?? this.user?.role ?? 'Usuario';
  }
}