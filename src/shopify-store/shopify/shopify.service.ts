import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import Shopify, {
  ApiVersion,
  AuthQuery,
  RegisterReturn,
} from '@shopify/shopify-api';
import { HttpService } from '@nestjs/axios';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TokenReceivedEvent } from '../events/token-received.event';

@Injectable()
export class ShopifyService {
  // private shopify;
  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private eventEmitter: EventEmitter2,
  ) {
    Shopify.Context.initialize({
      API_KEY: configService.get('SHOPIFY_API_KEY'),
      API_SECRET_KEY: configService.get('SHOPIFY_API_SECRET'),
      SCOPES: configService.get('SCOPES').split(','),
      HOST_NAME: configService.get('HOST').replace(/https:\/\//, ''),
      API_VERSION: ApiVersion.October20,
      IS_EMBEDDED_APP: false,
      // This should be replaced with your preferred storage strategy
      SESSION_STORAGE: new Shopify.Session.MemorySessionStorage(),
    });
  }

  async currentSession(req: Request, res: Response) {
    return await Shopify.Utils.loadCurrentSession(req, res, false);
  }

  async client(shop: string, accessToken: string) {
    return new Shopify.Clients.Graphql(shop, accessToken);
  }

  async beginAuth(req: Request, res: Response, shop: string) {
    return await Shopify.Auth.beginAuth(req, res, shop, '/callback', false);
  }
  async validateAuth(req: Request, res: Response) {
    try {
      await Shopify.Auth.validateAuthCallback(
        req,
        res,
        req.query as unknown as AuthQuery,
      ); // req.query must be cast to unkown and then AuthQuery in order to be accepted
    } catch (error) {
      console.error(error); // in practice these should be handled more gracefully
    }
  }

  async offlineSession(shop: string) {
    const session = await Shopify.Utils.loadOfflineSession(shop);
    const tokenReceivedEvent = new TokenReceivedEvent();
    tokenReceivedEvent.token = session.accessToken;
    tokenReceivedEvent.session = session;
    this.eventEmitter.emit('token.received', tokenReceivedEvent);
    return session;
  }

  offlineSessionID(shop: string) {
    return Shopify.Auth.getOfflineSessionId(shop);
  }

  async registerHook(shop, accessToken, path, topic) {
    try {
      // const host = this.configService.get('HOST') + path;

      const response = await Shopify.Webhooks.Registry.register({
        shop,
        accessToken,
        path: path + '?shop=' + shop,
        topic,
        webhookHandler: async (topic, shop, body) => {
          console.log('inside');
        },
      });
      console.log(JSON.stringify(response));
      return response;
    } catch (error) {
      console.log('error : ', error);
    }

    // if (!response.success) {
    //   console.log(
    //     `Failed to register APP_UNINSTALLED webhook: ${response.result}`,
    //   );
    // }
  }

  async setDiscountCode(
    shop: string,
    action: string,
    accessToken: string,
    title?: string,
    percentage?: number,
    products?: string[],
    starts?: Date,
    ends?: Date,
    id?: string,
  ) {
    // if (percentage) {
    const client = await this.client(shop, accessToken);
    let priceRule: any;

    if (action === 'Create')
      priceRule = await client.query({
        data: {
          query: `mutation priceRuleCreate($priceRule: PriceRuleInput!, $priceRuleDiscountCode : PriceRuleDiscountCodeInput) {
          priceRuleCreate(priceRule: $priceRule, priceRuleDiscountCode: $priceRuleDiscountCode) {
            priceRule {
              id
              title
              target
              startsAt
              endsAt
            }
            priceRuleDiscountCode {
              code
            }
            priceRuleUserErrors {
              message
            }
          }
        }`,
          variables: {
            id: id || null,
            priceRule: {
              title: title,
              target: 'LINE_ITEM',
              value: {
                percentageValue: -percentage,
              },
              itemEntitlements: {
                productIds: products,
              },
              customerSelection: {
                forAllCustomers: true,
              },
              allocationMethod: 'EACH',
              validityPeriod: {
                start: starts,
                end: ends,
              },
            },
            priceRuleDiscountCode: { code: title },
          },
        },
      });
    else {
      let variables: any = { id };
      if (percentage)
        variables = {
          id,
          priceRule: {
            value: {
              percentageValue: -percentage,
            },
          },
        };
      if (products)
        variables = {
          id,
          priceRule: {
            itemEntitlements: {
              productIds: products,
            },
          },
        };
      priceRule = await client.query({
        data: {
          query: `mutation priceRuleUpdate($id: ID!,$priceRule: PriceRuleInput!, $priceRuleDiscountCode : PriceRuleDiscountCodeInput) {
          priceRuleUpdate(id: $id, priceRule: $priceRule, priceRuleDiscountCode: $priceRuleDiscountCode) {
          priceRule {
            id
            title
            target
            startsAt
            endsAt
          }
          priceRuleDiscountCode {
            code
          }
          priceRuleUserErrors {
            message
          }
        }
      }`,
          variables,
        },
      });
    }
    console.log(
      '🚀 ~ file: shopify.service.ts ~ line 196 ~ ShopifyService ~ priceRule',
      JSON.stringify(priceRule),
    );
    const {
      [`priceRule${action}`]: {
        priceRule: { id: priceRuleId },
      },
    } = priceRule.body['data'];
    return {
      title,
      percentage: percentage?.toString(),
      priceRuleId: priceRuleId,
    };
  }

  // updateDiscountCode(shop: shop, accessToken: string, variables: any) {
  //   priceRule = await client.query({
  //     data: {
  //       query: `mutation priceRuleUpdate($id: ID!,$priceRule: PriceRuleInput!, $priceRuleDiscountCode : PriceRuleDiscountCodeInput) {
  //       priceRuleUpdate(id: $id, priceRule: $priceRule, priceRuleDiscountCode: $priceRuleDiscountCode) {
  //       priceRule {
  //         id
  //         title
  //         target
  //         startsAt
  //         endsAt
  //       }
  //       priceRuleDiscountCode {
  //         code
  //       }
  //       priceRuleUserErrors {
  //         message
  //       }
  //     }
  //   }`,
  //       variables: {
  //         id,
  //         priceRule: {
  //           value: {
  //             percentageValue: -percentage,
  //           },
  //         },
  //       },
  //     },
  //   });
  // }
}
