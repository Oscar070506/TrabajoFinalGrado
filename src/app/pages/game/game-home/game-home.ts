import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject, forkJoin, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, catchError } from 'rxjs/operators';
import { ConsoleFilterComponent } from '../../../shared/components/filters/console-filter/console-filter';
import { OrderFilterComponent } from '../../../shared/components/filters/order-filter/order-filter';
import { LucideAngularModule, Trophy, Target } from 'lucide-angular';

@Component({
  selector: 'app-game-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ConsoleFilterComponent, OrderFilterComponent, LucideAngularModule],
  templateUrl: './game-home.html',
  styleUrls: ['./game-home.css']
})
export class GameHomeComponent implements OnInit {

  games: any[] = [];
  displayedGames: any[] = [];
  loading: boolean = false;
  loadingMore: boolean = false;
  error: string | null = null;
  hasMore: boolean = false;
  searchQuery: string = '';
  activePlatformId: string | null = null;
  activeOrder = { orderby: 'active-players', direction: 'desc' };
  dateRange = { from: 1970, to: new Date().getFullYear() };

  /**
   * Mapa gameId → número de runs recientes (jugadores activos).
   * Se rellena siempre en paralelo a la carga de juegos.
   */
  gameRunCounts: Record<string, number> = {};

  private offset = 0;
  private search$ = new Subject<string>();
  private initialized = false;

  private readonly API      = 'https://www.speedrun.com/api/v1/games';
  private readonly RUNS_API = 'https://www.speedrun.com/api/v1/runs';
  private readonly PAGE     = 51;
  private readonly MAX      = 204;
  private readonly HEADERS  = new HttpHeaders({ 'Accept': 'application/json' });

  readonly Trophy = Trophy;
  readonly Target = Target;

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.initialized) return;
    this.initialized = true;

    this.search$.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(q => {
      if (q.length >= 2) this.searchGames(q);
      else if (q.length === 0) this.resetGames();
    });
  }

  onSearch(): void { this.search$.next(this.searchQuery.trim()); }

  clearSearch(): void { this.searchQuery = ''; this.resetGames(); }

  searchGames(q: string): void {
    this.loading = true;
    this.error   = null;
    this.http.get<any>(this.API, {
      headers: this.HEADERS,
      params: { name: q, max: 20 }
    }).subscribe({
      next: res => {
        this.games   = res.data ?? [];
        this.hasMore = false;
        this.loading = false;
        // Carga conteos de runs para los juegos buscados
        this.fetchRunCountsForGames(this.games.map(g => g.id));
        this.cdr.detectChanges();
      },
      error: err => {
        this.error   = `Error ${err.status}: ${err.message}`;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onPlatformSelected(platformId: string | null): void {
    this.activePlatformId = platformId;
    this.games  = [];
    this.offset = 0;
    this.fetchGames();
  }

  onOrderChanged(order: { orderby: string; direction: string }): void {
    this.activeOrder = order;
    this.games  = [];
    this.offset = 0;
    this.fetchGames();
  }

  resetGames(): void {
    this.games  = [];
    this.offset = 0;
    this.fetchGames();
  }

  fetchGames(): void {
    if (this.activeOrder.orderby === 'active-players') {
      this.fetchByActivePlayers();
    } else {
      this.fetchByParams();
    }
  }

  private fetchByActivePlayers(): void {
    this.loading = true;
    this.error   = null;

    this.http.get<any>(this.RUNS_API, {
      headers: this.HEADERS,
      params: { status: 'verified', orderby: 'verify-date', direction: 'desc', max: 200, embed: 'game' }
    }).subscribe({
      next: response => {
        const runs: any[]  = response.data ?? [];
        const countMap     = new Map<string, number>();
        const gameCache    = new Map<string, any>();

        for (const run of runs) {
          const gameData = run?.game?.data;
          const gameId   = gameData?.id;
          if (!gameId) continue;

          if (this.activePlatformId) {
            const platforms: string[] = gameData?.platforms ?? [];
            if (!platforms.includes(this.activePlatformId)) continue;
          }

          countMap.set(gameId, (countMap.get(gameId) ?? 0) + 1);
          if (!gameCache.has(gameId)) gameCache.set(gameId, gameData);
        }

        // Guardar conteos en el mapa global
        countMap.forEach((count, id) => { this.gameRunCounts[id] = count; });

        this.games = [...countMap.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([id]) => gameCache.get(id));

        this.hasMore = false;
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

  private fetchByParams(): void {
    this.loading = true;
    this.error   = null;

    // Llamada principal a juegos + llamada a runs recientes en paralelo
    forkJoin({
      games: this.http.get<any>(this.API, {
        headers: this.HEADERS,
        params:  this.buildParams(this.offset)
      }),
      runs: this.http.get<any>(this.RUNS_API, {
        headers: this.HEADERS,
        params: { status: 'verified', orderby: 'verify-date', direction: 'desc', max: 200 }
      }).pipe(catchError(() => of({ data: [] })))
    }).subscribe({
      next: ({ games, runs }) => {
        const batch: any[] = games.data ?? [];
        this.games         = [...this.games, ...batch];
        this.offset       += this.PAGE;
        this.hasMore       = batch.length === this.PAGE && this.offset < this.MAX;
        this.loading       = false;

        // Construir mapa de conteos desde runs recientes
        const runList: any[] = runs.data ?? [];
        for (const run of runList) {
          const gid = run?.game;
          if (gid) this.gameRunCounts[gid] = (this.gameRunCounts[gid] ?? 0) + 1;
        }

        this.cdr.detectChanges();
      },
      error: err => {
        this.error   = `Error ${err.status}: ${err.message}`;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadMore(): void {
    this.loadingMore = true;
    this.error       = null;
    this.http.get<any>(this.API, {
      headers: this.HEADERS,
      params:  this.buildParams(this.offset)
    }).subscribe({
      next: response => {
        const batch: any[]  = response.data ?? [];
        this.games          = [...this.games, ...batch];
        this.offset        += this.PAGE;
        this.hasMore        = batch.length === this.PAGE && this.offset < this.MAX;
        this.loadingMore    = false;
        this.cdr.detectChanges();
      },
      error: err => {
        this.error       = `Error ${err.status}: ${err.message}`;
        this.loadingMore = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Obtiene el conteo de runs recientes para una lista de gameIds.
   * Usado tras una búsqueda donde no hay datos de runs embebidos.
   */
  private fetchRunCountsForGames(gameIds: string[]): void {
    if (!gameIds.length) return;
    this.http.get<any>(this.RUNS_API, {
      headers: this.HEADERS,
      params: { status: 'verified', orderby: 'verify-date', direction: 'desc', max: 200 }
    }).pipe(catchError(() => of({ data: [] }))).subscribe(res => {
      const runs: any[] = res.data ?? [];
      for (const run of runs) {
        const gid = run?.game;
        if (gid && gameIds.includes(gid)) {
          this.gameRunCounts[gid] = (this.gameRunCounts[gid] ?? 0) + 1;
        }
      }
      this.cdr.detectChanges();
    });
  }

  private buildParams(offset: number): any {
    const params: any = {
      orderby:   this.activeOrder.orderby,
      direction: this.activeOrder.direction,
      max:       this.PAGE,
      offset
    };
    if (this.activePlatformId) params['platform'] = this.activePlatformId;
    return params;
  }

  /** @method getActivePlayers - Devuelve el conteo de runs recientes para un juego */
  getActivePlayers(game: any): number {
    return this.gameRunCounts[game?.id] ?? 0;
  }

  getCover(game: any): string {
    const isBlank = (uri: string) => !uri || uri.includes('no-cover.png');
    const medium  = game?.assets?.['cover-medium']?.uri;
    const small   = game?.assets?.['cover-small']?.uri;
    const tiny    = game?.assets?.['cover-tiny']?.uri;
    if (!isBlank(medium)) return medium;
    if (!isBlank(small))  return small;
    if (!isBlank(tiny))   return tiny;
    return 'assets/imgs/no-cover.png';
  }

  getName(game: any): string {
    return game?.names?.international ?? game?.names?.twitch ?? 'Sin nombre';
  }

  onGameClick(game: any): void {
    this.router.navigate(['/game', game.id]);
  }
}