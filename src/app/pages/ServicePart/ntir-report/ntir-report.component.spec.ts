import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NtirReportComponent } from './ntir-report.component';

describe('NtirReportComponent', () => {
  let component: NtirReportComponent;
  let fixture: ComponentFixture<NtirReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NtirReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NtirReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
