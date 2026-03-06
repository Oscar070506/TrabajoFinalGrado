import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * @component TopEarnersComponent
 * @description Leaderboard global de los jugadores que más han ganado
 * en todos los challenges de speedrun.com, calculado sumando
 * las ganancias de cada usuario en cada challenge.
 */
@Component({
  selector: 'app-top-earners',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './top-earners.html',
  styleUrls: ['./top-earners.css']
})
export class TopEarnersComponent implements OnInit {

  /** Lista de top earners ordenada por ganancias totales. */
  earners: {
    userId: string;
    name: string;
    avatar: string;
    totalAmount: number;
    gold: number;
    silver: number;
    bronze: number;
    appearances: number;
  }[] = [];

  paginated: any[] = [];
  currentPage: number = 0;
  readonly pageSize: number = 10;
  protected readonly Math = Math;

  loading: boolean = false;
  error: string | null = null;

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
    this.fetchAll();
  }

  fetchAll(): void {
    this.loading = true;
    this.error   = null;

    const calls = this.CHALLENGE_IDS.map(id =>
      this.http.get<any>(`${this.API_V2}/GetChallenge?id=${id}`)
        .pipe(catchError(() => of(null)))
    );

    forkJoin(calls).subscribe({
      next: results => {
        this.earners = this.calculateEarners(results.filter(r => r !== null));
        this.currentPage = 0;
        this.updatePagination();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        this.error   = `Error: ${err.message}`;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * @method calculateEarners
   * @description Suma ganancias por usuario en todos los challenges
   * y calcula medallas de oro, plata y bronce.
   */
  private calculateEarners(challenges: any[]): any[] {
    const earnerMap = new Map<string, {
      userId: string;
      name: string;
      avatar: string;
      totalAmount: number;
      gold: number;
      silver: number;
      bronze: number;
      appearances: number;
    }>();

    for (const c of challenges) {
      const standings: any[] = c?.standingList ?? [];
      const users: any[]     = c?.userList     ?? [];

      for (const standing of standings) {
        if (!standing.prizeAmount) continue;

        const userId = standing.registeredPlayerIds?.[0];
        if (!userId) continue;

        const user   = users.find((u: any) => u.id === userId);
        const avatar = this.getAvatarFromUser(user);
        const name   = user?.name ?? userId;

        if (!earnerMap.has(userId)) {
          earnerMap.set(userId, {
            userId,
            name,
            avatar,
            totalAmount: 0,
            gold: 0,
            silver: 0,
            bronze: 0,
            appearances: 0
          });
        }

        const entry = earnerMap.get(userId)!;
        entry.totalAmount  += standing.prizeAmount;
        entry.appearances  += 1;
        if (standing.place === 1) entry.gold++;
        if (standing.place === 2) entry.silver++;
        if (standing.place === 3) entry.bronze++;
      }
    }

    return [...earnerMap.values()]
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }

  private getAvatarFromUser(user: any): string {
    const img = user?.staticAssets?.find((a: any) => a.assetType === 'image');
    return img ? `${this.BASE}${img.path}` : '';
  }

  formatAmount(cents: number): string {
    return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  }

  updatePagination(): void {
    const start    = this.currentPage * this.pageSize;
    this.paginated = this.earners.slice(start, start + this.pageSize);
  }

  nextPage(): void {
    if ((this.currentPage + 1) * this.pageSize < this.earners.length) {
      this.currentPage++;
      this.updatePagination();
      this.cdr.detectChanges();
    }
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.updatePagination();
      this.cdr.detectChanges();
    }
  }

  getTrophy(index: number): string | null {
    if (index === 0) return 'https://www.speedrun.com/images/1st.png';
    if (index === 1) return 'https://www.speedrun.com/images/2nd.png';
    if (index === 2) return 'https://www.speedrun.com/images/3rd.png';
    return null;
  }
}