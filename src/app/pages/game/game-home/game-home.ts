// Se importa changeDetector para forzar un revisado del estado 
// del component y actualizar la vista manualmente.
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-game-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './game-home.html',
  styleUrls: ['./game-home.css']
})
export class GameHomeComponent implements OnInit {

  games: any[]         = [];
  loading: boolean     = false;
  loadingMore: boolean = false;
  error: string | null = null;
  hasMore: boolean     = false;

  private offset        = 0;
  private readonly API  = 'https://www.speedrun.com/api/v1/games';
  private readonly PAGE = 50;  // 50 juegos por página
  private readonly MAX  = 200; // límite total: los 200 más populares

  private readonly HEADERS = new HttpHeaders({
    'Accept': 'application/json'
  });

  private readonly PARAMS_BASE = {
    orderby:   'created',
    direction: 'desc',
    max:       this.PAGE
  };

  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) {}

  private initialized = false;

  ngOnInit(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.fetchGames();
  }

  fetchGames(): void {
    this.loading = true;
    this.error   = null;

    this.http.get<any>(this.API, {
      headers: this.HEADERS,
      params: { ...this.PARAMS_BASE, offset: this.offset }
    }).subscribe({
      next: response => {
        const batch  = response.data ?? [];
        this.games   = [...this.games, ...batch];
        this.offset += this.PAGE;

        // Solo mostramos el botón si aún no hemos llegado al máximo de 200
        this.hasMore = batch.length === this.PAGE && this.offset < this.MAX;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Error API:', err);
        this.error   = `Error ${err.status}: ${err.message}`;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadMore(): void {
    this.loadingMore = true;
    this.error       = null;

    this.http.get<any>(this.API, {
      headers: this.HEADERS,
      params: { ...this.PARAMS_BASE, offset: this.offset }
    }).subscribe({
      next: response => {
        const batch      = response.data ?? [];
        this.games       = [...this.games, ...batch];
        this.offset     += this.PAGE;
        this.hasMore     = batch.length === this.PAGE && this.offset < this.MAX;
        this.loadingMore = false;
      },
      error: err => {
        console.error('Error API:', err);
        this.error       = `Error ${err.status}: ${err.message}`;
        this.loadingMore = false;
      }
    });
  }

  getCover(game: any): string {
    const isBlank = (uri: string) => !uri || uri.includes('no-cover.png');

    const medium = game?.assets?.['cover-medium']?.uri;
    const small  = game?.assets?.['cover-small']?.uri;
    const tiny   = game?.assets?.['cover-tiny']?.uri;

    if (!isBlank(medium)) return medium;
    if (!isBlank(small))  return small;
    if (!isBlank(tiny))   return tiny;
    return 'assets/imgs/no-cover.png';
  }

  getName(game: any): string {
    return game?.names?.international ?? game?.names?.twitch ?? 'Sin nombre';
  }

  onGameClick(game: any): void {
    this.router.navigate(['/game', game.id]);
  }
}