import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  imports: [CommonModule],
  templateUrl: './order-filter.html',
  styleUrls: ['./order-filter.css']
})
export class OrderFilterComponent implements OnInit {

  /** Emite { orderby, direction } al cambiar la selección. */
  @Output() orderChanged = new EventEmitter<{ orderby: string; direction: string }>();

  readonly options = [
    { label: 'Jugadores activos',     orderby: 'active-players', direction: 'desc' },
    { label: 'Más recientes',         orderby: 'created',        direction: 'desc' },
    { label: 'Más antiguos',          orderby: 'created',        direction: 'asc'  },
    { label: 'Nombre (A–Z)',          orderby: 'name.int',       direction: 'asc'  },
    { label: 'Nombre (Z–A)',          orderby: 'name.int',       direction: 'desc' },
    { label: 'Lanzamiento (reciente)',orderby: 'released',       direction: 'desc' },
    { label: 'Lanzamiento (antiguo)', orderby: 'released',       direction: 'asc'  },
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