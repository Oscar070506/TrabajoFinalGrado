import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-category-filters',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-filters.html',
  styleUrls: ['./category-filters.css']
})
export class CategoryFiltersComponent {

  /** Lista de categorías per-game del juego actual. */
  @Input() categories: any[] = [];

  /** ID de la categoría actualmente seleccionada. */
  @Input() activeCategoryId: string = '';

  /** Emite la URL del leaderboard de la categoría pulsada. */
  @Output() categorySelected = new EventEmitter<string>();

  select(category: any): void {
    const url = category.links?.find((l: any) => l.rel === 'leaderboard')?.uri;
    if (url) this.categorySelected.emit(url);
  }
}