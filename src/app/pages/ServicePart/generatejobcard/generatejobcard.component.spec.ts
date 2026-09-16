import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneratejobcardComponent } from './generatejobcard.component';

describe('GeneratejobcardComponent', () => {
  let component: GeneratejobcardComponent;
  let fixture: ComponentFixture<GeneratejobcardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeneratejobcardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeneratejobcardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
