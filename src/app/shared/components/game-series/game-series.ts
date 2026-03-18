import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';

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
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './game-series.html',
  styleUrls: ['./game-series.css']
})
export class GameSeries implements OnInit {

  // ── Identidad de la serie ─────────────────────────
  seriesId   = '';
  seriesName = '';

  // ── Estado de juegos ──────────────────────────────
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

  // ── Control interno ───────────────────────────────
  /** Subject para el debounce de la búsqueda */
  private search$ = new Subject<string>();

  /** Bandera para evitar doble inicialización */
  private initialized = false;

  private readonly API       = 'https://www.speedrun.com/api/v1';
  private readonly PAGE_SIZE = 200;
  private readonly HEADERS   = new HttpHeaders({ 'Accept': 'application/json' });

  constructor(
    private route:  ActivatedRoute,
    private router: Router,
    private http:   HttpClient,
    private cdr:    ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.initialized) return;
    this.initialized = true;

    this.seriesId = this.route.snapshot.paramMap.get('id') ?? '';

    // Debounce de búsqueda local (no hace llamadas a la API)
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(q => this.applyFilter(q));

    this.fetchAll();
  }

  // ── Carga de datos ────────────────────────────────

  /**
   * Orquestador principal. Lanza en paralelo la carga del nombre
   * de la serie y todos los juegos (con paginación).
   */
  private fetchAll(): void {
    this.loading = true;
    this.error   = null;
    this.allGames = [];

    // Nombre de la serie (si falla, no bloquea la carga de juegos)
    this.http
      .get<any>(`${this.API}/series/${this.seriesId}`, { headers: this.HEADERS })
      .pipe(catchError(() => of(null)))
      .subscribe(res => {
        this.seriesName = res?.data?.names?.international ?? '';
        this.cdr.detectChanges();
      });

    // Juegos con paginación completa
    this.fetchAllGames$(0, []).subscribe({
      next: games => {
        this.allGames      = games;
        this.filteredGames = [...games];
        this.loading       = false;
        this.cdr.detectChanges();
      },
      error: err => {
        this.error   = `Error ${err.status ?? 0}: ${err.message}`;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Paginación recursiva sobre /series/:id/games.
   * Se llama a sí misma aumentando el offset hasta que la página
   * devuelta tenga menos resultados que PAGE_SIZE.
   */
  private fetchAllGames$(offset: number, accumulated: any[]): Observable<any[]> {
    return this.http
      .get<any>(`${this.API}/series/${this.seriesId}/games`, {
        headers: this.HEADERS,
        params: { max: String(this.PAGE_SIZE), offset: String(offset) }
      })
      .pipe(
        switchMap(res => {
          const page = res.data ?? [];
          const all  = [...accumulated, ...page];
          // Página llena → puede haber más
          return page.length === this.PAGE_SIZE
            ? this.fetchAllGames$(offset + this.PAGE_SIZE, all)
            : of(all);
        })
      );
  }

  // ── Búsqueda y filtrado local ─────────────────────

  /** Emite el valor del input al Subject con debounce */
  onSearch(): void { this.search$.next(this.searchQuery.trim()); }

  /** Limpia la búsqueda y restaura la lista completa */
  clearSearch(): void {
    this.searchQuery   = '';
    this.filteredGames = [...this.allGames];
  }

  /**
   * Filtra la lista de juegos localmente.
   * No realiza llamadas adicionales a la API.
   */
  private applyFilter(q: string): void {
    this.filteredGames = q
      ? this.allGames.filter(g => this.getName(g).toLowerCase().includes(q.toLowerCase()))
      : [...this.allGames];
    this.cdr.detectChanges();
  }

  // ── Helpers de plantilla ──────────────────────────

  /** Devuelve la mejor URL de portada disponible */
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

  /** Navega al detalle del juego */
  onGameClick(game: any): void { this.router.navigate(['/game', game.id]); }

  /** Vuelve al catálogo principal */
  goBack(): void { this.router.navigate(['/game']); }
}