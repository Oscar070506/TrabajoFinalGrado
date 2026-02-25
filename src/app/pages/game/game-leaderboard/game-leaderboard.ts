import { Component, Input, OnChanges, OnInit, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

/**
 * @component GameLeaderboardComponent
 * @description Muestra el leaderboard del juego seleccionado, con paginación,
 * trofeos para los tres primeros puestos y actualización automática al cambiar gameId.
 */
@Component({
  selector: 'app-game-leaderboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-leaderboard.html',
  styleUrls: ['./game-leaderboard.css']
})
export class GameLeaderboardComponent implements OnInit, OnChanges {

  /** ID del juego recibido desde el componente padre. */
  @Input() gameId: string = '';

  /** Lista completa de runs del leaderboard. */
  leaderboard: any[] = [];

  /** Lista paginada de runs visibles. */
  paginated: any[] = [];

  /** Página actual. */
  currentPage: number = 0;

  /** Número de elementos por página. */
  readonly pageSize: number = 10;

  /** Indica si la carga está en curso. */
  loading: boolean = false;

  /** Mensaje de error. `null` si no hay error. */
  error: string | null = null;

  protected readonly Math = Math;

  /** URL base de la API de speedrun.com. */
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
    if (this.gameId) {
      this.loadLeaderboard();
    }
  }

  /**
   * @method ngOnChanges
   * @description Detecta cambios en @Input y recarga el leaderboard.
   * @param {SimpleChanges} changes
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['gameId'] && this.gameId) {
      this.loadLeaderboard();
    }
  }

  /**
   * @method loadLeaderboard
   * @description Obtiene las categorías del juego y carga el leaderboard
   * de la primera categoría disponible.
   */
  loadLeaderboard(): void {
    this.loading = true;
    this.error = null;

    this.http.get<any>(`${this.API}/games/${this.gameId}/categories`)
      .subscribe({
        next: res => {
          const categories = res.data;

          if (!categories?.length) {
            this.error = 'Este juego no tiene categorías.';
            this.loading = false;
            this.cdr.detectChanges();
            return;
          }

          const categoryId = categories[0].id;
          const url = `${this.API}/leaderboards/${this.gameId}/category/${categoryId}`;

          this.fetchLeaderboard(url);
        },
        error: err => {
          this.error = `Error obteniendo categorías: ${err.message}`;
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * @method fetchLeaderboard
   * @description Llama al endpoint real del leaderboard y normaliza los datos.
   * @param {string} url - URL del leaderboard.
   */
  fetchLeaderboard(url: string): void {
    this.http.get<any>(url).subscribe({
      next: res => {
        this.leaderboard = res.data?.runs?.map((r: any) => r.run) ?? [];
        this.currentPage = 0;
        this.updatePagination();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        this.error = `Error cargando leaderboard: ${err.message}`;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * @method updatePagination
   * @description Actualiza la lista paginada según la página actual.
   */
  updatePagination(): void {
    const start = this.currentPage * this.pageSize;
    const end   = start + this.pageSize;
    this.paginated = this.leaderboard.slice(start, end);
  }

  /**
   * @method nextPage
   * @description Avanza a la siguiente página.
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
   * @description Retrocede a la página anterior.
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
   * @description Devuelve el nombre del jugador.
   * @param {any} run
   * @returns {string}
   */
  getPlayerName(run: any): string {
    return run?.players?.[0]?.id ?? 'Anónimo';
  }

  /**
   * @method getTime
   * @description Convierte el tiempo en segundos a formato HH:MM:SS.
   * @param {any} run
   * @returns {string}
   */
  getTime(run: any): string {
    const time = run?.times?.primary_t;
    if (!time) return '—';
    return new Date(time * 1000).toISOString().substring(11, 19);
  }

  /**
   * @method getTrophy
   * @description Devuelve la URL del trofeo según la posición.
   * @param {number} index - Índice global del leaderboard.
   * @returns {string | null}
   */
  getTrophy(index: number): string | null {
    if (index === 0) return 'https://www.speedrun.com/images/1st.png';
    if (index === 1) return 'https://www.speedrun.com/images/2nd.png';
    if (index === 2) return 'https://www.speedrun.com/images/3rd.png';
    return null;
  }
}
