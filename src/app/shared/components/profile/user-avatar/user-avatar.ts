import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * @component UserAvatarComponent
 * @description Muestra el avatar circular de un usuario de speedrun.com.
 * Si no hay imagen disponible muestra un placeholder con la inicial del nombre.
 *
 * @example
 * <app-user-avatar [user]="userData"></app-user-avatar>
 */
@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-avatar.html',
  styleUrls: ['./user-avatar.css']
})
export class UserAvatarComponent {

  /** Objeto usuario devuelto por la API de speedrun.com. */
  @Input() user: any = null;

  /** Tamaño del avatar en píxeles. Por defecto 96px. */
  @Input() size: number = 96;

  /**
   * @method getAvatarUrl
   * @description Devuelve la URL del avatar desde `assets.image.uri`.
   * @returns {string | null}
   */
  getAvatarUrl(): string | null {
    return this.user?.assets?.image?.uri ?? null;
  }

  /**
   * @method getInitial
   * @description Devuelve la inicial del nombre para el placeholder.
   * @returns {string}
   */
  getInitial(): string {
    const name = this.user?.names?.international ?? this.user?.names?.japanese ?? '?';
    return name.charAt(0).toUpperCase();
  }
}