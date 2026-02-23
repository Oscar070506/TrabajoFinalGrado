import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {

  logoVisible: boolean = false;
  btn1Visible: boolean = false;
  btn2Visible: boolean = false;

  ngOnInit(): void {
    // Reproduce la misma lógica de animación escalonada del JS original
    setTimeout(() => this.logoVisible = true, 300);
    setTimeout(() => this.btn1Visible = true, 1000);
    setTimeout(() => this.btn2Visible = true, 1500);
  }
}