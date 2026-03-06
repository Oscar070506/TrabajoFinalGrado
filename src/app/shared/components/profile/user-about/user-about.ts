import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * @component UserAbout
 * @description
 * Componente standalone de Angular encargado de mostrar estadísticas
 * de un usuario de speedrun.com a partir de su ID.
 * 
 * Realiza llamadas a la API pública para obtener:
 * - Runs realizadas por el usuario
 * - Juegos donde el usuario es moderador
 * 
 * Después procesa esos datos para generar estadísticas como:
 * - Número total de runs
 * - Runs de juego completo
 * - Runs de niveles
 * - Juegos únicos jugados
 * - Categorías únicas
 * - Tiempo total acumulado
 * - Primera y última run registrada
 */
@Component({
  selector: 'app-user-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-about.html',
  styleUrls: ['./user-about.css']
})
export class UserAbout implements OnInit {

  /**
   * @property userId
   * @description
   * ID del usuario de speedrun.com.
   * Se recibe desde el componente padre mediante @Input.
   */
  @Input() userId: string = '';

  /** Indica si los datos se están cargando */
  loading: boolean = false;

  /** Mensaje de error en caso de fallo en la API */
  error: string | null = null;

  /** Número total de runs del usuario */
  totalRuns: number = 0;

  /** Runs de juego completo (no de nivel individual) */
  fullGameRuns: number = 0;

  /** Runs de niveles individuales */
  levelRuns: number = 0;

  /** Cantidad de juegos distintos en los que el usuario tiene runs */
  uniqueGames: number = 0;

  /** Cantidad de categorías distintas en las que el usuario ha participado */
  uniqueCategories: number = 0;

  /** Tiempo total acumulado de todas las runs en segundos */
  totalTimeSecs: number = 0;

  /** Fecha de la primera run registrada */
  firstRun: string | null = null;

  /** Fecha de la última run registrada */
  lastRun: string | null = null;

  /** Número de juegos donde el usuario es moderador */
  gamesMod: number = 0;

  /**
   * URL base de la API pública de speedrun.com
   */
  private readonly API = 'https://www.speedrun.com/api/v1';

  /**
   * @constructor
   * @param http Cliente HTTP de Angular para realizar peticiones a la API
   * @param cdr Referencia al detector de cambios de Angular para forzar actualización de la vista
   */
  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  /**
   * @method ngOnInit
   * @description
   * Método del ciclo de vida de Angular que se ejecuta
   * cuando el componente se inicializa.
   * 
   * Si existe un userId válido se cargan las estadísticas.
   */
  ngOnInit(): void {
    if (this.userId) this.fetchAll();
  }

  /**
   * @method fetchAll
   * @description
   * Realiza las peticiones a la API necesarias para obtener
   * la información del usuario.
   * 
   * Utiliza forkJoin para ejecutar ambas peticiones en paralelo:
   * - Runs del usuario
   * - Juegos donde el usuario es moderador
   */
  fetchAll(): void {

    this.loading = true;
    this.error = null;

    /**
     * forkJoin ejecuta varias peticiones HTTP al mismo tiempo
     * y espera a que todas terminen antes de devolver el resultado.
     */
    forkJoin({

      /**
       * Petición para obtener las runs del usuario
       */
      runs: this.http.get<any>(`${this.API}/runs`, {
        params: {
          user: this.userId,
          max: 200,
          orderby: 'date',
          direction: 'asc'
        }
      }).pipe(

        /**
         * Si la API falla se devuelve un array vacío
         * para evitar que el programa se rompa
         */
        catchError(() => of({ data: [] }))
      ),

      /**
       * Petición para obtener los juegos donde el usuario es moderador
       */
      modGames: this.http.get<any>(`${this.API}/games`, {
        params: {
          moderator: this.userId,
          max: 200
        }
      }).pipe(
        catchError(() => of({ data: [] }))
      )

    }).subscribe({

      /**
       * Se ejecuta cuando ambas peticiones terminan correctamente
       */
      next: ({ runs, modGames }) => {

        /** Procesa las runs obtenidas */
        this.processRuns(runs.data ?? []);

        /** Cuenta cuantos juegos modera el usuario */
        this.gamesMod = modGames?.data?.length ?? 0;

        this.loading = false;

        /** Fuerza actualización de la vista */
        this.cdr.detectChanges();
      },

      /**
       * Manejo de errores global
       */
      error: err => {
        this.error = `Error cargando estadísticas: ${err.message}`;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * @method processRuns
   * @description
   * Procesa la lista de runs obtenidas de la API
   * para calcular estadísticas del usuario.
   * 
   * @param runs Lista de runs devueltas por la API
   */
  private processRuns(runs: any[]): void {

    /** Total de runs */
    this.totalRuns = runs.length;

    /** Runs de juego completo */
    this.fullGameRuns = runs.filter(r => !r.level).length;

    /** Runs de niveles */
    this.levelRuns = runs.filter(r => r.level).length;

    /**
     * Obtiene juegos únicos utilizando Set
     * (estructura que elimina duplicados)
     */
    const gameIds = new Set(runs.map(r => r.game).filter(Boolean));

    /**
     * Obtiene categorías únicas
     */
    const categoryIds = new Set(runs.map(r => r.category).filter(Boolean));

    this.uniqueGames = gameIds.size;
    this.uniqueCategories = categoryIds.size;

    /**
     * Calcula el tiempo total acumulado de todas las runs
     */
    this.totalTimeSecs = runs.reduce(
      (acc, r) => acc + (r?.times?.primary_t ?? 0),
      0
    );

    /**
     * Filtra runs que tengan fecha
     * y las ordena cronológicamente
     */
    const dated = runs
      .filter(r => r.date)
      .sort((a, b) => a.date.localeCompare(b.date));

    /** Primera run registrada */
    this.firstRun = dated[0]?.date ?? null;

    /** Última run registrada */
    this.lastRun = dated[dated.length - 1]?.date ?? null;
  }

  /**
   * @method formatTime
   * @description
   * Convierte segundos a formato legible (h m s).
   * 
   * @param secs Tiempo en segundos
   * @returns Tiempo formateado
   */
  formatTime(secs: number): string {

    if (!secs) return '0s';

    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);

    return [h ? `${h}h` : '', m ? `${m}m` : '', s ? `${s}s` : '']
      .filter(Boolean)
      .join(' ');
  }

  /**
   * @method formatDate
   * @description
   * Convierte una fecha ISO a formato local español.
   * 
   * @param date Fecha en formato string
   * @returns Fecha formateada
   */
  formatDate(date: string | null): string {

    if (!date) return '—';

    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}