import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * @component UserAboutComponent
 * @description Muestra estadísticas calculadas del usuario a partir
 * de los endpoints públicos disponibles de speedrun.com.
 */
@Component({
  selector: 'app-user-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-about.html',
  styleUrls: ['./user-about.css']
})
export class UserAbout implements OnInit {

  @Input() userId: string = '';

  loading: boolean = false;
  error: string | null = null;

  totalRuns: number        = 0;
  fullGameRuns: number     = 0;
  levelRuns: number        = 0;
  uniqueGames: number      = 0;
  uniqueCategories: number = 0;
  totalTimeSecs: number    = 0;
  firstRun: string | null  = null;
  lastRun: string | null   = null;

  gamesMod: number = 0;

  private readonly API = 'https://www.speedrun.com/api/v1';

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (this.userId) this.fetchAll();
  }

  fetchAll(): void {
    this.loading = true;
    this.error   = null;

    forkJoin({
      runs: this.http.get<any>(`${this.API}/runs`, {
        params: { user: this.userId, max: 200, orderby: 'date', direction: 'asc' }
      }).pipe(catchError(() => of({ data: [] }))),
      modGames: this.http.get<any>(`${this.API}/games`, {
        params: { moderator: this.userId, max: 200 }
      }).pipe(catchError(() => of({ data: [] })))
    }).subscribe({
      next: ({ runs, modGames }) => {
        this.processRuns(runs.data ?? []);
        this.gamesMod = modGames?.data?.length ?? 0;
        this.loading  = false;
        this.cdr.detectChanges();
      },
      error: err => {
        this.error   = `Error cargando estadísticas: ${err.message}`;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private processRuns(runs: any[]): void {
    this.totalRuns    = runs.length;
    this.fullGameRuns = runs.filter(r => !r.level).length;
    this.levelRuns    = runs.filter(r =>  r.level).length;

    const gameIds     = new Set(runs.map(r => r.game).filter(Boolean));
    const categoryIds = new Set(runs.map(r => r.category).filter(Boolean));
    this.uniqueGames      = gameIds.size;
    this.uniqueCategories = categoryIds.size;

    this.totalTimeSecs = runs.reduce((acc, r) => acc + (r?.times?.primary_t ?? 0), 0);

    const dated  = runs.filter(r => r.date).sort((a, b) => a.date.localeCompare(b.date));
    this.firstRun = dated[0]?.date ?? null;
    this.lastRun  = dated[dated.length - 1]?.date ?? null;
  }

  formatTime(secs: number): string {
    if (!secs) return '0s';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    return [h ? `${h}h` : '', m ? `${m}m` : '', s ? `${s}s` : ''].filter(Boolean).join(' ');
  }

  formatDate(date: string | null): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }
}