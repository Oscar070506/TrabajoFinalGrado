import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject, forkJoin, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, catchError, switchMap } from 'rxjs/operators';
import { ConsoleFilterComponent } from '../../../shared/components/filters/console-filter/console-filter';
import { OrderFilterComponent } from '../../../shared/components/filters/order-filter/order-filter';
import { LucideAngularModule, Trophy, Target } from 'lucide-angular';

/**
 * @component GameHomeComponent
 * @description Página principal del catálogo de juegos y series.
 * Permite navegar entre dos tabs: Juegos y Series.
 * - Juegos: lista paginada con filtros de plataforma, orden y búsqueda.
 *   El modo "jugadores activos" obtiene los juegos más recientes desde /runs.
 * - Series: carga todas las series disponibles y permite filtrarlas localmente.
 *   Al pulsar una serie navega a /series/:id con todos sus juegos.
 */
@Component({
  selector: 'app-game-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ConsoleFilterComponent, OrderFilterComponent, LucideAngularModule],
  templateUrl: './game-home.html',
  styleUrls: ['./game-home.css']
})
export class GameHomeComponent implements OnInit {

  /** Tab activa: 'games' o 'series' */
  activeTab: 'games' | 'series' = 'games';

  // ── Estado de juegos ──────────────────────────────
  /** Lista acumulada de juegos cargados */
  games: any[] = [];

  /** Lista de juegos tras aplicar filtros de fecha (reservado para uso futuro) */
  displayedGames: any[] = [];

  /** Indica si la primera carga de juegos está en curso */
  loading = false;

  /** Indica si se está cargando una página adicional (paginación) */
  loadingMore = false;

  /** Mensaje de error, null si no hay error */
  error: string | null = null;

  /** Controla si se muestra el botón "Cargar más" */
  hasMore = false;

  /** Texto de búsqueda de juegos introducido por el usuario */
  searchQuery = '';

  /** ID de plataforma activa para filtrar. null = todas las plataformas */
  activePlatformId: string | null = null;

  /**
   * Orden activo seleccionado desde OrderFilterComponent.
   * El valor 'active-players' activa la lógica de doble llamada a /runs.
   */
  activeOrder = { orderby: 'active-players', direction: 'desc' };

  /** Rango de años para filtrado (reservado para uso futuro) */
  dateRange = { from: 1970, to: new Date().getFullYear() };

  /**
   * Mapa gameId → número de runs recientes.
   * Se usa para mostrar el contador de jugadores activos en cada card.
   */
  gameRunCounts: Record<string, number> = {};
  seriesRunCounts: Record<string, number> = {};

  /** Lista completa de series cargadas desde la API */
  allSeries: any[] = [];

  /** Lista filtrada de series según el texto de búsqueda */
  filteredSeries: any[] = [];

  /** Indica si la carga de series está en curso */
  loadingSeries = false;

  /** Texto de búsqueda de series introducido por el usuario */
  seriesQuery = '';

  /** Offset actual para la paginación de juegos */
  private offset = 0;

  /** Subject para el debounce de la búsqueda de juegos */
  private search$ = new Subject<string>();

  /** Bandera para evitar doble inicialización en ngOnInit */
  private initialized = false;

  private readonly API        = 'https://www.speedrun.com/api/v1/games';
  private readonly RUNS_API   = 'https://www.speedrun.com/api/v1/runs';
  private readonly SERIES_API = 'https://www.speedrun.com/api/v1/series';
  private readonly PAGE       = 51; 
  private readonly MAX        = 204;  
  private readonly HEADERS    = new HttpHeaders({ 'Accept': 'application/json' });

  readonly Trophy = Trophy;
  readonly Target = Target;

  constructor(
    private http:   HttpClient,
    private router: Router,
    private cdr:    ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.initialized) return;
    this.initialized = true;

    this.search$.pipe(debounceTime(400), distinctUntilChanged()).subscribe(q => {
      if (q.length >= 2) this.searchGames(q);
      else if (q.length === 0) this.resetGames();
    });

    this.fetchGames();
  }

  /**
   * Cambia el tab activo.
   * Si se selecciona 'series' y aún no se han cargado, las obtiene de la API.
   */
  setTab(tab: 'games' | 'series'): void {
    this.activeTab = tab;
    if (tab === 'series' && this.allSeries.length === 0) {
      this.fetchSeries();
    }
  }

  /**
   * Obtiene todas las series desde la API (máximo 200).
   * Popula tanto allSeries como filteredSeries.
   */
  fetchSeries(): void {
    this.loadingSeries = true;
    this.fetchAllSeries$(0, []).subscribe({
      next: series => {
        this.allSeries      = series.sort((a: any, b: any) =>
          new Date(b.created ?? 0).getTime() - new Date(a.created ?? 0).getTime()
        );
        this.filteredSeries = [...this.allSeries];
        this.loadingSeries  = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loadingSeries = false; this.cdr.detectChanges(); }
    });
  }

  private fetchAllSeries$(offset: number, accumulated: any[]): Observable<any[]> {
    return this.http.get<any>(this.SERIES_API, {
      headers: this.HEADERS,
      params: { max: '200', offset: String(offset) }
    }).pipe(
      switchMap(res => {
        const page = res.data ?? [];
        const all  = [...accumulated, ...page];
        return page.length === 200
          ? this.fetchAllSeries$(offset + 200, all)
          : of(all);
      }),
      catchError(() => of(accumulated))
    );
}
  getActiveSeriesPlayers(s: any): number {
    return s?.boostReceived ?? 0;
  }

  /**
   * Filtra la lista de series localmente según el texto de búsqueda.
   * No realiza llamadas adicionales a la API.
   */
  onSeriesSearch(): void {
    const q = this.seriesQuery.trim().toLowerCase();
    this.filteredSeries = q
      ? this.allSeries.filter(s => this.getSeriesName(s).toLowerCase().includes(q))
      : [...this.allSeries];
  }

  /** Limpia el campo de búsqueda de series y restaura la lista completa */
  clearSeriesSearch(): void {
    this.seriesQuery    = '';
    this.filteredSeries = [...this.allSeries];
  }

  /** Devuelve el nombre internacional de una serie */
  getSeriesName(s: any): string {
    return s?.names?.international ?? s?.names?.twitch ?? 'Sin nombre';
  }

  /** Devuelve la URL de la portada de una serie o la imagen por defecto */
  getSeriesCover(s: any): string {
    const cover = s?.assets?.['cover-medium']?.uri ?? s?.assets?.['cover-small']?.uri;
    return cover && !cover.includes('no-cover') ? cover : 'assets/imgs/no-cover.png';
  }

  /** Navega a la página de detalle de la serie seleccionada */
  onSeriesClick(s: any): void {
    this.router.navigate(['/series', s.id]);
  }

  /** Emite el valor actual del input al Subject con debounce */
  onSearch(): void { this.search$.next(this.searchQuery.trim()); }

  /** Limpia la búsqueda y recarga el listado por defecto */
  clearSearch(): void { this.searchQuery = ''; this.resetGames(); }

  /**
   * Busca juegos por nombre en la API (máximo 20 resultados).
   * Tras obtener los juegos, lanza fetchRunCountsForGames en paralelo.
   */
  searchGames(q: string): void {
    this.loading = true;
    this.error   = null;
    this.http.get<any>(this.API, { headers: this.HEADERS, params: { name: q, max: 20 } }).subscribe({
      next: res => {
        this.games   = res.data ?? [];
        this.hasMore = false;
        this.loading = false;
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

  /** Actualiza la plataforma activa y recarga la lista de juegos */
  onPlatformSelected(platformId: string | null): void {
    this.activePlatformId = platformId;
    this.games  = [];
    this.offset = 0;
    this.fetchGames();
  }

  /** Actualiza el criterio de orden y recarga la lista de juegos */
  onOrderChanged(order: { orderby: string; direction: string }): void {
    this.activeOrder = order;
    this.games  = [];
    this.offset = 0;
    this.fetchGames();
  }

  /** Resetea el listado y recarga desde el principio */
  resetGames(): void {
    this.games  = [];
    this.offset = 0;
    this.fetchGames();
  }

  /**
   * Punto de entrada para cargar juegos.
   * Delega a fetchByActivePlayers o fetchByParams según el orden activo.
   */
  fetchGames(): void {
    if (this.activeOrder.orderby === 'active-players') this.fetchByActivePlayers();
    else this.fetchByParams();
  }

  /**
   * Carga juegos ordenados por jugadores activos.
   * Obtiene las últimas 200 runs verificadas con el juego embebido,
   * cuenta cuántas runs tiene cada juego y los ordena de mayor a menor.
   */
  private fetchByActivePlayers(): void {
    this.loading = true;
    this.error   = null;
    this.http.get<any>(this.RUNS_API, {
      headers: this.HEADERS,
      params: { status: 'verified', orderby: 'verify-date', direction: 'desc', max: 200, embed: 'game' }
    }).subscribe({
      next: response => {
        const runs      = response.data ?? [];
        const countMap  = new Map<string, number>();
        const gameCache = new Map<string, any>();

        for (const run of runs) {
          const gameData = run?.game?.data;
          const gameId   = gameData?.id;
          if (!gameId) continue;
          if (this.activePlatformId && !gameData?.platforms?.includes(this.activePlatformId)) continue;
          countMap.set(gameId, (countMap.get(gameId) ?? 0) + 1);
          if (!gameCache.has(gameId)) gameCache.set(gameId, gameData);
        }

        countMap.forEach((count, id) => { this.gameRunCounts[id] = count; });
        this.games = [...countMap.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => gameCache.get(id));
        this.hasMore = false;
        this.loading = false;

        if (this.games.length === 0) {
          this.activeOrder = { orderby: 'created', direction: 'desc' };
          this.fetchByParams();
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

  /**
   * Carga juegos con paginación usando los parámetros de orden estándar.
   * Hace una llamada paralela a /runs para obtener conteos de jugadores activos.
   */
  private fetchByParams(): void {
    this.loading = true;
    this.error   = null;

    forkJoin({
      games: this.http.get<any>(this.API, { headers: this.HEADERS, params: this.buildParams(this.offset) }),
      runs:  this.http.get<any>(this.RUNS_API, {
        headers: this.HEADERS,
        params: { status: 'verified', orderby: 'verify-date', direction: 'desc', max: 200 }
      }).pipe(catchError(() => of({ data: [] }))) 
    }).subscribe({
      next: ({ games, runs }) => {
        const batch: any[] = games.data ?? [];
        this.games   = [...this.games, ...batch];
        this.offset += this.PAGE;
        this.hasMore = batch.length === this.PAGE && this.offset < this.MAX;
        this.loading = false;

        // Construye el mapa de conteos desde las runs recientes
        for (const run of runs.data ?? []) {
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

  /**
   * Carga la siguiente página de juegos sin resetear la lista actual.
   * Solo disponible en modos de orden distintos a 'active-players'.
   */
  loadMore(): void {
    this.loadingMore = true;
    this.http.get<any>(this.API, { headers: this.HEADERS, params: this.buildParams(this.offset) }).subscribe({
      next: response => {
        const batch: any[] = response.data ?? [];
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

  /**
   * Obtiene el conteo de runs recientes para una lista de gameIds específicos.
   * Usado después de una búsqueda por nombre donde no hay runs embebidas.
   */
  private fetchRunCountsForGames(gameIds: string[]): void {
    if (!gameIds.length) return;
    this.http.get<any>(this.RUNS_API, {
      headers: this.HEADERS,
      params: { status: 'verified', orderby: 'verify-date', direction: 'desc', max: 200 }
    }).pipe(catchError(() => of({ data: [] }))).subscribe(res => {
      for (const run of res.data ?? []) {
        const gid = run?.game;
        if (gid && gameIds.includes(gid)) this.gameRunCounts[gid] = (this.gameRunCounts[gid] ?? 0) + 1;
      }
      this.cdr.detectChanges();
    });
  }

  /**
   * Construye los parámetros de consulta para la API de juegos.
   * Incluye la plataforma si hay una activa.
   */
  private buildParams(offset: number): any {
    const params: any = { orderby: this.activeOrder.orderby, direction: this.activeOrder.direction, max: this.PAGE, offset };
    if (this.activePlatformId) params['platform'] = this.activePlatformId;
    return params;
  }

  /** Devuelve el número de runs recientes de un juego (jugadores activos) */
  getActivePlayers(game: any): number { return this.gameRunCounts[game?.id] ?? 0; }

  /** Devuelve la mejor URL de portada disponible para un juego */
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

  /** Devuelve el nombre internacional del juego */
  getName(game: any): string {
    return game?.names?.international ?? game?.names?.twitch ?? 'Sin nombre';
  }

  /** Navega a la página de detalle del juego seleccionado */
  onGameClick(game: any): void {
    window.scrollTo({ top: 0, behavior: 'instant' });
    this.router.navigate(['/game', game.id]);
  }
}