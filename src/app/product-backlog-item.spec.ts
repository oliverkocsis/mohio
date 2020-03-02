import { ProductBacklogItem } from './product-backlog-item';

describe('ProductBacklogItem', () => {
  it('has the attributes of a description, order, estimate, and value', () => {
    const productBacklogItem = new ProductBacklogItem("Description", 0, 1, 2);
    expect(productBacklogItem.description).toBe("Description");
    expect(productBacklogItem.order).toBe(0);
    expect(productBacklogItem.estimate).toBe(1);
    expect(productBacklogItem.value).toBe(2);
  });
});
