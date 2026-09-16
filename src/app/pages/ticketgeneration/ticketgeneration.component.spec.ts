import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TicketgenerationComponent } from './ticketgeneration.component';

describe('TicketgenerationComponent', () => {
  let component: TicketgenerationComponent;
  let fixture: ComponentFixture<TicketgenerationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketgenerationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TicketgenerationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
