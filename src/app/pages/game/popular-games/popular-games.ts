import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';

/**
 * @component PopularGamesComponent
 * @description Carrusel de juegos populares obtenidos mediante doble llamada
 * a la API de speedrun.com. Obtiene runs verificadas con embed=game,
 * cuenta actividad por juego y muestra los top 20 en formato carrusel
 * pantalla completa estilo Steam.
 */
@Component({
  selector: 'app-popular-games',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './popular-games.html',
  styleUrls: ['./popular-games.css']
})
export class PopularGamesComponent implements OnInit {

  /** Lista de juegos populares. */
  games: any[] = [];

  /** Índice del juego actualmente visible. */
  currentIndex: number = 0;

  /** Indica si la carga está en curso. */
  loading: boolean = false;

  /** Mensaje de error. `null` si no hay error. */
  error: string | null = null;

  /** Controla la animación de transición. */
  animating: boolean = false;

  /** Dirección de la animación. */
  direction: 'left' | 'right' = 'right';

  private readonly RUNS_API = 'https://www.speedrun.com/api/v1/runs';
  private readonly HEADERS  = new HttpHeaders({ 'Accept': 'application/json' });

  /**
   * @constructor
   * @param {HttpClient} http - Cliente HTTP de Angular.
   * @param {Router} router - Servicio de navegación.
   * @param {ChangeDetectorRef} cdr - Detector de cambios.
   */
  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  /** @method ngOnInit */
  ngOnInit(): void {
    this.fetchPopularGames();
  }

  /**
   * @method fetchPopularGames
   * @description Obtiene 200 runs recientes con embed=game, cuenta runs
   * por juego y construye el top 20 más activo.
   * @returns {void}
   */
  fetchPopularGames(): void {
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
        const runs: any[]  = response.data ?? [];
        const countMap     = new Map<string, number>();
        const gameCache    = new Map<string, any>();

        for (const run of runs) {
          const gameData = run?.game?.data;
          const gameId   = gameData?.id;
          if (gameId) {
            countMap.set(gameId, (countMap.get(gameId) ?? 0) + 1);
            if (!gameCache.has(gameId)) gameCache.set(gameId, gameData);
          }
        }

        this.games = [...countMap.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20)
          .map(([id, count]) => ({ ...gameCache.get(id), _runCount: count }));

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
   * @method currentGame
   * @description Devuelve el juego actualmente visible.
   * @returns {any}
   */
  get currentGame(): any {
    return this.games[this.currentIndex];
  }

  /** @method next */
  next(): void {
    if (this.animating || this.games.length === 0) return;
    this.direction = 'right';
    this.triggerAnimation(() => {
      this.currentIndex = (this.currentIndex + 1) % this.games.length;
    });
  }

  /** @method prev */
  prev(): void {
    if (this.animating || this.games.length === 0) return;
    this.direction = 'left';
    this.triggerAnimation(() => {
      this.currentIndex = (this.currentIndex - 1 + this.games.length) % this.games.length;
    });
  }

  /**
   * @method triggerAnimation
   * @param {() => void} changeFn
   */
  private triggerAnimation(changeFn: () => void): void {
    this.animating = true;
    setTimeout(() => {
      changeFn();
      this.animating = false;
      this.cdr.detectChanges();
    }, 300);
  }

  /**
   * @method getBackground
   * @description Devuelve la imagen de fondo del juego (mayor resolución).
   * Usa el background del tema si existe, si no la portada large.
   * Fuerza https para evitar bloqueo de contenido mixto.
   * @param {any} game
   * @returns {string}
   */
  getBackground(game: any): string {
    const forceHttps = (uri: string) => uri?.replace('http://', 'https://');
    const isBlank    = (uri: string) => !uri || uri.includes('no-cover') || uri.includes('blankcover');

    const bg    = game?.assets?.background?.uri;
    const large = game?.assets?.['cover-large']?.uri;

    if (!isBlank(bg))    return forceHttps(bg);
    if (!isBlank(large)) return forceHttps(large);
    return 'assets/imgs/no-cover.png';
  }

  getCover(game: any): string {
    const forceHttps = (uri: string) => uri?.replace('http://', 'https://');
    const isBlank    = (uri: string) => !uri || uri.includes('no-cover') || uri.includes('blankcover');

    const medium = game?.assets?.['cover-medium']?.uri;
    const small  = game?.assets?.['cover-small']?.uri;

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
   * @method onGameClick
   * @description Navega al leaderboard del juego actual.
   */
  onGameClick(): void {
    if (this.currentGame) {
      this.router.navigate(['/game', this.currentGame.id]);
    }
  }
}