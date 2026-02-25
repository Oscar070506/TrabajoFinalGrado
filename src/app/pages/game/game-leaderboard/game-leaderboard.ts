import { Component, Input, OnChanges, OnInit, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CategoryFiltersComponent } from '../category-filters/category-filters';

/**
 * @component GameLeaderboardComponent
 * @description Muestra el leaderboard de la categoría activa de un juego de speedrun.com.
 * Carga las categorías `per-game` disponibles, renderiza los filtros de categoría mediante
 * {@link CategoryFiltersComponent} y actualiza la tabla al cambiar de categoría o de juego.
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
  @Input() leaderboardUrl: string | null = null;

  leaderboard: any[] = [];
  paginated: any[] = [];
  categories: any[] = [];
  activeCategoryId: string = '';
  currentPage: number = 0;

  readonly pageSize: number = 10;
  loading: boolean = false;
  error: string | null = null;
  protected readonly Math = Math;

  private readonly API = 'https://www.speedrun.com/api/v1';

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (this.leaderboardUrl) this.init(this.leaderboardUrl);
  }

  /**
   * @method ngOnChanges
   * @description Ciclo de vida de Angular. Detecta cambios en `leaderboardUrl`
   * y relanza {@link init} para cargar el juego nuevo.
   * @param {SimpleChanges} changes - Mapa de propiedades que han cambiado.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['leaderboardUrl'] && this.leaderboardUrl) {
      this.init(this.leaderboardUrl);
    }
  }

  /**
   * @method init
   * @description Punto de entrada principal. Extrae el `gameId` y `categoryId`
   * de la URL mediante regex, establece la categoría activa y lanza en paralelo
   * la carga de categorías y del leaderboard inicial.
   *
   * @param {string} url - URL del leaderboard con formato
   * `/leaderboards/{gameId}/category/{categoryId}`.
   *
   * @example
   * this.init("https://www.speedrun.com/api/v1/leaderboards/pd0wx9w1/category/xk94qv4d");
   * // gameId   → "pd0wx9w1"
   * // categoryId → "xk94qv4d"
   */
  init(url: string): void {
    const match = url.match(/leaderboards\/([^/]+)\/category\/([^/]+)/);
    if (!match) return;
    const gameId    = match[1];
    const categoryId = match[2];
    this.activeCategoryId = categoryId;
    this.loadCategories(gameId);
    this.fetchLeaderboard(url);
  }

  /**
   * @method loadCategories
   * @description Obtiene todas las categorías del juego desde la API y filtra
   * únicamente las de tipo `per-game`, descartando las `per-level` que
   * requieren un `levelId` adicional y provocarían un error 400.
   *
   * @param {string} gameId - ID del juego en speedrun.com.
   */
  loadCategories(gameId: string): void {
    this.http.get<any>(`${this.API}/games/${gameId}/categories`).subscribe({
      next: res => {
        this.categories = (res.data ?? []).filter((cat: any) => cat.type === 'per-game');
        this.cdr.detectChanges();
      },
      error: () => {
        // Si falla la carga de categorías, ocultamos los filtros silenciosamente
        this.categories = [];
      }
    });
  }

  /**
   * @method onCategorySelected
   * @description Manejador del evento `categorySelected` emitido por
   * {@link CategoryFiltersComponent}. Actualiza la categoría activa y
   * recarga el leaderboard con la nueva URL.
   *
   * @param {string} url - URL del leaderboard de la categoría seleccionada.
   */
  onCategorySelected(url: string): void {
    const match = url.match(/category\/([^/]+)/);
    if (match) this.activeCategoryId = match[1];
    this.fetchLeaderboard(url);
  }

  /**
   * @method fetchLeaderboard
   * @description Realiza la petición HTTP al endpoint del leaderboard y
   * normaliza la respuesta extrayendo únicamente los objetos `run` del array
   * `data.runs`. Resetea la paginación a la primera página en cada carga.
   *
   * @param {string} url - URL completa del leaderboard a consultar.
   */
  fetchLeaderboard(url: string): void {
    this.loading  = true;
    this.error    = null;
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

  /**
   * @method updatePagination
   * @description Recalcula {@link paginated} extrayendo el slice de {@link leaderboard}
   * correspondiente a la {@link currentPage} actual.
   */
  updatePagination(): void {
    const start    = this.currentPage * this.pageSize;
    this.paginated = this.leaderboard.slice(start, start + this.pageSize);
  }

  /**
   * @method nextPage
   * @description Avanza a la página siguiente si existe.
   * No hace nada si ya estamos en la última página.
   */
  nextPage(): void {
    if ((this.currentPage + 1) * this.pageSize < this.leaderboard.length) {
      this.currentPage++;
      this.updatePagination();
      this.cdr.detectChanges();
    }
  }

  /**
   * @method prevPage
   * @description Retrocede a la página anterior si existe.
   * No hace nada si ya estamos en la primera página.
   */
  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.updatePagination();
      this.cdr.detectChanges();
    }
  }

  /**
   * @method getPlayerName
   * @description Extrae el nombre o ID del primer jugador de una run.
   * Devuelve `'Anónimo'` si el dato no está disponible.
   *
   * @param {any} run - Objeto run del leaderboard.
   * @returns {string} Nombre o ID del jugador.
   */
  getPlayerName(run: any): string {
    return run?.players?.[0]?.id ?? 'Anónimo';
  }

  /**
   * @method getTime
   * @description Convierte el tiempo primario de una run (en segundos)
   * al formato `HH:MM:SS`.
   *
   * @param {any} run - Objeto run del leaderboard.
   * @returns {string} Tiempo formateado, o `'—'` si no hay dato.
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
   * @description Devuelve la URL del icono de trofeo correspondiente
   * a una posición del podio (top 3). Para el resto de posiciones devuelve `null`.
   *
   * @param {number} index - Posición global en el leaderboard (base 0).
   * @returns {string | null} URL del trofeo, o `null` si la posición es > 2.
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