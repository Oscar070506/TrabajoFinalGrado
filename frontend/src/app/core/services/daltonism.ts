import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type DaltonismMode = 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';

@Injectable({ providedIn: 'root' })
export class Daltonism {
  private readonly STORAGE_KEY = 'daltonism-mode';

  private modeSubject = new BehaviorSubject<DaltonismMode>('none');
  mode$ = this.modeSubject.asObservable();

  constructor() {
    const saved = localStorage.getItem(this.STORAGE_KEY) as DaltonismMode | null;
    if (saved && saved !== 'none') this.apply(saved);
  }

  get mode(): DaltonismMode {
    return this.modeSubject.value;
  }

  get isActive(): boolean {
    return this.modeSubject.value !== 'none';
  }

  setMode(mode: DaltonismMode): void {
    this.apply(mode);
  }

  cycle(): void {
    const order: DaltonismMode[] = ['none', 'deuteranopia', 'protanopia', 'tritanopia'];
    const next = order[(order.indexOf(this.mode) + 1) % order.length];
    this.apply(next);
  }

  private apply(mode: DaltonismMode): void {
    document.body.classList.remove('daltonism', 'daltonism-deuteranopia', 'daltonism-protanopia', 'daltonism-tritanopia');
    this.modeSubject.next(mode);
    localStorage.setItem(this.STORAGE_KEY, mode);
    if (mode !== 'none') {
      document.body.classList.add('daltonism', `daltonism-${mode}`);
    }
  }
}