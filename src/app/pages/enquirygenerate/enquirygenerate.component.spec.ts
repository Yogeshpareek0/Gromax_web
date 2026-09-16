import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnquirygenerateComponent } from './enquirygenerate.component';

describe('EnquirygenerateComponent', () => {
  let component: EnquirygenerateComponent;
  let fixture: ComponentFixture<EnquirygenerateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnquirygenerateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnquirygenerateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
