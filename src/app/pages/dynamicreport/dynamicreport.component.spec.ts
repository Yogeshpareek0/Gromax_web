import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicreportComponent } from './dynamicreport.component';

describe('DynamicreportComponent', () => {
  let component: DynamicreportComponent;
  let fixture: ComponentFixture<DynamicreportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicreportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DynamicreportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
