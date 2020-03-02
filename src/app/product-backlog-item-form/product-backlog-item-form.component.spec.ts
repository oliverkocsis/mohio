import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductBacklogItemFormComponent } from './product-backlog-item-form.component';

describe('ProductBacklogItemFormComponent', () => {
  let component: ProductBacklogItemFormComponent;
  let fixture: ComponentFixture<ProductBacklogItemFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProductBacklogItemFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductBacklogItemFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
