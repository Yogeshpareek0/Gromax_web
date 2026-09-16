import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusinessdatareviewComponent } from './businessdatareview.component';

describe('BusinessdatareviewComponent', () => {
  let component: BusinessdatareviewComponent;
  let fixture: ComponentFixture<BusinessdatareviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessdatareviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BusinessdatareviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
