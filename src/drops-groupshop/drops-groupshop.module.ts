import { forwardRef, Module } from '@nestjs/common';
import { DropsGroupshopService } from './drops-groupshop.service';
import { DropsGroupshopResolver } from './drops-groupshop.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import DropsGroupshop from './entities/dropsgroupshop.model';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';
import { EmailModule } from 'src/email/email.module';
import { GsCommonModule } from 'src/gs-common/gs-common.module';
import { ShopifyStoreModule } from 'src/shopify-store/shopify-store.module';
import { StoresModule } from 'src/stores/stores.module';
import { InventoryModule } from 'src/inventory/inventory.module';
import { HttpModule } from '@nestjs/axios';
import { DropKlaviyoCron } from './drops.cron';
import { KalavioService } from 'src/email/kalavio.service';
import { DropCreatedEvent } from './events/drop-created.event';
import { DropCreatedListener } from './listeners/drop-created.listener';
import { UtilsModule } from 'src/utils/utils.module';
import { DropsCollectionUpdatedEvent } from './events/drops-collection-update.event';
import { DropsCollectionUpdatedListener } from './listeners/drops-collection-update.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([DropsGroupshop]),
    HttpModule,
    forwardRef(() => ShopifyStoreModule),
    forwardRef(() => StoresModule),
    forwardRef(() => EmailModule),
    forwardRef(() => GsCommonModule),
    forwardRef(() => InventoryModule),
  ],
  providers: [
    DropsGroupshopResolver,
    DropsGroupshopService,
    DropKlaviyoCron,
    KalavioService,
    DropCreatedEvent,
    DropCreatedListener,
    DropsCollectionUpdatedEvent,
    DropsCollectionUpdatedListener,
  ],
  exports: [
    DropsGroupshopService,
    DropCreatedEvent,
    DropCreatedListener,
    DropsCollectionUpdatedEvent,
    DropsCollectionUpdatedListener,
  ],
})
export class DropsGroupshopModule {}
