import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Shopify, { ApiVersion, AuthQuery } from '@shopify/shopify-api';
import Store from 'src/stores/entities/store.model';
import { ShopifyService } from '../shopify/shopify.service';

@Injectable()
export class StoreService {
  // private shopify;
  constructor(
    private configService: ConfigService,
    private shopifyapi: ShopifyService,
  ) {}

  async loadProducts() {
    // GraphQLClient takes in the shop url and the accessToken for that shop.
    // const client = new Shopify.Clients.Graphql(
    //   session.shop,
    //   session.accessToken,
    // );
    // const client = await this.shopifyapi.client(this.configService.get('SHOP'));
    // // Use client.query and pass your query as `data`
    // const products = await client.query({
    //   data: `{
    //   products (first: 20) {
    //     edges {
    //       node {
    //         id
    //         title

    //       }
    //     }
    //   }
    // }`,
    // });
    return {
      frontend: `${this.configService.get(
        'FRONT',
      )}?shop=${this.configService.get('SHOP')}`,
      // products: products.body['data']['products']['edges'],
    };
  }

  async login(req, res, shop) {
    const authRoute = await this.shopifyapi.beginAuth(
      req,
      res,
      shop,
      '/callback',
    );
    // console.log(
    //   '🚀 ~ file: store.service.ts ~ line 45 ~ StoreService ~ login ~ authRoute',
    //   JSON.stringify(authRoute),
    // );
    return res.redirect(authRoute);
  }

  // async loginOnline(req, res, shop) {
  //   console.log('loginOnline');
  //   const authRoute = await this.shopifyapi.beginAuth(
  //     req,
  //     res,
  //     shop,
  //     '/online/callback',
  //     true,
  //   );
  //   console.log(
  //     '🚀 ~ file: auth.service.ts ~ line 22 ~ AuthService ~ loginOnline ~ authRoute',
  //     authRoute,
  //   );
  //   return authRoute;
  // }
  async callback(req, res, shop, isStoreExist) {
    console.log(
      '🚀 ~ file: store.service.ts ~ line 49 ~ StoreService ~ callback ~ shop',
      JSON.stringify(shop),
    );
    console.log('inside store servide call back');
    const validateRes = await this.shopifyapi.validateAuth(req, res);
    console.log(
      ' file: store.service.ts ~ line 51 ~ StoreService ~ callback ~ validateRes',
      JSON.stringify(validateRes),
    );

    // this.shopifyapi.emitTokenReceivedEvent(validateRes);
    const session = await this.shopifyapi.currentSession(req, res, true);
    console.log('🚀 ----------currentSession --------~ online', session);

    // @todo: update offine token to database

    //   check change of scope
    if (
      !Shopify.Context.SCOPES.equals(
        (session && session.scope) || validateRes.scope,
      )
    ) {
      return res.redirect(`https://${shop}/admin/oauth/authorize`); // Scopes have changed, the app should redirect the merchant to OAuth
    }
    if (!isStoreExist) {
      const offlineSessRes = await this.shopifyapi.offlineSession(shop);
      console.log(
        '🚀 ~ file: store.service.ts ~ line 56 ~ StoreService ~ callback ~ offlineSessRes',
        JSON.stringify(offlineSessRes),
      );
    }
    return res.redirect(`/auth?store=${shop}`);

    // const shopName = shop.split('.')[0];
    // return res.redirect(`${this.configService.get('FRONT')}/${shopName}/0`); // wherever you want your user to end up after OAuth completes
  }

  async loadSession(shop: string) {
    await this.shopifyapi.offlineSession(
      shop || this.configService.get('SHOP'),
    );
  }

  goToAppfront(store) {
    const { shop, installationStep, subscription } = store;
    const shopName = shop.split('.')[0];
    if (
      installationStep === null &&
      subscription.status.toUpperCase() === 'ACTIVE'
    )
      return `${this.configService.get('FRONT')}/${shopName}/overview`;
    else if ((subscription?.status as string).toUpperCase() === 'PENDING')
      return subscription.confirmationUrl;
    else
      return `${this.configService.get(
        'FRONT',
      )}/${shopName}/${installationStep}`;
  }
}
