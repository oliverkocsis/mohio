import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductBacklogItemListComponent } from './product-backlog-item-list.component';

describe('ProductBacklogItemListComponent', () => {
  let component: ProductBacklogItemListComponent;
  let fixture: ComponentFixture<ProductBacklogItemListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProductBacklogItemListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductBacklogItemListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
