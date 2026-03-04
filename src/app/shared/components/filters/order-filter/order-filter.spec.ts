import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderFilter } from './order-filter';

describe('OrderFilter', () => {
  let component: OrderFilter;
  let fixture: ComponentFixture<OrderFilter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderFilter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderFilter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
