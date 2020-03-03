import { TestBed } from '@angular/core/testing';

import { ProductBacklogItemService } from './product-backlog-item.service';
import { ProductBacklogItem } from './product-backlog-item';


describe('ProductBacklogItemService', () => {

  const productBacklogItemServiceStub = new ProductBacklogItemService()

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: ProductBacklogItemService, useValue: productBacklogItemServiceStub }],
    });
  });

  it('should create ProductBacklogItem', (done) => {
    const service: ProductBacklogItemService = TestBed.get(ProductBacklogItemService);
    const productBacklogItem = new ProductBacklogItem("Description", 0, 1, 2);
    service.create(productBacklogItem).subscribe((id) => {
      expect(id).toBeDefined();
      done();
    });
  });

  it('should read ProductBacklogItem', (done) => {
    const service: ProductBacklogItemService = TestBed.get(ProductBacklogItemService);
    const productBacklogItem = new ProductBacklogItem("Description", 0, 1, 2);
    service.create(productBacklogItem).subscribe((id) => {
      const productBacklogItemRead = service.read(id).subscribe((productBacklogItemRead: ProductBacklogItem) => {
        expect(productBacklogItemRead.description).toBe(productBacklogItem.description);
        expect(productBacklogItemRead.order).toBe(productBacklogItem.order);
        expect(productBacklogItemRead.estimate).toBe(productBacklogItem.estimate);
        expect(productBacklogItemRead.value).toBe(productBacklogItem.value);
        done();
      });
    });
  });
});