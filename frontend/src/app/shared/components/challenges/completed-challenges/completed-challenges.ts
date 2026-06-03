import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TranslateModule } from '@ngx-translate/core';
import { TopEarnersComponent } from '../top-earners/top-earners';

@Component({
  selector: 'app-completed-challenges',
  standalone: true,
  imports: [CommonModule, RouterModule, TopEarnersComponent, TranslateModule],
  templateUrl: './completed-challenges.html',
  styleUrls: ['./completed-challenges.css']
})
export class CompletedChallengesComponent implements OnInit {

  challenges: any[] = [];
  loading: boolean = true;
  error: string | null = null;
  activeTabs: Record<number, string> = {};

  private readonly API_V2 = 'https://www.speedrun.com/api/v2';
  private readonly BASE   = 'https://www.speedrun.com';

  private readonly CHALLENGE_IDS: string[] = [
    '0z3180yv', 'vxpr07pl', 'jm3q7mpn', 'dz357epg', 'e7yk8nyl',
    'vx308zp2', 'kwyj2pgm', '9x32q3l6', '1r3x8pj0', 'jm3qmpnq',
    'vd39ep5n', 'ml3l8pr0', '5e3eoymq', '42ymr396', '1r3xg8yj',
    'vd39zep5', 'og376qpv', '42ymrr39', 'l0yzny8e', 'jkyo6y9n',
    '21yg1y5v', 'xny8nyl5', '64y623rv', '0z310pvk', 'lwp40yez',
    'dz35e3g5', 'vx30zp26', 'og37qyvl', 'vxpr73le', 'ml3lo83r'
  ];

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.fetchChallenges();
  }

  fetchChallenges(): void {
    const calls = this.CHALLENGE_IDS.map(id =>
      this.http.get<any>(`${this.API_V2}/GetChallenge?id=${id}`)
        .pipe(catchError(() => of(null)))
    );

    forkJoin(calls).subscribe({
      next: results => {
        this.challenges = results.filter(r => r !== null);
        this.loading    = false;
        this.cdr.detectChanges();
      },
      error: err => {
        this.error   = `Error cargando challenges: ${err.message}`;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  scrollToNext(currentId: string): void {
    const slides = document.querySelectorAll('.challenge-slide');
    const ids = this.challenges.map(c => c.challenge.id);
    const currentIndex = ids.indexOf(currentId);
    if (currentIndex < slides.length - 1) {
      slides[currentIndex + 1].scrollIntoView({ behavior: 'smooth' });
    }
  }

  getBackground(c: any): string {
    const bg = c?.theme?.staticAssets?.find((a: any) => a.assetType === 'background');
    return bg ? `${this.BASE}${bg.path}` : '';
  }

  getCover(c: any): string {
    return c?.challenge?.coverImagePath
      ? `${this.BASE}${c.challenge.coverImagePath}`
      : '';
  }

  getLogo(c: any): string {
    const logo = c?.theme?.staticAssets?.find((a: any) => a.assetType === 'logo');
    return logo ? `${this.BASE}${logo.path}` : '';
  }

  getPrizePool(c: any): string {
    const amount = c?.challenge?.prizeConfig?.prizePool;
    if (!amount) return '';
    return `$${(amount / 100).toLocaleString('en-US')}`;
  }

  getTop3(c: any): { place: number; user: any; prize: string }[] {
    const standings: any[] = c?.standingList ?? [];
    const users: any[]     = c?.userList     ?? [];

    return standings
      .filter(s => s.place <= 3)
      .sort((a, b) => a.place - b.place)
      .map(s => {
        const userId = s.registeredPlayerIds?.[0];
        const user   = users.find(u => u.id === userId) ?? null;
        const prize  = s.prizeAmount ? `$${(s.prizeAmount / 100).toLocaleString('en-US')}` : '';
        return { place: s.place, user, prize };
      });
  }

  getAvatar(user: any): string {
    const img = user?.staticAssets?.find((a: any) => a.assetType === 'image');
    return img ? `${this.BASE}${img.path}` : '';
  }

  getTrophy(index: number): string | null {
    if (index === 0) return 'https://www.speedrun.com/images/1st.png';
    if (index === 1) return 'https://www.speedrun.com/images/2nd.png';
    if (index === 2) return 'https://www.speedrun.com/images/3rd.png';
    return null;
  }

  isCompleted(c: any): boolean {
    return c?.challenge?.phase === 3;
  }

  getChallengeLink(c: any): string {
    const id   = c?.challenge?.id;
    const url  = c?.challenge?.url;
    const game = c?.game?.url;
    return `https://www.speedrun.com/challenges/${id}-${game}-${url}`;
  }

  getGameName(c: any): string {
    return c?.game?.name ?? '';
  }

  getChallengeName(c: any): string {
    return c?.challenge?.name ?? '';
  }


  setTab(idx: number, tab: string): void {
    this.activeTabs[idx] = tab;
  }
}