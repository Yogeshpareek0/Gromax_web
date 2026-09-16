import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssigndealerenquiryComponent } from './assigndealerenquiry.component';

describe('AssigndealerenquiryComponent', () => {
  let component: AssigndealerenquiryComponent;
  let fixture: ComponentFixture<AssigndealerenquiryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssigndealerenquiryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssigndealerenquiryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
