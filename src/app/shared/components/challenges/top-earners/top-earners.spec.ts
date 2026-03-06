import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopEarners } from './top-earners';

describe('TopEarners', () => {
  let component: TopEarners;
  let fixture: ComponentFixture<TopEarners>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopEarners]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopEarners);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
