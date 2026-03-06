import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * @component UserLevelRuns
 * @description Muestra las personal bests de level runs del usuario
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

    this.http.get<any>(`${this.API}/users/${this.userId}/personal-bests`).subscribe({
      next: res => {
        const data = (res.data ?? []).filter((d: any) => !!d.run?.level);
        if (data.length === 0) {
          this.groupedGames = [];
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }
        this.enrichData(data);
      },
      error: err => {
        this.error   = `Error ${err.status}: ${err.message}`;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private enrichData(data: any[]): void {
    const gameIds     = [...new Set(data.map((d: any) => d.run.game))];
    const categoryIds = [...new Set(data.map((d: any) => d.run.category))];
    const levelIds    = [...new Set(data.map((d: any) => d.run.level).filter(Boolean))];

    const gameCalls     = gameIds.map(id =>
      this.http.get<any>(`${this.API}/games/${id}`).pipe(catchError(() => of(null)))
    );
    const categoryCalls = categoryIds.map(id =>
      this.http.get<any>(`${this.API}/categories/${id}`).pipe(catchError(() => of(null)))
    );
    const levelCalls    = levelIds.map(id =>
      this.http.get<any>(`${this.API}/levels/${id}`).pipe(catchError(() => of(null)))
    );

    forkJoin([...gameCalls, ...categoryCalls, ...levelCalls]).subscribe({
      next: results => {
        const gameMap:     Record<string, any> = {};
        const categoryMap: Record<string, any> = {};
        const levelMap:    Record<string, any> = {};

        results.slice(0, gameIds.length).forEach((r, i) => {
          if (r?.data) gameMap[gameIds[i]] = r.data;
        });
        results.slice(gameIds.length, gameIds.length + categoryIds.length).forEach((r, i) => {
          if (r?.data) categoryMap[categoryIds[i]] = r.data;
        });
        results.slice(gameIds.length + categoryIds.length).forEach((r, i) => {
          if (r?.data) levelMap[levelIds[i]] = r.data;
        });

        const enriched = data.map((d: any) => ({
          ...d,
          gameData:     gameMap[d.run.game]         ?? null,
          categoryData: categoryMap[d.run.category] ?? null,
          levelData:    levelMap[d.run.level]        ?? null
        }));

        this.groupedGames = this.groupByGame(enriched);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        this.error   = `Error cargando detalles: ${err.message}`;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private groupByGame(data: any[]): { game: any; runs: any[] }[] {
    const map = new Map<string, { game: any; runs: any[] }>();
    for (const entry of data) {
      const gameId = entry.run.game;
      if (!map.has(gameId)) {
        map.set(gameId, { game: entry.gameData, runs: [] });
      }
      map.get(gameId)!.runs.push(entry);
    }
    return [...map.values()];
  }

  getBackground(game: any): string {
    return game?.assets?.background?.uri
        ?? game?.assets?.['cover-large']?.uri
        ?? game?.assets?.['cover-medium']?.uri
        ?? '';
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
   * @description Muestra "Nivel — Categoría" para level runs.
   */
  getCategoryName(entry: any): string {
    const level    = entry.levelData?.name;
    const category = entry.categoryData?.name;
    if (level && category) return `${level} — ${category}`;
    if (level)             return level;
    if (category)          return category;
    return '—';
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