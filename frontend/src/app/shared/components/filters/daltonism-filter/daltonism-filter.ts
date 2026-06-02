import { DaltonismMode } from './../../../../core/services/daltonism';
import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Eye, EyeOff, CircleDot } from 'lucide-angular';
import { Daltonism } from './../../../../core/services/daltonism';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-daltonism-filter',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TranslateModule],
  templateUrl: './daltonism-filter.html',
  styleUrl: './daltonism-filter.css'
})
export class DaltonismFilterComponent {
  daltonismMenuOpen = false;

  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly CircleDot = CircleDot;

  constructor(public daltonism: Daltonism) {}

  setMode(mode: DaltonismMode): void {
    this.daltonism.setMode(mode);
    this.daltonismMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.daltonism-menu')) {
      this.daltonismMenuOpen = false;
    }
  }
}