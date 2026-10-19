import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemScoreReportComponent } from './item-score-report.component';

describe('ItemScoreReportComponent', () => {
  let component: ItemScoreReportComponent;
  let fixture: ComponentFixture<ItemScoreReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemScoreReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemScoreReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
