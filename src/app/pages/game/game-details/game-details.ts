import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { GameLeaderboardComponent } from '../game-leaderboard/game-leaderboard';

/**
 * @component GameDetailsComponent
 * @description Página de detalle de un juego individual.
 * Recibe el `gameId` por la ruta, obtiene los datos del juego
 * desde la API de speedrun.com y muestra la misma estructura
 * visual que PopularGamesComponent pero para un único juego.
 *
 * @example
 * Ruta: /game/:id
 */
@Component({
  selector: 'app-game-details',
  standalone: true,
  imports: [CommonModule, RouterModule, GameLeaderboardComponent],
  templateUrl: './game-details.html',
  styleUrls: ['./game-details.css']
})
export class GameDetailsComponent implements OnInit {

  /** Objeto del juego cargado desde la API. `null` hasta que carga. */
  game: any = null;

  /** Indica si la carga está en curso. */
  loading: boolean = false;

  /** Mensaje de error. `null` si no hay error. */
  error: string | null = null;

  /** Controla la animación de entrada. */
  animating: boolean = false;

  private readonly API     = 'https://www.speedrun.com/api/v1';
  private readonly HEADERS = new HttpHeaders({ 'Accept': 'application/json' });

  /**
   * @constructor
   * @param {ActivatedRoute} route - Acceso a los parámetros de la ruta activa.
   * @param {Router} router - Servicio de navegación.
   * @param {HttpClient} http - Cliente HTTP de Angular.
   * @param {ChangeDetectorRef} cdr - Detector de cambios.
   */
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  /** @method ngOnInit */
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.fetchGame(id);
  }

  /**
   * @method fetchGame
   * @description Obtiene los datos del juego desde la API usando su ID.
   * @param {string} id - ID del juego en speedrun.com.
   */
  fetchGame(id: string): void {
    this.loading = true;
    this.error   = null;

    this.http.get<any>(`${this.API}/games/${id}`, {
      headers: this.HEADERS
    }).subscribe({
      next: res => {
        this.game    = res.data;
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

  /**
   * @method goBack
   * @description Navega de vuelta al catálogo de juegos.
   */
  goBack(): void {
    this.router.navigate(['/game']);
  }

  /**
   * @method getBackground
   * @description Devuelve la imagen de fondo del juego.
   * @param {any} game
   * @returns {string}
   */
  getBackground(game: any): string {
    const forceHttps = (uri: string) => uri?.replace('http://', 'https://');
    const isBlank    = (uri: string) => !uri || uri.includes('no-cover') || uri.includes('blankcover');
    const bg         = game?.assets?.background?.uri;
    const large      = game?.assets?.['cover-large']?.uri;
    if (!isBlank(bg))    return forceHttps(bg);
    if (!isBlank(large)) return forceHttps(large);
    return 'assets/imgs/no-cover.png';
  }

  /**
   * @method getCover
   * @description Devuelve la portada del juego.
   * @param {any} game
   * @returns {string}
   */
  getCover(game: any): string {
    const forceHttps = (uri: string) => uri?.replace('http://', 'https://');
    const isBlank    = (uri: string) => !uri || uri.includes('no-cover') || uri.includes('blankcover');
    const medium     = game?.assets?.['cover-medium']?.uri;
    const small      = game?.assets?.['cover-small']?.uri;
    if (!isBlank(medium)) return forceHttps(medium);
    if (!isBlank(small))  return forceHttps(small);
    return 'assets/imgs/no-cover.png';
  }

  /**
   * @method getName
   * @param {any} game
   * @returns {string}
   */
  getName(game: any): string {
    return game?.names?.international ?? game?.names?.twitch ?? 'Sin nombre';
  }

  /**
   * @method getReleaseYear
   * @param {any} game
   * @returns {string}
   */
  getReleaseYear(game: any): string {
    const date = game?.released;
    return date ? String(date).substring(0, 4) : '';
  }

  /**
   * @method getLeaderboardUrl
   * @param {any} game
   * @returns {string}
   */
  getLeaderboardUrl(game: any): string {
    return game?.links?.find((l: any) => l.rel === 'leaderboard')?.uri ?? '';
  }
}