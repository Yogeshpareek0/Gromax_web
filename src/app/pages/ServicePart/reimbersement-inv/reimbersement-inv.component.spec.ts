import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReimbersementInvComponent } from './reimbersement-inv.component';

describe('ReimbersementInvComponent', () => {
  let component: ReimbersementInvComponent;
  let fixture: ComponentFixture<ReimbersementInvComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReimbersementInvComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReimbersementInvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
