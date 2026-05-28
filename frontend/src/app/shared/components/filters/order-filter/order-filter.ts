import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

/**
 * @component OrderFilterComponent
 * @description Selector de ordenación para el catálogo de juegos.
 * Emite { orderby, direction } al cambiar la selección.
 * Al inicializarse emite el valor por defecto para disparar la carga inicial.
 *
 * @example
 * <app-order-filter (orderChanged)="onOrder($event)"></app-order-filter>
 */
@Component({
  selector: 'app-order-filter',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './order-filter.html',
  styleUrls: ['./order-filter.css']
})
export class OrderFilterComponent implements OnInit {

  /** Emite { orderby, direction } al cambiar la selección. */
  @Output() orderChanged = new EventEmitter<{ orderby: string; direction: string }>();

  readonly options = [
    { label: 'FILTERS.ORDER.ACTIVE_PLAYERS', orderby: 'active-players', direction: 'desc' },
    { label: 'FILTERS.ORDER.NEWEST',         orderby: 'created',        direction: 'desc' },
    { label: 'FILTERS.ORDER.OLDEST',         orderby: 'created',        direction: 'asc'  },
    { label: 'FILTERS.ORDER.NAME_AZ',        orderby: 'name.int',       direction: 'asc'  },
    { label: 'FILTERS.ORDER.NAME_ZA',        orderby: 'name.int',       direction: 'desc' },
    { label: 'FILTERS.ORDER.RELEASE_NEW',    orderby: 'released',       direction: 'desc' },
    { label: 'FILTERS.ORDER.RELEASE_OLD',    orderby: 'released',       direction: 'asc'  },
  ];

  /** Índice de la opción actualmente seleccionada. */
  activeIndex: number = 0;

  /**
   * @method ngOnInit
   * @description Emite el valor por defecto al inicializarse para
   * disparar la carga inicial en el componente padre.
   */
  ngOnInit(): void {
    this.orderChanged.emit(this.options[0]);
  }

  onNoActivePlayers(): void {
     this.activeIndex = 1;
     this.orderChanged.emit(this.options[1]);
  }   

  /**
   * @method onSelect
   * @description Emite el orden seleccionado al componente padre.
   * @param {Event} event - Evento change del select nativo.
   */
  onSelect(event: Event): void {
    const index = +(event.target as HTMLSelectElement).value;
    this.activeIndex = index;
    this.orderChanged.emit(this.options[index]);
  }
}