import { Component, Input, OnChanges, OnInit, SimpleChanges, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CategoryFiltersComponent } from '../category-filters/category-filters';
import { SafePipe } from '../../../shared/pipes/safe-pipe';

/**
 * @component GameLeaderboardComponent
 * @description Muestra el leaderboard de la categoría activa de un juego de speedrun.com.
 * Carga las categorías `per-game` disponibles, renderiza los filtros de categoría mediante
 * {@link CategoryFiltersComponent} y actualiza la tabla al cambiar de categoría o de juego.
 * Permite abrir el vídeo de cada run en un modal con iframe de YouTube.
 *
 * @example
 * <app-game-leaderboard [leaderboardUrl]="url"></app-game-leaderboard>
 */
@Component({
  selector: 'app-game-leaderboard',
  standalone: true,
  imports: [CommonModule, CategoryFiltersComponent, SafePipe],
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

  @Output() videoOpened = new EventEmitter<string | null>();


  /** Lista completa de runs del leaderboard activo. */
  leaderboard: any[] = [];

  /** Subconjunto paginado de {@link leaderboard} actualmente visible en la tabla. */
  paginated: any[] = [];

  /** Lista de categorías `per-game` disponibles para el juego actual. */
  categories: any[] = [];

  /** ID de la categoría actualmente seleccionada. */
  activeCategoryId: string = '';

  /**
   * URL embed del vídeo activo para mostrar en el modal.
   * Es `null` cuando el modal está cerrado.
   */
  activeVideoUrl: string | null = null;

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
   * @param {ChangeDetectorRef} cdr - Detector de cambios para forzar actualizaciones tras async.
   */
  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

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
   * @description Extrae `gameId` y `categoryId` de la URL, establece la categoría
   * activa y lanza en paralelo la carga de categorías y del leaderboard inicial.
   * @param {string} url - URL con formato `/leaderboards/{gameId}/category/{categoryId}`.
   */
  init(url: string): void {
    const match = url.match(/leaderboards\/([^/]+)\/category\/([^/]+)/);
    if (!match) return;
    const gameId     = match[1];
    const categoryId = match[2];
    this.activeCategoryId = categoryId;
    this.activeVideoUrl   = null;
    this.loadCategories(gameId);
    this.fetchLeaderboard(url);
  }

  /**
   * @method loadCategories
   * @description Obtiene las categorías del juego y filtra solo las `per-game`.
   * @param {string} gameId - ID del juego en speedrun.com.
   */
  loadCategories(gameId: string): void {
    this.http.get<any>(`${this.API}/games/${gameId}/categories`).subscribe({
      next: res => {
        this.categories = (res.data ?? []).filter((cat: any) => cat.type === 'per-game');
        this.cdr.detectChanges();
      },
      error: () => { this.categories = []; }
    });
  }

  /**
   * @method onCategorySelected
   * @description Maneja el evento `categorySelected` de {@link CategoryFiltersComponent}.
   * @param {string} url - URL del leaderboard de la categoría seleccionada.
   */
  onCategorySelected(url: string): void {
    const match = url.match(/category\/([^/]+)/);
    if (match) this.activeCategoryId = match[1];
    this.activeVideoUrl = null;
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
      next: res => {
        this.leaderboard = res.data?.runs?.map((r: any) => r.run) ?? [];
        this.currentPage = 0;
        this.updatePagination();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        this.error   = `Error cargando leaderboard: ${err.message}`;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /** @method updatePagination */
  updatePagination(): void {
    const start    = this.currentPage * this.pageSize;
    this.paginated = this.leaderboard.slice(start, start + this.pageSize);
  }

  /** @method nextPage */
  nextPage(): void {
    if ((this.currentPage + 1) * this.pageSize < this.leaderboard.length) {
      this.currentPage++;
      this.updatePagination();
      this.cdr.detectChanges();
    }
  }

  /** @method prevPage */
  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.updatePagination();
      this.cdr.detectChanges();
    }
  }

  /**
   * @method openVideo
   * @description Extrae el ID del vídeo de YouTube de la run y construye
   * la URL embed para mostrarla en el modal.
   * @param {any} run - Objeto run del leaderboard.
   */

  openVideo(run: any): void {
    const url = run?.videos?.links?.[0]?.uri;
    if (!url) return;
    const videoId = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1];
    const embedUrl = videoId
      ? `https://www.youtube.com/embed/${videoId}?autoplay=1`
      : url;
    this.videoOpened.emit(embedUrl);
  }

  /**
   * @method closeVideo
   * @description Cierra el modal de vídeo.
   */
  closeVideo(): void {
    this.activeVideoUrl = null;
    this.cdr.detectChanges();
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
   */
  getTrophy(index: number): string | null {
    if (index === 0) return 'https://www.speedrun.com/images/1st.png';
    if (index === 1) return 'https://www.speedrun.com/images/2nd.png';
    if (index === 2) return 'https://www.speedrun.com/images/3rd.png';
    return null;
  }
}