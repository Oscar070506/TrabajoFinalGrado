import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';

/**
 * @component GameHomeComponent
 * @description Componente principal del catálogo de juegos.
 * Consume la API pública de speedrun.com para listar juegos
 * con soporte de paginación incremental.
 */
@Component({
  selector: 'app-game-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './game-home.html',
  styleUrls: ['./game-home.css']
})
export class GameHomeComponent implements OnInit {

  /** Lista acumulada de juegos cargados desde la API. */
  games: any[] = [];

  /** Indica si la primera carga está en curso. */
  loading: boolean = false;

  /** Indica si una carga adicional (paginación) está en curso. */
  loadingMore: boolean = false;

  /** Mensaje de error a mostrar en la vista. `null` si no hay error. */
  error: string | null = null;

  /** Controla si el botón "Cargar más" debe mostrarse. */
  hasMore: boolean = false;

  /** Offset actual para la paginación de la API. */
  private offset = 0;

  /** URL base de la API de juegos de speedrun.com. */
  private readonly API = 'https://www.speedrun.com/api/v1/games';

  /** Número de juegos a solicitar por página. */
  private readonly PAGE = 51;

  /** Límite máximo de juegos a cargar en total. */
  private readonly MAX = 204;

  /**
   * Cabeceras HTTP base para todas las peticiones a la API.
   * @type {HttpHeaders}
   */
  private readonly HEADERS = new HttpHeaders({
    'Accept': 'application/json'
  });

  /**
   * Parámetros base reutilizados en cada petición a la API.
   * Ordena los juegos por fecha de creación descendente.
   */
  private readonly PARAMS_BASE = {
    orderby: 'created',
    direction: 'desc',
    max: this.PAGE
  };

  /**
   * @constructor
   * @param {HttpClient} http - Cliente HTTP de Angular para realizar peticiones.
   * @param {Router} router - Servicio de navegación entre rutas.
   * @param {ChangeDetectorRef} cdr - Referencia al detector de cambios para forzar actualizaciones de la vista.
   */
  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  /**
   * Bandera interna para evitar que `ngOnInit` ejecute
   * la carga inicial más de una vez.
   */
  private initialized = false;

  /**
   * @method ngOnInit
   * @description Hook de ciclo de vida. Lanza la carga inicial de juegos
   * una única vez gracias a la bandera `initialized`.
   */
  ngOnInit(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.fetchGames();
  }

  /**
   * @method fetchGames
   * @description Realiza la primera petición a la API y carga el lote inicial de juegos.
   * Actualiza `games`, `offset`, `hasMore` y `loading`.
   * Fuerza la detección de cambios al finalizar.
   * @returns {void}
   */
  fetchGames(): void {
    this.loading = true;
    this.error = null;

    this.http.get<any>(this.API, {
      headers: this.HEADERS,
      params: { ...this.PARAMS_BASE, offset: this.offset }
    }).subscribe({
      next: response => {
        const batch = response.data ?? [];
        this.games = [...this.games, ...batch];
        this.offset += this.PAGE;
        this.hasMore = batch.length === this.PAGE && this.offset < this.MAX;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Error API:', err);
        this.error = `Error ${err.status}: ${err.message}`;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * @method loadMore
   * @description Carga el siguiente lote de juegos usando el offset acumulado.
   * Gestiona su propio estado de carga con `loadingMore` para no
   * interferir con la carga inicial.
   * @returns {void}
   */
  loadMore(): void {
    this.loadingMore = true;
    this.error = null;

    this.http.get<any>(this.API, {
      headers: this.HEADERS,
      params: { ...this.PARAMS_BASE, offset: this.offset }
    }).subscribe({
      next: response => {
        const batch = response.data ?? [];
        this.games = [...this.games, ...batch];
        this.offset += this.PAGE;
        this.hasMore = batch.length === this.PAGE && this.offset < this.MAX;
        this.loadingMore = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Error API:', err);
        this.error = `Error ${err.status}: ${err.message}`;
        this.loadingMore = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * @method getCover
   * @description Devuelve la URL de la portada del juego priorizando
   * la imagen de mayor resolución disponible. Si ninguna es válida,
   * retorna la imagen local de fallback.
   * @param {any} game - Objeto de juego devuelto por la API.
   * @returns {string} URL de la imagen de portada.
   */
  getCover(game: any): string {
    const isBlank = (uri: string) => !uri || uri.includes('no-cover.png');

    const medium = game?.assets?.['cover-medium']?.uri;
    const small = game?.assets?.['cover-small']?.uri;
    const tiny = game?.assets?.['cover-tiny']?.uri;

    if (!isBlank(medium)) return medium;
    if (!isBlank(small)) return small;
    if (!isBlank(tiny)) return tiny;
    return 'assets/imgs/no-cover.png';
  }

  /**
   * @method getName
   * @description Extrae el nombre del juego priorizando el nombre internacional.
   * Si no existe, usa el nombre de Twitch. Si ninguno está disponible,
   * retorna un texto por defecto.
   * @param {any} game - Objeto de juego devuelto por la API.
   * @returns {string} Nombre del juego.
   */
  getName(game: any): string {
    return game?.names?.international ?? game?.names?.twitch ?? 'Sin nombre';
  }

  /**
   * @method onGameClick
   * @description Navega a la página de detalle del juego seleccionado.
   * @param {any} game - Objeto de juego devuelto por la API.
   * @returns {void}
   */
  onGameClick(game: any): void {
    this.router.navigate(['/game', game.id]);
  }
}