import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatTableModule } from '@angular/material/table';
import { ProductBacklogItemListComponent } from './product-backlog-item-list.component';
import { ProductBacklogItemService } from '../product-backlog-item.service';
import { ProductBacklogItem } from '../product-backlog-item';


describe('ProductBacklogItemListComponent', () => {
  let component: ProductBacklogItemListComponent;
  let fixture: ComponentFixture<ProductBacklogItemListComponent>;
  let productBacklogItemService: ProductBacklogItemService;
  let productBacklogItemServiceStub: Partial<ProductBacklogItemService> = jasmine.createSpyObj({
    list: of([
      new ProductBacklogItem("first", 0, 1, 2),
      new ProductBacklogItem("second", 3, 4, 5),
    ]),
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        MatTableModule,
      ],
      declarations: [ProductBacklogItemListComponent],
      providers: [{ provide: ProductBacklogItemService, useValue: productBacklogItemServiceStub }]
    }).compileComponents();
    fixture = TestBed.createComponent(ProductBacklogItemListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    productBacklogItemService = fixture.debugElement.injector.get(ProductBacklogItemService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
