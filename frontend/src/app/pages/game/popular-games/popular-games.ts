import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { GameLeaderboardComponent } from '../../../shared/components/game-leaderboard/game-leaderboard';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-popular-games',
  standalone: true,
  imports: [CommonModule, RouterModule, GameLeaderboardComponent, TranslateModule],
  templateUrl: './popular-games.html',
  styleUrls: ['./popular-games.css']
})
export class PopularGamesComponent implements OnInit {
  games: any[] = [];
  currentIndex: number = 0;
  loading: boolean = false;
  error: string | null = null;
  animating: boolean = false;
  direction: 'left' | 'right' = 'right';

  private readonly RUNS_API = 'https://www.speedrun.com/api/v1/runs';
  private readonly HEADERS  = new HttpHeaders({ 'Accept': 'application/json' });

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    const lang = localStorage.getItem('lang') || 'es';
    this.translate.use(lang);
    this.fetchPopularGames();
  }

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

  get currentGame(): any {
    return this.games[this.currentIndex];
  }

  next(): void {
    if (this.animating || this.games.length === 0) return;
    this.direction = 'right';
    this.triggerAnimation(() => {
      this.currentIndex = (this.currentIndex + 1) % this.games.length;
    });
  }

  prev(): void {
    if (this.animating || this.games.length === 0) return;
    this.direction = 'left';
    this.triggerAnimation(() => {
      this.currentIndex = (this.currentIndex - 1 + this.games.length) % this.games.length;
    });
  }

  private triggerAnimation(changeFn: () => void): void {
    this.animating = true;
    setTimeout(() => {
      changeFn();
      this.animating = false;
      this.cdr.detectChanges();
    }, 300);
  }

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

  getName(game: any): string {
    return game?.names?.international ?? game?.names?.twitch ?? this.translate.instant('USER.DEFAULT_NAME');
  }

  getReleaseYear(game: any): string {
    const date = game?.released;
    return date ? String(date).substring(0, 4) : '';
  }

  getLeaderboardUrl(game: any): string {
    return game?.links?.find((l: any) => l.rel === 'leaderboard')?.uri ?? '';
  }

  onGameClick(): void {
    if (this.currentGame) {
      this.router.navigate(['/game', this.currentGame.id]);
    }
  }
}