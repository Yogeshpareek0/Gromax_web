import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdiReportComponent } from './pdi-report.component';

describe('PdiReportComponent', () => {
  let component: PdiReportComponent;
  let fixture: ComponentFixture<PdiReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdiReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdiReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
