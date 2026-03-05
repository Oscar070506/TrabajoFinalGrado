import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserAbout } from './user-about';

describe('UserAbout', () => {
  let component: UserAbout;
  let fixture: ComponentFixture<UserAbout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserAbout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserAbout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
