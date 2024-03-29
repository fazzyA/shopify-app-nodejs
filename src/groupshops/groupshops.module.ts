import { forwardRef, Module } from '@nestjs/common';
import { GroupshopsService } from './groupshops.service';
import { GroupshopsResolver } from './groupshops.resolver';

import { OrderPlacedListener } from './listeners/order-placed.listener';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Groupshops } from './entities/groupshop.modal';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';
import { EmailModule } from 'src/email/email.module';
import { ShopifyStoreModule } from 'src/shopify-store/shopify-store.module';
import { UtilsModule } from 'src/utils/utils.module';
import { RefAddedEvent } from './events/refferal-added.event';
import { GsCommonModule } from 'src/gs-common/gs-common.module';
import { GSUpdatePriceRuleEvent } from './events/groupshop-update-price-rule.event';
import { PartnersModule } from 'src/partners/partners.module';
import { ChannelModule } from 'src/channel/channel.module';
import { StoresModule } from 'src/stores/stores.module';
import { DropsGroupshopModule } from 'src/drops-groupshop/drops-groupshop.module';
import { InventoryModule } from 'src/inventory/inventory.module';
import { DropKlaviyoEvent } from 'src/shopify-store/events/drop-klaviyo.event';
import { DropKlaviyoListener } from 'src/shopify-store/listeners/drop-klaviyo.listener';

@Module({
  imports: [
    EmailModule,
    TypeOrmModule.forFeature([Groupshops]),
    DefaultColumnsService,
    forwardRef(() => ShopifyStoreModule),
    UtilsModule,
    forwardRef(() => GsCommonModule),
    forwardRef(() => PartnersModule),
    forwardRef(() => ChannelModule),
    forwardRef(() => StoresModule),
    forwardRef(() => DropsGroupshopModule),
    forwardRef(() => InventoryModule),
  ],
  providers: [
    GroupshopsResolver,
    GroupshopsService,
    OrderPlacedListener,
    RefAddedEvent,
    GSUpdatePriceRuleEvent,
    DropKlaviyoEvent,
    DropKlaviyoListener,
  ],
  exports: [
    GroupshopsService,
    RefAddedEvent,
    GSUpdatePriceRuleEvent,
    OrderPlacedListener,
    DropKlaviyoEvent,
    DropKlaviyoListener,
  ],
})
export class GroupshopsModule {}
