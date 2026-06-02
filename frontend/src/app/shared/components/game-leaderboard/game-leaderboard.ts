import { Component, Input, OnChanges, OnInit, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CategoryFiltersComponent } from '../filters/category-filters/category-filters';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-game-leaderboard',
  standalone: true,
  imports: [CommonModule, CategoryFiltersComponent, RouterModule, TranslateModule],
  templateUrl: './game-leaderboard.html',
  styleUrls: ['./game-leaderboard.css']
})
export class GameLeaderboardComponent implements OnInit, OnChanges {

  @Input() gameId: string = '';

  leaderboard: any[] = [];
  paginated: any[] = [];
  categories: any[] = [];
  activeCategoryId: string = '';
  currentPage: number = 0;
  private currentGameId: string = '';
  readonly pageSize: number = 10;
  loading: boolean = false;
  error: string | null = null;

  private players: Record<string, any> = {};
  protected readonly Math = Math;
  private readonly API = 'https://www.speedrun.com/api/v1';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.gameId) setTimeout(() => this.init(this.gameId), 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    const change = changes['gameId'];
    if (change && this.gameId && this.gameId !== change.previousValue) {
      setTimeout(() => this.init(this.gameId), 0);
    }
  }

  init(gameId: string): void {
    this.currentGameId = gameId;
    this.loading = true;
    this.error   = null;

    this.loadCategories(gameId, () => {
      if (this.categories.length > 0) {
        const firstCategory   = this.categories[0];
        this.activeCategoryId = firstCategory.id;
        this.cdr.detectChanges();

        const url = firstCategory.links?.find((l: any) => l.rel === 'leaderboard')?.uri;
        if (!url) {
          this.error   = 'No se encontró el leaderboard para esta categoría.';
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }

        this.fetchLeaderboardWithFallback(url, gameId);
      } else {
        this.error   = 'No se encontraron categorías para este juego.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadCategories(gameId: string, callback: () => void): void {
    this.http.get<any>(`${this.API}/games/${gameId}/categories`).subscribe({
      next: res => {
        this.categories = (res.data ?? []).filter((c: any) => c.type === 'per-game');
        this.cdr.detectChanges();
        callback();
      },
      error: () => {
        this.categories = [];
        callback();
      }
    });
  }

  fetchLeaderboardWithFallback(url: string, gameId: string): void {
    this.http.get<any>(url, { params: { embed: 'players' } }).subscribe({
      next: res => {
        this.processLeaderboardResponse(res);
      },
      error: err => {
        if (err.status === 400) {
          this.tryNextCategory(gameId, 1);
        } else {
          this.error   = `Error cargando leaderboard: ${err.message}`;
          this.loading = false;
          this.cdr.detectChanges();
        }
      }
    });
  }

  tryNextCategory(gameId: string, index: number): void {
    if (index >= this.categories.length) {
      this.error   = 'No se encontró ningún leaderboard disponible para este juego.';
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    const category        = this.categories[index];
    this.activeCategoryId = category.id;
    this.cdr.detectChanges();

    const url = category.links?.find((l: any) => l.rel === 'leaderboard')?.uri;
    if (!url) {
      this.tryNextCategory(gameId, index + 1);
      return;
    }

    this.http.get<any>(url, { params: { embed: 'players' } }).subscribe({
      next: res => {
        this.processLeaderboardResponse(res);
      },
      error: err => {
        if (err.status === 400) {
          this.tryNextCategory(gameId, index + 1);
        } else {
          this.error   = `Error cargando leaderboard: ${err.message}`;
          this.loading = false;
          this.cdr.detectChanges();
        }
      }
    });
  }

  onCategorySelected(url: string): void {
    const match = url.match(/category\/([^/]+)/);
    if (match) this.activeCategoryId = match[1];
    this.fetchLeaderboard(url);
  }

  fetchLeaderboard(url: string): void {
    this.loading     = true;
    this.error       = null;
    this.leaderboard = [];
    this.paginated   = [];

    this.http.get<any>(url, { params: { embed: 'players' } }).subscribe({
      next: res => this.processLeaderboardResponse(res),
      error: err => {
        this.error   = `Error cargando leaderboard: ${err.message}`;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  processLeaderboardResponse(res: any): void {
    const playerList: any[] = res.data?.players?.data ?? [];
    this.players = {};
    for (const p of playerList) {
      if (p?.id) this.players[p.id] = p;
    }

    this.leaderboard = res.data?.runs?.map((r: any) => r.run) ?? [];
    this.currentPage = 0;
    this.updatePagination();
    this.loading = false;
    this.cdr.detectChanges();
  }

  updatePagination(): void {
    const start    = this.currentPage * this.pageSize;
    this.paginated = this.leaderboard.slice(start, start + this.pageSize);
  }

  nextPage(): void {
    if ((this.currentPage + 1) * this.pageSize < this.leaderboard.length) {
      this.currentPage++; this.updatePagination(); this.cdr.detectChanges();
    }
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--; this.updatePagination(); this.cdr.detectChanges();
    }
  }

  openVideo(run: any): void {
    const url = run?.videos?.links?.[0]?.uri;
    if (!url) return;
    window.open(url, '_blank', 'width=900,height=540,left=200,top=200');
  }

  getPlayerName(run: any): string {
    const player = run?.players?.[0];
    if (!player) return 'Anónimo';
    if (player.rel === 'user') {
      const user = this.players[player.id];
      return user?.names?.international ?? user?.names?.japanese ?? player.id;
    }
    if (player.rel === 'guest') return player.name ?? 'Invitado';
    return 'Anónimo';
  }

  getPlayerId(run: any): string {
    const player = run?.players?.[0];
    if (!player || player.rel !== 'user') return '';
    return player.id;
  }

  getPlayerColor(run: any): string {
    const player = run?.players?.[0];
    if (!player || player.rel !== 'user') return 'var(--text-primary)';
    const user  = this.players[player.id];
    const style = user?.['name-style'];
    if (style?.style === 'solid') return style?.color?.light ?? 'var(--text-primary)';
    if (style?.style === 'gradient') return style?.['color-from']?.light ?? 'var(--text-primary)';
    return 'var(--text-primary)';
  }

  getTime(run: any): string {
    const time = run?.times?.primary_t;
    if (!time) return '—';
    return new Date(time * 1000).toISOString().substring(11, 19);
  }

  getTrophy(index: number): string | null {
    if (index === 0) return 'https://www.speedrun.com/images/1st.png';
    if (index === 1) return 'https://www.speedrun.com/images/2nd.png';
    if (index === 2) return 'https://www.speedrun.com/images/3rd.png';
    return null;
  }
}