import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NdaformComponent } from './ndaform.component';

describe('NdaformComponent', () => {
  let component: NdaformComponent;
  let fixture: ComponentFixture<NdaformComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NdaformComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NdaformComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
