import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * @component LoadingSpinnerComponent
 * @description Spinner de carga reutilizable con mensaje opcional.
 *
 * @example
 * <app-loading-spinner [visible]="loading" message="Cargando juegos..."></app-loading-spinner>
 */
@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-spinner.html',
  styleUrls: ['./loading-spinner.css']
})
export class LoadingSpinnerComponent {
  /** Controla si el spinner es visible. */
  @Input() visible: boolean = true;

  /** Mensaje opcional bajo el spinner. */
  @Input() message: string = '';
}