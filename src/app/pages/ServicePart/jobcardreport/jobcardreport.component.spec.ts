import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobcardreportComponent } from './jobcardreport.component';

describe('JobcardreportComponent', () => {
  let component: JobcardreportComponent;
  let fixture: ComponentFixture<JobcardreportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobcardreportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobcardreportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
