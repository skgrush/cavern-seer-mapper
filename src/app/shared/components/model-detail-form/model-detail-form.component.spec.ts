import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelDetailFormComponent } from './model-detail-form.component';

describe('ModelDetailFormComponent', () => {
  let component: ModelDetailFormComponent;
  let fixture: ComponentFixture<ModelDetailFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelDetailFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModelDetailFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
