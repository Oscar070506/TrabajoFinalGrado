import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsoleFilter } from './console-filter';

describe('ConsoleFilter', () => {
  let component: ConsoleFilter;
  let fixture: ComponentFixture<ConsoleFilter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsoleFilter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsoleFilter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
