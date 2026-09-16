import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenerateenquiryComponent } from './generateenquiry.component';

describe('GenerateenquiryComponent', () => {
  let component: GenerateenquiryComponent;
  let fixture: ComponentFixture<GenerateenquiryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenerateenquiryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenerateenquiryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
