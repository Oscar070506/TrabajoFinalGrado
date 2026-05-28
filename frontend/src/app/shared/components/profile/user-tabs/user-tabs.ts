import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserFullGameRuns } from '../user-full-game-runs/user-full-game-runs';
import { UserLevelRuns } from '../user-level-runs/user-level-runs';
import { UserAbout } from '../user-about/user-about';
import { TranslateModule } from '@ngx-translate/core';
/**
 * @component UserTabsComponent
 * @description Barra de pestañas del perfil de usuario.
 * Controla qué subcomponente se muestra según la pestaña activa.
 *
 * @example
 * <app-user-tabs [userId]="user.id"></app-user-tabs>
 */
@Component({
  selector: 'app-user-tabs',
  standalone: true,
  imports: [CommonModule, UserFullGameRuns, UserLevelRuns, UserAbout, TranslateModule],
  templateUrl: './user-tabs.html',
  styleUrls: ['./user-tabs.css']
})
export class UserTabsComponent {

  @Input() isLocal: boolean = false;

  /** ID del usuario para pasarlo a cada subcomponente. */
  @Input() userId: string = '';

  activeTab: string = 'full-game-runs';

  /**
   * @method setTab
   * @param {string} tab
   */
  setTab(tab: string): void {
    this.activeTab = tab;
  }
}