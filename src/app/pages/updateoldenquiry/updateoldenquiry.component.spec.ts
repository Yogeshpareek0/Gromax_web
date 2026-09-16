import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateoldenquiryComponent } from './updateoldenquiry.component';

describe('UpdateoldenquiryComponent', () => {
  let component: UpdateoldenquiryComponent;
  let fixture: ComponentFixture<UpdateoldenquiryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateoldenquiryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateoldenquiryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
