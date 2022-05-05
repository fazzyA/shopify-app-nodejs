import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ShopifyService } from '../shopify/shopify.service';
import { AddResourceEvent } from 'src/stores/events/add-resource.event';
import { StoreSavedEvent } from 'src/stores/events/store-saved.event';
import { StorePlanUpdatedEvent } from 'src/stores/events/plan-updated.event';
import { OrderCreatedEvent } from '../events/order-created.event';
import { OrdersService } from 'src/inventory/orders.service';
import {
  CreateOrderInput,
  Customer,
  LineProduct,
} from 'src/inventory/dto/create-order.input';
import { OrderPlacedEvent } from '../events/order-placed.envent';
import { StoresService } from 'src/stores/stores.service';

@Injectable()
export class OrderCreatedListener {
  constructor(
    private shopifyapi: ShopifyService,
    private orderService: OrdersService,
    private eventEmitter: EventEmitter2,
    private configSevice: ConfigService,
    private storesService: StoresService,
  ) {}

  private shop: string;
  // update Plan In Shopify Billing Subscription
  @OnEvent('order.created')
  async addOrder(event: OrderCreatedEvent) {
    try {
      const { shop, webhook } = event;
      const whOrder = webhook;

      console.log(
        'WebhooksController ~ orderCreate ~ webhookData',
        JSON.stringify(whOrder),
      );
      const newOrder = new CreateOrderInput();
      newOrder.id = whOrder.admin_graphql_api_id;
      newOrder.name = '#' + JSON.stringify(whOrder.order_number);
      newOrder.shop = shop;
      newOrder.confirmed = whOrder.confirmed;
      newOrder.shopifyCreatedAt = whOrder.created_at;
      newOrder.price = whOrder.current_subtotal_price;
      newOrder.currencyCode = whOrder.currency;
      newOrder.totalDiscounts = whOrder.total_discounts;
      // newOrder.discountCode = whOrder.discount_codes[0].code || null;
      const dc = whOrder.discount_codes.filter((itm) =>
        itm.code.startsWith(this.configSevice.get('DC_PREFIX')),
      );
      newOrder.discountCode =
        dc[0]?.code || whOrder.discount_codes[0]?.code || null;
      // newOrder.discountInfo = [new DiscountInfo()];
      // newOrder.discountInfo = whOrder.discount_codes?.map(
      //   (dc: DiscountInfo) => new DiscountInfo(dc),
      // );
      newOrder.discountInfo = whOrder.discount_codes;
      newOrder.customer = new Customer();
      newOrder.customer.firstName = whOrder.customer?.first_name;
      newOrder.customer.lastName = whOrder.customer?.last_name;
      newOrder.customer.email = whOrder.customer?.email;
      newOrder.customer.ip = whOrder?.browser_ip;
      newOrder.customer.phone =
        whOrder.customer?.phone ?? whOrder.shipping_address?.phone;
      const newOrderSaved = await this.orderService.create(newOrder);

      const lineItems = await Promise.all(
        whOrder?.line_items?.map(async (item: any) => {
          const newItem = new CreateOrderInput();
          newItem.id = item.admin_graphql_api_id;
          newItem.parentId = whOrder.admin_graphql_api_id;
          newItem.shop = shop;
          newItem.product = new LineProduct();
          newItem.product.id = `gid://shopify/Product/${item.product_id}`;
          newItem.variant = new LineProduct();
          newItem.variant.id = `gid://shopify/ProductVariant/${item.variant_id}`;
          newItem.price = item.price;
          newItem.quantity = item.quantity;
          newItem.totalDiscounts = item.total_discount;
          newItem.shopifyCreatedAt = whOrder.created_at;
          return await this.orderService.create(newItem);
          // return newItem;
        }),
      );

      const newOrderPlaced = new OrderPlacedEvent();
      newOrderPlaced.order = newOrderSaved;
      newOrderPlaced.store = await this.storesService.findOneWithActiveCampaing(
        shop,
      );
      newOrderPlaced.lineItems = lineItems;
      this.eventEmitter.emit('order.placed', newOrderPlaced);
    } catch (err) {
      Logger.error({ err }, OrderCreatedListener.name);
    }
  }
}