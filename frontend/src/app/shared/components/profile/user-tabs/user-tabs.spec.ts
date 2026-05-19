import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserTabs } from './user-tabs';

describe('UserTabs', () => {
  let component: UserTabs;
  let fixture: ComponentFixture<UserTabs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserTabs]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserTabs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
