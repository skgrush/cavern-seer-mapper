import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelNavListComponent } from './model-nav-list.component';

describe('ModelNavListComponent', () => {
  let component: ModelNavListComponent;
  let fixture: ComponentFixture<ModelNavListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelNavListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModelNavListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
