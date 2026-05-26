import { Component, Input, OnChanges, OnInit, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CategoryFiltersComponent } from '../filters/category-filters/category-filters';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-game-leaderboard',
  standalone: true,
  imports: [CommonModule, CategoryFiltersComponent, RouterModule],
  templateUrl: './game-leaderboard.html',
  styleUrls: ['./game-leaderboard.css']
})
export class GameLeaderboardComponent implements OnInit, OnChanges {

  @Input() leaderboardUrl: string = '';

  leaderboard: any[] = [];
  paginated: any[] = [];
  categories: any[] = [];
  activeCategoryId: string = '';
  currentPage: number = 0;
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
    if (this.leaderboardUrl) this.init(this.leaderboardUrl);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['leaderboardUrl'] && this.leaderboardUrl) {
      this.init(this.leaderboardUrl);
    }
  }

  init(url: string): void {
    const match = url.match(/leaderboards\/([^/]+)\/category\/([^/]+)/);
    if (!match) return;
    const gameId     = match[1];
    const categoryId = match[2];
    this.activeCategoryId = categoryId;
    this.loading = true;
    this.error   = null;

    this.loadCategories(gameId, () => {
      this.fetchLeaderboardWithFallback(url, gameId);
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
        if (err.status === 400 && this.categories.length > 0) {
          const firstCategory   = this.categories[0];
          const fallbackUrl     = `${this.API}/leaderboards/${gameId}/category/${firstCategory.id}`;
          this.activeCategoryId = firstCategory.id;
          this.cdr.detectChanges();
          this.fetchLeaderboard(fallbackUrl);
        } else if (err.status === 400 && this.categories.length === 0) {
          this.error   = 'Las runs de este juego pueden estar registradas bajo el título base en speedrun.com.';
          this.loading = false;
          this.cdr.detectChanges();
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