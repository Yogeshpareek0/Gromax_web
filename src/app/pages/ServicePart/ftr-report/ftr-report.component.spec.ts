import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FtrReportComponent } from './ftr-report.component';

describe('FtrReportComponent', () => {
  let component: FtrReportComponent;
  let fixture: ComponentFixture<FtrReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FtrReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FtrReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
