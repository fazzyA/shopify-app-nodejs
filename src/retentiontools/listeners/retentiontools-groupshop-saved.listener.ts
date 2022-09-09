import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RTPCreatedEvent } from '../events/create-retention-tools.event';
import { StoresService } from 'src/stores/stores.service';
import { OrdersService } from 'src/inventory/orders.service';
import { OrderPlacedEvent } from 'src/shopify-store/events/order-placed.envent';
import { OrderPlacedListener } from 'src/groupshops/listeners/order-placed.listener';

@Injectable()
export class RTSSavedListener {
  constructor(
    private eventEmitter: EventEmitter2,
    private storesService: StoresService,
    private orderService: OrdersService,
    private orderPlacedListener: OrderPlacedListener,
  ) {}

  @OnEvent('retention-tools-groupshop.saved')
  async createpastGS(event: RTPCreatedEvent) {
    console.log('RTPCreatedEvent');
    const shop = event.shop;
    const startDate = event.startDate;
    const endDate = event.endDate;
    const minOrderValue = event.minOrderValue;
    const getOrderList = await this.orderService.findpendinggroupshop(
      shop,
      startDate,
      endDate,
      minOrderValue,
    );
    const getActiveCampaing =
      await this.storesService.findOneWithActiveCampaing(shop);

    const blukGSCreate = getOrderList.map(async (item, index) => {
      console.log(index + ' = ' + item.name);
      const newOrderPlaced = new OrderPlacedEvent();
      newOrderPlaced.klaviyo = item.customer;
      newOrderPlaced.order = item;
      newOrderPlaced.store = getActiveCampaing;
      newOrderPlaced.lineItems = item.lineItems;
      this.orderPlacedListener.createGroupShop(newOrderPlaced);
      // this.eventEmitter.emit('order.placed', newOrderPlaced);
    });
  }
}
