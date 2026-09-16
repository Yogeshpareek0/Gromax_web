import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SevendayenquiryComponent } from './sevendayenquiry.component';

describe('SevendayenquiryComponent', () => {
  let component: SevendayenquiryComponent;
  let fixture: ComponentFixture<SevendayenquiryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SevendayenquiryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SevendayenquiryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
