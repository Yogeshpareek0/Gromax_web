import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryDataComponent } from './inventory-data.component';

describe('InventoryDataComponent', () => {
  let component: InventoryDataComponent;
  let fixture: ComponentFixture<InventoryDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryDataComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventoryDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
