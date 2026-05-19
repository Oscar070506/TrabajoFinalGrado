import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

/**
 * @component ConsoleFilterComponent
 * @description Carga todas las plataformas desde la API de speedrun.com
 * y emite el ID de la seleccionada para filtrar el catálogo.
 *
 * @example
 * <app-console-filter (platformSelected)="onPlatform($event)"></app-console-filter>
 */
@Component({
  selector: 'app-console-filter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './console-filter.html',
  styleUrls: ['./console-filter.css']
})
export class ConsoleFilterComponent implements OnInit {

  /** Emite el ID de la plataforma seleccionada. `null` = todas. */
  @Output() platformSelected = new EventEmitter<string | null>();

  /** Lista de plataformas cargadas desde la API. */
  platforms: any[] = [];

  /** ID de la plataforma actualmente activa. */
  activePlatformId: string | null = null;

  loading = false;

  private offset = 0;
  private readonly PAGE = 200;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchPlatforms();
  }

  /**
   * @method fetchPlatforms
   * @description Carga todas las plataformas paginando hasta obtenerlas todas.
   */
  fetchPlatforms(): void {
    this.loading = true;
    this.loadPage();
  }

  private loadPage(): void {
    this.http.get<any>(`https://www.speedrun.com/api/v1/platforms`, {
      params: { max: this.PAGE, offset: this.offset, orderby: 'name' }
    }).subscribe({
      next: res => {
        const batch = res.data ?? [];
        this.platforms = [...this.platforms, ...batch];
        if (batch.length === this.PAGE) {
          this.offset += this.PAGE;
          this.loadPage();
        } else {
          this.loading = false;
        }
      },
      error: () => { this.loading = false; }
    });
  }

  /**
   * @method select
   * @description Selecciona una plataforma o deselecciona si ya estaba activa.
   * @param {string} id - ID de la plataforma.
   */
  select(id: string): void {
    this.activePlatformId = this.activePlatformId === id ? null : id;
    this.platformSelected.emit(this.activePlatformId);
  }

  /** @method clearFilter */
  clearFilter(): void {
    this.activePlatformId = null;
    this.platformSelected.emit(null);
  }

  onSelect(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    this.activePlatformId = id || null;
    this.platformSelected.emit(this.activePlatformId);
  }
}