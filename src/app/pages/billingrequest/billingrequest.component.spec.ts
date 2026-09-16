import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillingrequestComponent } from './billingrequest.component';

describe('BillingrequestComponent', () => {
  let component: BillingrequestComponent;
  let fixture: ComponentFixture<BillingrequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillingrequestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillingrequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
