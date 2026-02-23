import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './search.html',
  styleUrls: ['./search.css']
})
export class SearchBarComponent implements OnInit, OnDestroy {

  // Emite el término de búsqueda hacia el componente padre (game-home)
  @Output() search = new EventEmitter<string>();

  searchControl = new FormControl('');
  private sub!: Subscription;

  ngOnInit(): void {
    this.sub = this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(query => this.search.emit(query ?? ''));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}