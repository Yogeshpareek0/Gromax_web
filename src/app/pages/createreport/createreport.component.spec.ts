import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatereportComponent } from './createreport.component';

describe('CreatereportComponent', () => {
  let component: CreatereportComponent;
  let fixture: ComponentFixture<CreatereportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatereportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreatereportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
