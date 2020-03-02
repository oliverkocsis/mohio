import { Component, OnInit } from '@angular/core';
import { ProductBacklogItem } from '../product-backlog-item';
import { ProductBacklogItemService } from '../product-backlog-item.service';

@Component({
  selector: 'app-product-backlog-item-list',
  templateUrl: './product-backlog-item-list.component.html',
  styleUrls: ['./product-backlog-item-list.component.scss']
})
export class ProductBacklogItemListComponent implements OnInit {

  public productBacklogItemList: ProductBacklogItem[];

  constructor(private productBacklogItemService: ProductBacklogItemService) { }

  ngOnInit() {
    this.productBacklogItemList = [];
    this.productBacklogItemService.list().subscribe((productBacklogItem: ProductBacklogItem) => {
      this.productBacklogItemList.push(productBacklogItem);
    });
  }

}
