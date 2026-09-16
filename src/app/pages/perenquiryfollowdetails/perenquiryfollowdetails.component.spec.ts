import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PerenquiryfollowdetailsComponent } from './perenquiryfollowdetails.component';

describe('PerenquiryfollowdetailsComponent', () => {
  let component: PerenquiryfollowdetailsComponent;
  let fixture: ComponentFixture<PerenquiryfollowdetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerenquiryfollowdetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PerenquiryfollowdetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
