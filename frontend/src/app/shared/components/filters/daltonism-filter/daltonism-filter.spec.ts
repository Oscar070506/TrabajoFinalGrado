import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DaltonismFilter } from './daltonism-filter';

describe('DaltonismFilter', () => {
  let component: DaltonismFilter;
  let fixture: ComponentFixture<DaltonismFilter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DaltonismFilter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DaltonismFilter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
