import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RightTabNavComponent } from './right-tab-nav.component';

describe('RightTabNavComponent', () => {
  let component: RightTabNavComponent;
  let fixture: ComponentFixture<RightTabNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RightTabNavComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RightTabNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
