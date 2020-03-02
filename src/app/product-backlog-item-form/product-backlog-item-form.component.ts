import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { ProductBacklogItemService } from '../product-backlog-item.service';
import { ProductBacklogItem } from '../product-backlog-item';

@Component({
  selector: 'app-product-backlog-item-form',
  templateUrl: './product-backlog-item-form.component.html',
  styleUrls: ['./product-backlog-item-form.component.scss']
})
export class ProductBacklogItemFormComponent implements OnInit {

  formGroup = new FormGroup({
    description: new FormControl(''),
    order: new FormControl(''),
    estimate: new FormControl(''),
    value: new FormControl(''),
  });

  constructor(private productBacklogItemService: ProductBacklogItemService) { }

  ngOnInit() { }

  onSubmit() {
    const productBacklogItem = this.formGroup.value;
    console.debug(JSON.stringify(productBacklogItem));
    this.productBacklogItemService.create(productBacklogItem as ProductBacklogItem).subscribe((id) => {
      console.info(`Product backlog item created (${id})`);
    });
    this.formGroup.setValue(ProductBacklogItem.empty());
  }

}
