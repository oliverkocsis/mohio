import { TestBed } from '@angular/core/testing';

import { ProductBacklogItemService } from './product-backlog-item.service';

describe('ProductBacklogItemService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ProductBacklogItemService = TestBed.get(ProductBacklogItemService);
    expect(service).toBeTruthy();
  });
});
