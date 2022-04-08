import { Controller, forwardRef, Get, Inject, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { BillingsService } from 'src/billing/billing.service';
import { CampaignsService } from 'src/campaigns/campaigns.service';
import { ConfigService } from '@nestjs/config';
import { GroupshopsService } from 'src/groupshops/groupshops.service';
import { InventoryService } from 'src/inventory/inventory.service';
import { OrdersService } from 'src/inventory/orders.service';
import { StoresService } from 'src/stores/stores.service';
import { ShopifyService } from './shopify/shopify.service';
import { StoreService } from './store/store.service';

@Controller()
export class ShopifyStoreController {
  constructor(
    private storeService: StoreService,
    // private awsService: AwsService,
    // @Inject(forwardRef(() => InventoryService))
    private inventorySrv: InventoryService,
    private campaignSrv: CampaignsService,
    private ordersSrv: OrdersService,
    private groupshopSrv: GroupshopsService,
    private storesService: StoresService,
    private billingService: BillingsService,
    private shopifyService: ShopifyService,
    private configService: ConfigService,
  ) {}

  // @Get()
  // first(@Req() req: Request, @Res() res: Response) {
  //   console.log(req.query);
  //   res.send(req.query);
  // }

  // @Get('login')
  @Get()
  async login(@Req() req: Request, @Res() res: Response) {
    console.log('inside login get request');
    const { query } = req;
    const shop = query.shop as string;
    const store = await this.storesService.findOne(shop);
    if (store) res.redirect(this.storeService.goToAppfront(store));
    else if (shop) return this.storeService.login(req, res, shop);
    else console.log('referer : ', req.headers.referer);
  }

  @Get('callback')
  callback(@Req() req: Request, @Res() res: Response) {
    console.log('inside call back auth end');
    console.log('req.quer :', req.query);
    console.log('req.body :', req.body);
    return this.storeService.callback(req, res, req.query.shop);
  }

  @Get('load-products')
  async getStoreProducts() {
    const result = await this.storeService.loadProducts();
    // console.log(products);

    // .then((res) => {
    //   console.log(res);
    //   return res;
    // });
    if (result) {
      console.log(result);
      return result;
    }
    // return products;
    return console.log('not done yet');
  }
  @Get('test')
  async test() {
    return 'running server on port 5000';
  }

  @Get('refresh')
  async dbfresh() {
    try {
      const shop = 'native-roots-dev.myshopify.com';
      const store = await this.storesService.findOne(shop);
      this.shopifyService.accessToken = store.accessToken;
      this.shopifyService.shop = shop;
      if (store.resources.length > 0)
        store.resources.map((res) => {
          if (res.type === 'scriptTag') {
            this.shopifyService.scriptTagDelete(res.id);
          }
        });
      await this.inventorySrv.removeShop(shop);
      await this.ordersSrv.removeShop(shop);
      await this.campaignSrv.removeShop(store.id);
      await this.groupshopSrv.removeShop(store.id);
      await this.storesService.removeShop(shop);
      await this.billingService.removeByShop(store.id);
      return 'done';
    } catch (error) {
      return error.message;
    }
  }

  @Get('gs')
  async gropshopTestUrl() {
    const gs = await this.groupshopSrv.findAll();
    return gs.map((g) => `${this.configService.get('FRONT')}${g.url} `);
  }
  @Get('healthcheck')
  async testme() {
    return `server is running properly on
    HOST: ${process.env.HOST}
    FRONT: ${process.env.FRONT}`;
  }
}
