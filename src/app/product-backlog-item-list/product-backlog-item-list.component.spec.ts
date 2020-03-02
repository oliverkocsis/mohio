import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ProductBacklogItemListComponent } from './product-backlog-item-list.component';
import { ProductBacklogItemService } from '../product-backlog-item.service';
import { ProductBacklogItem } from '../product-backlog-item';

describe('ProductBacklogItemListComponent', () => {
  let component: ProductBacklogItemListComponent;
  let fixture: ComponentFixture<ProductBacklogItemListComponent>;
  let productBacklogItemService: ProductBacklogItemService;
  let productBacklogItemServiceStub: Partial<ProductBacklogItemService> = jasmine.createSpyObj({
    list: of([
      new ProductBacklogItem("description", 0, 1, 2),
      new ProductBacklogItem("description", 0, 1, 2),
    ]),
  });

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ProductBacklogItemListComponent],
      providers: [{ provide: ProductBacklogItemService, useValue: productBacklogItemServiceStub }]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductBacklogItemListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    productBacklogItemService = fixture.debugElement.injector.get(ProductBacklogItemService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
