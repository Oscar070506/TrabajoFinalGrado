import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { LucideAngularModule, Trophy, Target } from 'lucide-angular';@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})

export class Navbar {

  menuOpen: boolean = false;

  readonly Trophy = Trophy;
  readonly Target = Target;

  toggleMenu(){
    this.menuOpen = !this.menuOpen;
  }
}
