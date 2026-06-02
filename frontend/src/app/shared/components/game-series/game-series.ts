import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, takeUntil } from 'rxjs/operators';
import { TranslateModule } from '@ngx-translate/core';

/**
 * @component GameSeries
 * @description Página de detalle de una serie. Muestra todos los juegos
 * que pertenecen a la serie obtenida por :id en la URL.
 * Carga todas las páginas disponibles (paginación recursiva con offset)
 * y permite filtrar los juegos localmente por nombre.
 */
@Component({
  selector: 'app-series-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule],
  templateUrl: './game-series.html',
  styleUrls: ['./game-series.css']
})
export class GameSeries implements OnInit, OnDestroy {

  seriesId = '';
  seriesName = '';

  /** Lista completa de juegos de la serie (todas las páginas) */
  allGames: any[] = [];

  /** Lista filtrada según el texto de búsqueda */
  filteredGames: any[] = [];

  /** Indica si la carga inicial está en curso */
  loading = false;

  /** Mensaje de error, null si no hay error */
  error: string | null = null;

  /** Texto de búsqueda introducido por el usuario */
  searchQuery = '';

  /** Subject para el debounce de la búsqueda */
  private search$ = new Subject<string>();

  /** Subject para cancelar suscripciones al destruir */
  private destroy$ = new Subject<void>();

  /** Bandera para evitar doble inicialización */
  private initialized = false;

  private readonly API = 'https://www.speedrun.com/api/v1';
  private readonly PAGE_SIZE = 200;
  private readonly HEADERS = new HttpHeaders({ 'Accept': 'application/json' });

  /** Cache de nombres de juegos para evitar recalcular */
  private gameNameCache = new Map<string, string>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.initialized) return;
    this.initialized = true;

    this.seriesId = this.route.snapshot.paramMap.get('id') ?? '';

    // Debounce de búsqueda local (no hace llamadas a la API)
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(q => this.applyFilter(q));

    this.fetchAll();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Orquestador principal. Lanza en paralelo la carga del nombre
   * de la serie y todos los juegos (con paginación).
   */
  private fetchAll(): void {
    this.loading = true;
    this.error = null;
    this.allGames = [];

    // Nombre de la serie (si falla, no bloquea la carga de juegos)
    this.http
      .get<any>(`${this.API}/series/${this.seriesId}`, { headers: this.HEADERS })
      .pipe(
        catchError(() => of(null)),
        takeUntil(this.destroy$)
      )
      .subscribe(res => {
        this.seriesName = res?.data?.names?.international ?? '';
        this.cdr.markForCheck();
      });

    this.fetchAllGames$(0, []).subscribe({
      next: (games: any[]) => {
        this.allGames = games;
        this.filteredGames = [...games];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.error = `Error ${err.status ?? 0}: ${err.message}`;
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Paginación recursiva sobre /series/:id/games.
   * Se llama a sí misma aumentando el offset hasta que la página
   * devuelta tenga menos resultados que PAGE_SIZE.
   * OPTIMIZACIÓN: Usa switchMap y evita múltiples detecciones de cambios
   */
  private fetchAllGames$(offset: number, accumulated: any[]): Observable<any[]> {
    return this.http
      .get<any>(`${this.API}/series/${this.seriesId}/games`, {
        headers: this.HEADERS,
        params: { max: String(this.PAGE_SIZE), offset: String(offset) }
      })
      .pipe(
        switchMap((res: any) => {
          const page: any[] = res.data ?? [];
          const all = [...accumulated, ...page];
          
          // Precargar nombres en caché para mejorar rendimiento
          page.forEach((game: any) => {
            const name = game?.names?.international ?? game?.names?.twitch ?? 'Sin nombre';
            this.gameNameCache.set(game.id, name);
          });
          
          // Página llena → puede haber más
          return page.length === this.PAGE_SIZE
            ? this.fetchAllGames$(offset + this.PAGE_SIZE, all)
            : of(all);
        })
      );
  }

  /** Emite el valor del input al Subject con debounce */
  onSearch(): void {
    this.search$.next(this.searchQuery.trim());
  }

  /** Limpia la búsqueda y restaura la lista completa */
  clearSearch(): void {
    this.searchQuery = '';
    this.filteredGames = [...this.allGames];
    this.cdr.markForCheck();
  }

  /**
   * Filtra la lista de juegos localmente.
   * No realiza llamadas adicionales a la API.
   * OPTIMIZACIÓN: Usa cache de nombres para evitar recalcular
   */
  private applyFilter(q: string): void {
    if (!q) {
      this.filteredGames = [...this.allGames];
      this.cdr.markForCheck();
      return;
    }
    
    const lowerQuery = q.toLowerCase();
    this.filteredGames = this.allGames.filter((game: any) => {
      const cachedName = this.gameNameCache.get(game.id);
      const gameName = cachedName || this.getName(game);
      if (!cachedName) {
        this.gameNameCache.set(game.id, gameName);
      }
      return gameName.toLowerCase().includes(lowerQuery);
    });
    this.cdr.markForCheck();
  }

  /** Devuelve la mejor URL de portada disponible con caché de URLs */
  private coverCache = new Map<string, string>();
  
  getCover(game: any): string {
    const cached = this.coverCache.get(game.id);
    if (cached) return cached;
    
    const isBlank = (uri: string) => !uri || uri.includes('no-cover.png');
    const medium = game?.assets?.['cover-medium']?.uri;
    const small = game?.assets?.['cover-small']?.uri;
    const tiny = game?.assets?.['cover-tiny']?.uri;
    
    let result = 'assets/imgs/no-cover.png';
    if (!isBlank(medium)) result = medium;
    else if (!isBlank(small)) result = small;
    else if (!isBlank(tiny)) result = tiny;
    
    this.coverCache.set(game.id, result);
    return result;
  }

  /** Devuelve el nombre internacional del juego (usa caché) */
  getName(game: any): string {
    const cached = this.gameNameCache.get(game.id);
    if (cached) return cached;
    
    const name = game?.names?.international ?? game?.names?.twitch ?? 'Sin nombre';
    this.gameNameCache.set(game.id, name);
    return name;
  }

  /** Navega al detalle del juego */
  onGameClick(game: any): void {
    this.router.navigate(['/game', game.id]);
  }

  /** Vuelve al catálogo principal */
  goBack(): void {
    this.router.navigate(['/game']);
  }
}