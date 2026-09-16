import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdatedealerComponent } from './updatedealer.component';

describe('UpdatedealerComponent', () => {
  let component: UpdatedealerComponent;
  let fixture: ComponentFixture<UpdatedealerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdatedealerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdatedealerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
