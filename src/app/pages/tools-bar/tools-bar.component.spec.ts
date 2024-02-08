import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolsBarComponent } from './tools-bar.component';

describe('ToolsBarComponent', () => {
  let component: ToolsBarComponent;
  let fixture: ComponentFixture<ToolsBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolsBarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ToolsBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
