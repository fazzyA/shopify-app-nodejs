import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { InventoryModule } from 'src/inventory/inventory.module';
import { CatController } from './connect/connect.controller';
import { GroupshopCashbackListener } from './listeners/groupshop-cashback.listener';
import { GroupshopSavedListener } from './listeners/groupshop-saved.listener';
import { KalavioService } from './kalavio.service';
import { UploadImageService } from 'src/shopify-store/ImageUpload/uploadimage.service';

import { UploadImageModule } from 'src/shopify-store/ImageUpload/uploadimage.module';
import { KalavioResolver } from './kalavio.resolver';
import { StoresModule } from 'src/stores/stores.module';
import { CampaignsModule } from 'src/campaigns/campaigns.module';
import { DropsGroupshopModule } from 'src/drops-groupshop/drops-groupshop.module';
import { GsCommonModule } from 'src/gs-common/gs-common.module';

@Module({
  imports: [
    HttpModule,
    InventoryModule,
    forwardRef(() => DropsGroupshopModule),
    forwardRef(() => CampaignsModule),
    forwardRef(() => GsCommonModule),
    UploadImageModule,
    forwardRef(() => StoresModule),
  ],
  providers: [
    GroupshopSavedListener,
    GroupshopCashbackListener,
    KalavioService,
    KalavioResolver,
  ],
  exports: [KalavioService],
  controllers: [CatController],
})
export class EmailModule {}
