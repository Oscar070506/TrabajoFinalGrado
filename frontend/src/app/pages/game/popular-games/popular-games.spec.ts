import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopularGames } from './popular-games';

describe('PopularGames', () => {
  let component: PopularGames;
  let fixture: ComponentFixture<PopularGames>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopularGames]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopularGames);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
