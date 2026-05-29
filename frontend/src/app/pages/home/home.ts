import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {

  logoVisible: boolean = false;
  btn1Visible: boolean = false;
  btn2Visible: boolean = false;

  ngOnInit(): void {
    setTimeout(() => this.logoVisible = true, 300);
    setTimeout(() => this.btn1Visible = true, 500);
    setTimeout(() => this.btn2Visible = true, 500);
  }
}