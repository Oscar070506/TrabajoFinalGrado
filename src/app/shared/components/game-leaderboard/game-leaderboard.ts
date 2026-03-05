import { Component, Input, OnChanges, OnInit, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CategoryFiltersComponent } from '../../../pages/game/category-filters/category-filters';
import { RouterModule } from '@angular/router';

/**
 * @component GameLeaderboardComponent
 * @description Muestra el leaderboard de la categoría activa de un juego de speedrun.com.
 * Carga las categorías `per-game` disponibles, renderiza los filtros mediante
 * {@link CategoryFiltersComponent} y actualiza la tabla al cambiar de categoría o juego.
 * Si la URL directa devuelve 400, hace fallback a la primera categoría per-game disponible.
 *
 * @example
 * <app-game-leaderboard [leaderboardUrl]="url"></app-game-leaderboard>
 */
@Component({
  selector: 'app-game-leaderboard',
  standalone: true,
  imports: [CommonModule, CategoryFiltersComponent, RouterModule],
  templateUrl: './game-leaderboard.html',
  styleUrls: ['./game-leaderboard.css']
})
export class GameLeaderboardComponent implements OnInit, OnChanges {

  /**
   * URL directa al leaderboard de la categoría principal del juego.
   * @example "https://www.speedrun.com/api/v1/leaderboards/pd0wx9w1/category/xk94qv4d"
   */
  @Input() leaderboardUrl: string = '';

  /** Lista completa de runs del leaderboard activo. */
  leaderboard: any[] = [];

  /** Subconjunto paginado de {@link leaderboard} actualmente visible en la tabla. */
  paginated: any[] = [];

  /** Lista de categorías `per-game` disponibles para el juego actual. */
  categories: any[] = [];

  /** ID de la categoría actualmente seleccionada. */
  activeCategoryId: string = '';

  /** Índice de la página actual (base 0). */
  currentPage: number = 0;

  /** @readonly Número de runs visibles por página. */
  readonly pageSize: number = 10;

  /** Indica si hay una petición HTTP en curso. */
  loading: boolean = false;

  /** Mensaje de error. `null` cuando no hay error activo. */
  error: string | null = null;

  /**
   * Mapa de jugadores embebidos en la respuesta del leaderboard.
   * Clave: ID del jugador. Valor: objeto player de la API.
   */
  private players: Record<string, any> = {};

  /** @protected Referencia a `Math` expuesta al template para `Math.ceil()`. */
  protected readonly Math = Math;

  /** @private @readonly URL base de la API pública de speedrun.com v1. */
  private readonly API = 'https://www.speedrun.com/api/v1';

  /**
   * @constructor
   * @param {HttpClient} http - Cliente HTTP de Angular.
   * @param {ChangeDetectorRef} cdr - Detector de cambios.
   */
  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  /** @method ngOnInit */
  ngOnInit(): void {
    if (this.leaderboardUrl) this.init(this.leaderboardUrl);
  }

  /**
   * @method ngOnChanges
   * @param {SimpleChanges} changes
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['leaderboardUrl'] && this.leaderboardUrl) {
      this.init(this.leaderboardUrl);
    }
  }

  /**
   * @method init
   * @description Extrae `gameId` y `categoryId` de la URL, carga las categorías
   * y lanza el leaderboard con fallback si es necesario.
   * @param {string} url
   */
  init(url: string): void {
    const match = url.match(/leaderboards\/([^/]+)\/category\/([^/]+)/);
    if (!match) return;
    const gameId     = match[1];
    const categoryId = match[2];
    this.activeCategoryId = categoryId;
    this.loading = true;
    this.error   = null;

    this.loadCategories(gameId, () => {
      this.fetchLeaderboardWithFallback(url, gameId);
    });
  }

  /**
   * @method loadCategories
   * @param {string} gameId
   * @param {() => void} callback
   */
  loadCategories(gameId: string, callback: () => void): void {
    this.http.get<any>(`${this.API}/games/${gameId}/categories`).subscribe({
      next: res => {
        this.categories = (res.data ?? []).filter((c: any) => c.type === 'per-game');
        this.cdr.detectChanges();
        callback();
      },
      error: () => {
        this.categories = [];
        callback();
      }
    });
  }

  /**
   * @method fetchLeaderboardWithFallback
   * @description Intenta cargar el leaderboard con embed=players.
   * Si devuelve 400, hace fallback a la primera categoría per-game.
   * @param {string} url
   * @param {string} gameId
   */
  fetchLeaderboardWithFallback(url: string, gameId: string): void {
    this.http.get<any>(url, { params: { embed: 'players' } }).subscribe({
      next: res => {
        this.processLeaderboardResponse(res);
      },
      error: err => {
        if (err.status === 400 && this.categories.length > 0) {
          const firstCategory   = this.categories[0];
          const fallbackUrl     = `${this.API}/leaderboards/${gameId}/category/${firstCategory.id}`;
          this.activeCategoryId = firstCategory.id;
          this.cdr.detectChanges();
          this.fetchLeaderboard(fallbackUrl);
        } else {
          this.error   = err.status === 400 ? null : `Error cargando leaderboard: ${err.message}`;
          this.loading = false;
          this.cdr.detectChanges();
        }
      }
    });
  }

  /**
   * @method onCategorySelected
   * @param {string} url
   */
  onCategorySelected(url: string): void {
    const match = url.match(/category\/([^/]+)/);
    if (match) this.activeCategoryId = match[1];
    this.fetchLeaderboard(url);
  }

  /**
   * @method fetchLeaderboard
   * @description Llama al endpoint con `embed=players` para obtener
   * los datos de jugadores en la misma respuesta.
   * @param {string} url
   */
  fetchLeaderboard(url: string): void {
    this.loading     = true;
    this.error       = null;
    this.leaderboard = [];
    this.paginated   = [];

    this.http.get<any>(url, { params: { embed: 'players' } }).subscribe({
      next: res => this.processLeaderboardResponse(res),
      error: err => {
        this.error   = `Error cargando leaderboard: ${err.message}`;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * @method processLeaderboardResponse
   * @description Normaliza la respuesta, extrae el mapa de jugadores
   * embebidos y actualiza la paginación.
   * @param {any} res - Respuesta cruda de la API.
   */
  processLeaderboardResponse(res: any): void {
    // Construye el mapa id → player desde los jugadores embebidos
    const playerList: any[] = res.data?.players?.data ?? [];
    this.players = {};
    for (const p of playerList) {
      if (p?.id) this.players[p.id] = p;
    }

    this.leaderboard = res.data?.runs?.map((r: any) => r.run) ?? [];
    this.currentPage = 0;
    this.updatePagination();
    this.loading = false;
    this.cdr.detectChanges();
  }

  /** @method updatePagination */
  updatePagination(): void {
    const start    = this.currentPage * this.pageSize;
    this.paginated = this.leaderboard.slice(start, start + this.pageSize);
  }

  /** @method nextPage */
  nextPage(): void {
    if ((this.currentPage + 1) * this.pageSize < this.leaderboard.length) {
      this.currentPage++; this.updatePagination(); this.cdr.detectChanges();
    }
  }

  /** @method prevPage */
  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--; this.updatePagination(); this.cdr.detectChanges();
    }
  }

  /**
   * @method openVideo
   * @param {any} run
   */
  openVideo(run: any): void {
    const url = run?.videos?.links?.[0]?.uri;
    if (!url) return;
    window.open(url, '_blank', 'width=900,height=540,left=200,top=200');
  }

  /**
   * @method getPlayerName
   * @description Busca el nombre del primer jugador de la run
   * en el mapa `players` obtenido via embed.
   * @param {any} run
   * @returns {string}
   */
  getPlayerName(run: any): string {
    const player = run?.players?.[0];
    if (!player) return 'Anónimo';

    // Jugador registrado → buscar en el mapa
    if (player.rel === 'user') {
      const user = this.players[player.id];
      return user?.names?.international ?? user?.names?.japanese ?? player.id;
    }

    // Jugador invitado → el nombre viene directamente en el objeto
    if (player.rel === 'guest') {
      return player.name ?? 'Invitado';
    }

    return 'Anónimo';
  }

  getPlayerId(run: any): string {
    const player = run?.players?.[0];
    if (!player || player.rel !== 'user') return '';
    return player.id;
  }

  getPlayerColor(run: any): string {
    const player = run?.players?.[0];
    if (!player || player.rel !== 'user') return 'var(--text-primary)';
    
    const user  = this.players[player.id];
    const style = user?.['name-style'];
    
    if (style?.style === 'solid') {
      return style?.color?.light ?? 'var(--text-primary)';
    }
    
    // gradient → usa el color de inicio
    if (style?.style === 'gradient') {
      return style?.['color-from']?.light ?? 'var(--text-primary)';
    }
    
    return 'var(--text-primary)';
  }

  /**
   * @method getTime
   * @param {any} run
   * @returns {string} Tiempo en formato HH:MM:SS.
   */
  getTime(run: any): string {
    const time = run?.times?.primary_t;
    if (!time) return '—';
    return new Date(time * 1000).toISOString().substring(11, 19);
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
}