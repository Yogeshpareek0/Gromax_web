import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FieldTechnicalReportComponent } from './field-technical-report.component';

describe('FieldTechnicalReportComponent', () => {
  let component: FieldTechnicalReportComponent;
  let fixture: ComponentFixture<FieldTechnicalReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FieldTechnicalReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FieldTechnicalReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
