import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InventoryService } from '../inventory.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrdersSavedEvent } from '../events/orders-saved.event';
import { OrdersService } from '../orders.service';
import { Product } from '../entities/product.entity';

@Injectable()
export class InventorySavedListener {
  constructor(
    private inventoryService: InventoryService,
    private ordersService: OrdersService,
    private eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('inventory.saved')
  async countProductInventory(event: OrdersSavedEvent) {
    // const productQuery = new ProductQueryInput();
    // productQuery.shop = event.shop;
    // productQuery.sort = -1;
    // productQuery.limit = 10000;
    const StoreProducts: Product[] =
      await this.inventoryService.findAllProducts(event.shop);
    // map => variants check qty > 1, outofstock 0 else 1
    const res = StoreProducts.map((product) => {
      const isAvailable = product.variants.some(
        (item) => item.inventoryQuantity > 0,
      );
      product.outofstock = !isAvailable;
    });

    const blukWrite = StoreProducts.map((item) => {
      return {
        updateOne: {
          filter: { id: item.id },
          update: { $set: { outofstock: item.outofstock } },
        },
      };
    });

    await this.inventoryService.setPurchaseCount(blukWrite);
    console.log('Product out of stock updated...');
  }
}