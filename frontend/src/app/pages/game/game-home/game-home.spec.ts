import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameHome } from './game-home';

describe('GameHome', () => {
  let component: GameHome;
  let fixture: ComponentFixture<GameHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameHome]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameHome);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
