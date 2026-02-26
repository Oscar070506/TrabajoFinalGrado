import { Component, Input, OnChanges, OnInit, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CategoryFiltersComponent } from '../category-filters/category-filters';

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
  imports: [CommonModule, CategoryFiltersComponent],
  templateUrl: './game-leaderboard.html',
  styleUrls: ['./game-leaderboard.css']
})
export class GameLeaderboardComponent implements OnInit, OnChanges {

  /**
   * URL directa al leaderboard de la categoría principal del juego.
   * Se obtiene del campo `links[rel=leaderboard]` del objeto juego
   * devuelto por la API de speedrun.com.
   *
   * @example
   * "https://www.speedrun.com/api/v1/leaderboards/pd0wx9w1/category/xk94qv4d"
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
   * y lanza el leaderboard. Si la URL directa falla con 400, hace fallback
   * a la primera categoría `per-game` disponible del juego.
   *
   * @param {string} url - URL con formato `/leaderboards/{gameId}/category/{categoryId}`.
   */
  init(url: string): void {
    const match = url.match(/leaderboards\/([^/]+)\/category\/([^/]+)/);
    if (!match) return;
    const gameId     = match[1];
    const categoryId = match[2];
    this.activeCategoryId = categoryId;
    this.loading = true;
    this.error   = null;

    // Cargamos categorías y leaderboard en paralelo
    this.loadCategories(gameId, () => {
      this.fetchLeaderboardWithFallback(url, gameId);
    });
  }

  /**
   * @method loadCategories
   * @description Obtiene las categorías `per-game` del juego y ejecuta
   * el callback una vez cargadas.
   *
   * @param {string} gameId - ID del juego.
   * @param {() => void} callback - Se ejecuta tras cargar las categorías.
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
   * @description Intenta cargar el leaderboard con la URL directa.
   * Si devuelve 400 (categoría per-level), hace fallback a la primera
   * categoría per-game disponible en {@link categories}.
   *
   * @param {string} url - URL directa del leaderboard.
   * @param {string} gameId - ID del juego, usado para construir la URL de fallback.
   */
  fetchLeaderboardWithFallback(url: string, gameId: string): void {
    this.http.get<any>(url).subscribe({
      next: res => {
        this.processLeaderboardResponse(res);
      },
      error: err => {
      if (err.status === 400 && this.categories.length > 0) {
        const firstCategory = this.categories[0];
        const fallbackUrl   = `${this.API}/leaderboards/${gameId}/category/${firstCategory.id}`;
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
   * @description Manejador del evento `categorySelected` de {@link CategoryFiltersComponent}.
   * @param {string} url - URL del leaderboard de la categoría seleccionada.
   */
  onCategorySelected(url: string): void {
    const match = url.match(/category\/([^/]+)/);
    if (match) this.activeCategoryId = match[1];
    this.fetchLeaderboard(url);
  }

  /**
   * @method fetchLeaderboard
   * @description Llama al endpoint del leaderboard y normaliza los datos.
   * @param {string} url - URL completa del leaderboard.
   */
  fetchLeaderboard(url: string): void {
    this.loading     = true;
    this.error       = null;
    this.leaderboard = [];
    this.paginated   = [];

    this.http.get<any>(url).subscribe({
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
   * @description Normaliza la respuesta del leaderboard y actualiza la paginación.
   * @param {any} res - Respuesta cruda de la API.
   */
  processLeaderboardResponse(res: any): void {
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
   * @description Abre el vídeo de la run en una ventana emergente del navegador.
   * @param {any} run - Objeto run del leaderboard.
   */
  openVideo(run: any): void {
    const url = run?.videos?.links?.[0]?.uri;
    if (!url) return;
    window.open(url, '_blank', 'width=900,height=540,left=200,top=200');
  }

  /**
   * @method getPlayerName
   * @param {any} run
   * @returns {string}
   */
  getPlayerName(run: any): string {
    return run?.players?.[0]?.id ?? 'Anónimo';
  }

  /**
   * @method getTime
   * @param {any} run
   * @returns {string} Tiempo en formato HH:MM:SS.
   *
   * @example
   * this.getTime({ times: { primary_t: 83 } }); // → "00:01:23"
   */
  getTime(run: any): string {
    const time = run?.times?.primary_t;
    if (!time) return '—';
    return new Date(time * 1000).toISOString().substring(11, 19);
  }

  /**
   * @method getTrophy
   * @param {number} index - Posición global (base 0).
   * @returns {string | null} URL del trofeo o `null`.
   *
   * @example
   * this.getTrophy(0); // → "https://www.speedrun.com/images/1st.png"
   * this.getTrophy(3); // → null
   */
  getTrophy(index: number): string | null {
    if (index === 0) return 'https://www.speedrun.com/images/1st.png';
    if (index === 1) return 'https://www.speedrun.com/images/2nd.png';
    if (index === 2) return 'https://www.speedrun.com/images/3rd.png';
    return null;
  }
}