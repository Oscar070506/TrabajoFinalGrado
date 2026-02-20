import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RunRow } from './run-row';

describe('RunRow', () => {
  let component: RunRow;
  let fixture: ComponentFixture<RunRow>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RunRow]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RunRow);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
