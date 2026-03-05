import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ConsoleFilterComponent } from '../../../shared/components/filters/console-filter/console-filter';
import { OrderFilterComponent } from '../../../shared/components/filters/order-filter/order-filter';

/**
 * @component GameHomeComponent
 * @description Componente principal del catálogo de juegos.
 * Consume la API pública de speedrun.com para listar juegos
 * con soporte de paginación incremental, búsqueda en tiempo real,
 * filtrado por plataforma, ordenación dinámica y rango de años.
 */
@Component({
  selector: 'app-game-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ConsoleFilterComponent, OrderFilterComponent],
  templateUrl: './game-home.html',
  styleUrls: ['./game-home.css']
})
export class GameHomeComponent implements OnInit {

  /** Lista acumulada de juegos cargados desde la API. */
  games: any[] = [];

  /**
   * Lista de juegos tras aplicar el filtro de fechas.
   * Es la que se usa en el HTML con `@for`.
   */
  displayedGames: any[] = [];

  /** Indica si la primera carga está en curso. */
  loading: boolean = false;

  /** Indica si una carga adicional (paginación) está en curso. */
  loadingMore: boolean = false;

  /** Mensaje de error. `null` si no hay error. */
  error: string | null = null;

  /** Controla si el botón "Cargar más" debe mostrarse. */
  hasMore: boolean = false;

  /** Texto de búsqueda introducido por el usuario. */
  searchQuery: string = '';

  /** ID de la plataforma actualmente seleccionada. `null` = todas. */
  activePlatformId: string | null = null;

  /**
   * Orden activo. Se actualiza desde {@link OrderFilterComponent}.
   * El valor especial `'active-players'` activa la doble llamada a /runs.
   */
  activeOrder = { orderby: 'active-players', direction: 'desc' };

  /**
   * Rango de años activo. Se actualiza desde {@link DateFilterComponent}.
   * El filtrado se aplica sobre `games` para producir `displayedGames`.
   */
  dateRange = { from: 1970, to: new Date().getFullYear() };

  /** Offset actual para la paginación de la API. */
  private offset = 0;

  /** Subject para gestionar el debounce de la búsqueda. */
  private search$ = new Subject<string>();

  /** Bandera interna para evitar doble inicialización. */
  private initialized = false;

  private readonly API      = 'https://www.speedrun.com/api/v1/games';
  private readonly RUNS_API = 'https://www.speedrun.com/api/v1/runs';
  private readonly PAGE     = 51;
  private readonly MAX      = 204;
  private readonly HEADERS  = new HttpHeaders({ 'Accept': 'application/json' });

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

  // ── Búsqueda ──────────────────────────────────────────────────────────────

  onSearch(): void {
    this.search$.next(this.searchQuery.trim());
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.resetGames();
  }

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
        this.cdr.detectChanges();
      },
      error: err => {
        this.error   = `Error ${err.status}: ${err.message}`;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Filtros ───────────────────────────────────────────────────────────────

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

  // ── Carga de datos ────────────────────────────────────────────────────────

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
      params: {
        status:    'verified',
        orderby:   'verify-date',
        direction: 'desc',
        max:       200,
        embed:     'game'
      }
    }).subscribe({
      next: response => {
        const runs: any[] = response.data ?? [];
        const countMap    = new Map<string, number>();
        const gameCache   = new Map<string, any>();

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

        this.games = [...countMap.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([id, count]) => ({ ...gameCache.get(id), _runCount: count }));

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
    this.http.get<any>(this.API, {
      headers: this.HEADERS,
      params:  this.buildParams(this.offset)
    }).subscribe({
      next: response => {
        const batch  = response.data ?? [];
        this.games   = [...this.games, ...batch];
        this.offset += this.PAGE;
        this.hasMore = batch.length === this.PAGE && this.offset < this.MAX;
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

  loadMore(): void {
    this.loadingMore = true;
    this.error       = null;
    this.http.get<any>(this.API, {
      headers: this.HEADERS,
      params:  this.buildParams(this.offset)
    }).subscribe({
      next: response => {
        const batch      = response.data ?? [];
        this.games       = [...this.games, ...batch];
        this.offset     += this.PAGE;
        this.hasMore     = batch.length === this.PAGE && this.offset < this.MAX;
        this.loadingMore = false;
        this.cdr.detectChanges();
      },
      error: err => {
        this.error       = `Error ${err.status}: ${err.message}`;
        this.loadingMore = false;
        this.cdr.detectChanges();
      }
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

  // ── Helpers ───────────────────────────────────────────────────────────────

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