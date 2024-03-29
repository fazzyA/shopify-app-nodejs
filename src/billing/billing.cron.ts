import { Injectable, Logger, NotAcceptableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';
import { BillingPlanEnum } from 'src/stores/entities/store.entity';
import { StoresService } from 'src/stores/stores.service';
import { BillingsService } from './billing.service';

@Injectable()
export class BillingUsageCargeCron {
  private readonly logger = new Logger(BillingUsageCargeCron.name);
  constructor(
    private readonly billingService: BillingsService,
    private readonly storesService: StoresService,
    private shopifyapi: ShopifyService,
    private configService: ConfigService,
  ) {}

  usageDescripton(
    plan: BillingPlanEnum,
    cashback,
    gscharge,
    totalCharge,
    isfreeTrial,
  ) {
    switch (plan) {
      case BillingPlanEnum.EXPLORE:
        return `Groupshop Explore ${
          isfreeTrial ? '(free for 30 days)' : ''
        } + Cashback charge - $${cashback}`;

      case BillingPlanEnum.LAUNCH:
        // return `Launch (${totalCharge}) >> Groupshop charge - ${gscharge} + Cashback charge - $${cashback}`;
        return `Groupshop Launch Plan ${
          isfreeTrial ? '(free for 30 days)' : ''
        }>> ${new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })} - ${totalCharge}(GS Charge - $${gscharge}  + CB Charge - $${cashback})`;

      case BillingPlanEnum.GROWTH:
        // return `Growth (${totalCharge}) >> Groupshop charge - ${gscharge} + Cashback charge - $${cashback}`;
        return `Groupshop Growth Plan ${
          isfreeTrial ? '(free for 30 days)' : ''
        }>> ${new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })} - ${totalCharge}(GS Charge - $${gscharge}  + CB Charge - $${cashback})`;

      case BillingPlanEnum.ENTERPRISE:
        // return `Enterprise  (${totalCharge}) >> Groupshop charge - ${gscharge} + Cashback charge - $${cashback}`;
        return `Groupshop Enterprise Plan ${
          isfreeTrial ? '(free for 30 days)' : ''
        }>> ${new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })} - ${totalCharge}(GS Charge - $${gscharge}  + CB Charge - $${cashback})`;
    }
  }

  // @Cron('0 59 23 * * *') // CronExpression.EVERY_DAY_AT_5PM) ///EVERY_DAY_AT_6AM) // EVERY_10_SECONDS)
  async handleBillingCron() {
    try {
      if (this.configService.get('BILLING_LIVE') === 'false')
        throw new NotAcceptableException(
          BillingUsageCargeCron.name,
          'Billing live is false',
        );
      // this.logger.error('Called every 30 seconds');
      this.logger.log(`Billing Cron Started`, BillingUsageCargeCron.name, true);
      const stores = await this.storesService.findActiveAll();

      const allstoresBilling = await this.billingService.getAllStoreBilling();
      console.log(
        '🚀 ~ file: billing.cron.ts ~ line 70 ~ BillingUsageCargeCron ~ stores.map ~ allstoresBilling',
        allstoresBilling,
      );
      stores.map(async (store) => {
        if (
          ['Active', 'ACTIVE', 'active'].includes(store.subscription.status)
        ) {
          // console.log(
          //   '🚀 ~ file: billing.cron.ts ~ line 65 ~ BillingUsageCargeCron ~ stores.map ~ store',
          //   store,
          // );
          const useageQuery = allstoresBilling.find(
            (storeBilling) => storeBilling.store === store.id,
          );

          // Logger.warn(`${store.shop} - ${store.id}`, 'BillingUsageCargeCron');
          console.log(
            '🚀 ~ file: billing.cron.ts ~ line 30 ~ BillingUsageCargeCron ~ stores.map ~ useageQuery',
            useageQuery,
          );
          if (useageQuery) {
            // let cashbackUsage = '30';
            let cashbackUsage = useageQuery['totalfeeByCashback'];
            if (store.currencyCode !== 'USD' && cashbackUsage > 0) {
              cashbackUsage = await this.billingService.currencyConversion(
                store.currencyCode,
                parseFloat(cashbackUsage),
              );
            }
            const totalCharge =
              parseFloat(cashbackUsage) +
              parseFloat(useageQuery['totalfeeByGS']);
            Logger.debug(
              useageQuery['totalfeeByCashback'],
              'totalfeeByCashback',
            );

            Logger.debug(useageQuery['totalfeeByGS'], 'totalfeeByGS');
            Logger.debug(totalCharge, 'total charge');

            console.log(
              '🚀 ~ ~ store.appTrialEnd.getTime()',
              store.appTrialEnd.getTime(),
            );

            const usageCharge =
              Date.now() < store.appTrialEnd.getTime()
                ? parseFloat(cashbackUsage)
                : totalCharge;
            Logger.log(usageCharge, BillingUsageCargeCron.name);

            if (usageCharge > 0) {
              this.shopifyapi.shop = store.shop;
              this.shopifyapi.accessToken = store.accessToken;
              const shopifyRes = await this.shopifyapi.appUsageRecordCreate(
                store.subscription?.['appSubscription']['lineItems'][0]['id'],
                usageCharge,
                this.usageDescripton(
                  store.plan,
                  cashbackUsage.toFixed(2),
                  useageQuery['totalfeeByGS'],
                  totalCharge.toFixed(2),
                  Date.now() < store.appTrialEnd.getTime(),
                ),
              );
              console.log(
                '🚀 ~ file: billing.cron.ts ~ line 119 ~ BillingUsageCargeCron ~ stores.map ~ shopifyRes',
                shopifyRes,
              );
              // if (shopifyRes['appUsageRecordCreate']['appUsageRecord']) {
              if (shopifyRes) {
                console.log('inside');
                const billingUpdateRec = useageQuery['badgeIds'].map(
                  (billingId: string) => {
                    return {
                      updateOne: {
                        filter: { id: billingId },
                        update: { $set: { isPaid: true } },
                      },
                    };
                  },
                );

                this.billingService.bulkUpdate(billingUpdateRec);
              }
            }
          }
        }
      });
      //
      // Logger.debug('cron srunning', BillingUsageCargeCron.name);
    } catch (err) {
      Logger.error(err, BillingUsageCargeCron.name);
    }
  }
}
