import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-series-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './game-series.html',
  styleUrls: ['./game-series.css']
})
export class GameSeries implements OnInit {

  seriesId   = '';
  seriesName = '';
  games: any[] = [];
  loading  = true;
  error: string | null = null;

  private readonly HEADERS = new HttpHeaders({ 'Accept': 'application/json' });

  constructor(
    private route:  ActivatedRoute,
    private router: Router,
    private http:   HttpClient,
    private cdr:    ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.seriesId = this.route.snapshot.paramMap.get('id') ?? '';
    this.fetchSeriesGames();
  }

  fetchSeriesGames(): void {
    this.loading = true;
    this.http.get<any>(`https://www.speedrun.com/api/v1/series/${this.seriesId}/games`, {
      headers: this.HEADERS,
      params: { max: 200 }
    }).subscribe({
      next: res => {
        this.games   = res.data ?? [];
        this.loading = false;
        // Intentar obtener el nombre de la serie
        this.http.get<any>(`https://www.speedrun.com/api/v1/series/${this.seriesId}`, {
          headers: this.HEADERS
        }).subscribe(s => {
          this.seriesName = s?.data?.names?.international ?? '';
          this.cdr.detectChanges();
        });
        this.cdr.detectChanges();
      },
      error: err => {
        this.error   = `Error ${err.status}: ${err.message}`;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getCover(game: any): string {
    const isBlank = (uri: string) => !uri || uri.includes('no-cover.png');
    const medium  = game?.assets?.['cover-medium']?.uri;
    const small   = game?.assets?.['cover-small']?.uri;
    if (!isBlank(medium)) return medium;
    if (!isBlank(small))  return small;
    return 'assets/imgs/no-cover.png';
  }

  getName(game: any): string {
    return game?.names?.international ?? game?.names?.twitch ?? 'Sin nombre';
  }

  onGameClick(game: any): void { this.router.navigate(['/game', game.id]); }
  goBack(): void { this.router.navigate(['/game']); }
}