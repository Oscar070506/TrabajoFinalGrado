import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompletedChallengesComponent } from '../../../shared/components/challenges/completed-challenges/completed-challenges';
/**
 * @component ChallengesComponent
 * @description Página de challenges de speedrun.com.
 */
@Component({
  selector: 'app-challenges',
  standalone: true,
  imports: [CommonModule, CompletedChallengesComponent],
  templateUrl: './challenges.html',
  styleUrls: ['./challenges.css']
})
export class ChallengesComponent {}