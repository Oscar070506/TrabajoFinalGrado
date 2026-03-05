import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

/**
 * @component UserFullGameRunsComponent
 * @description Muestra las personal bests de full game del usuario
 * agrupadas por juego, con el background del juego como fondo oscurecido.
 */
@Component({
  selector: 'app-user-level-runs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-level-runs.html',
  styleUrls: ['./user-level-runs.css']
})
export class UserLevelRuns implements OnInit {

  @Input() userId: string = '';

  groupedGames: { game: any; runs: any[] }[] = [];
  loading: boolean = false;
  error: string | null = null;

  private readonly API = 'https://www.speedrun.com/api/v1';

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (this.userId) this.fetchRuns();
  }

  fetchRuns(): void {
    this.loading = true;
    this.error   = null;

    // embed=game.assets para obtener background y cover, y category para el nombre
    this.http.get<any>(`${this.API}/users/${this.userId}/personal-bests`, {
      params: { embed: 'game,category' }
    }).subscribe({
      next: res => {
        const data = (res.data ?? []).filter((d: any) => !!d.run?.level);
        this.groupedGames = this.groupByGame(data);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        this.error   = `Error ${err.status}: ${err.message}`;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private groupByGame(data: any[]): { game: any; runs: any[] }[] {
    const map = new Map<string, { game: any; runs: any[] }>();

    for (const entry of data) {
      // Con embed=game, los datos del juego vienen en entry.run.game.data
      const game   = entry.run?.game?.data ?? null;
      const gameId = game?.id ?? entry.run?.game ?? 'unknown';

      if (!map.has(gameId)) {
        map.set(gameId, { game, runs: [] });
      }
      map.get(gameId)!.runs.push(entry);
    }

    return [...map.values()];
  }

  getBackground(game: any): string {
    return game?.assets?.background?.uri ?? '';
  }

  getCover(game: any): string {
    return game?.assets?.['cover-small']?.uri
        ?? game?.assets?.['cover-medium']?.uri
        ?? 'assets/imgs/no-cover.png';
  }

  getGameName(game: any): string {
    return game?.names?.international ?? 'Desconocido';
  }

  /**
   * @method getCategoryName
   * @description Con embed=category los datos vienen en entry.run.category.data.name
   */
  getCategoryName(entry: any): string {
    return entry.run?.category?.data?.name ?? '—';
  }

  getTime(entry: any): string {
    const t = entry.run?.times?.primary_t;
    if (!t) return '—';
    return new Date(t * 1000).toISOString().substring(11, 19);
  }

  getDate(entry: any): string {
    const d = entry.run?.date;
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  /**
   * @method getTrophy
   * @param {number} index - Posición global (base 0).
   * @returns {string | null}
   */
  getTrophy(index: number): string | null {
    if (index === 0) return 'https://www.speedrun.com/images/1st.png';
    if (index === 1) return 'https://www.speedrun.com/images/2nd.png';
    if (index === 2) return 'https://www.speedrun.com/images/3rd.png';
    return null;
  }

  openVideo(entry: any): void {
    const url = entry.run?.videos?.links?.[0]?.uri;
    if (url) window.open(url, '_blank', 'width=900,height=540,left=200,top=200');
  }

  isEmulated(entry: any): boolean {
    return entry.run?.system?.emulated ?? false;
  }
}