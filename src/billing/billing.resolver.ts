import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { BillingsService } from './billing.service';
import { Billing } from './entities/billing.entity';
import { CreateBillingInput } from './dto/create-billing.input';
import { UpdateBillingInput } from './dto/update-billing.input';
import {
  MonthlyBillingInput,
  SingleDayBillingInput,
  Total,
  TotalGS,
  TotalRevenue,
} from './dto/monthly-billing.input';
import { AppSubscription } from './entities/app-subscription.input';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';
import { StoresService } from 'src/stores/stores.service';
import { Days, monthsArr } from 'src/utils/functions';

@Resolver(() => Billing)
export class BillingsResolver {
  constructor(
    private readonly billingService: BillingsService,
    private shopifyapi: ShopifyService,
    private readonly storeService: StoresService,
  ) {}

  @Mutation(() => Billing)
  createBillings(
    @Args('createBillingsInput') createBillingsInput: CreateBillingInput,
  ) {
    console.log(
      '🚀 ~ file: billing.resolver.ts ~ line 15 ~ BillingssResolver ~ createBillingsInput',
      createBillingsInput,
    );
    return this.billingService.create(createBillingsInput);
  }

  @Query(() => [Billing], { name: 'billings' })
  findAll() {
    return this.billingService.findAll();
  }

  @Query(() => Billing, { name: 'billing' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.billingService.findOne(id);
  }

  @Query(() => [MonthlyBillingInput], { name: 'getMonthlyGSBilling' })
  getMonthlyGSBilling(@Args('storeId') storeId: string) {
    return this.billingService.findMonthlyBilling(storeId);
  }

  @Query(() => TotalRevenue, { name: 'findTotalRevenue' })
  findTotalRevenue(@Args('storeId') storeId: string) {
    return this.billingService.findTotalRevenue(storeId);
  }

  @Query(() => [Total], { name: 'findTotalGSMonthly' })
  findTotalGSMonthly(@Args('storeId') storeId: string) {
    return this.billingService.findTotalGSMonthly(storeId);
  }

  @Query(() => TotalGS, { name: 'findTotalGS' })
  findTotalGS(@Args('storeId') storeId: string) {
    return this.billingService.findTotalGS(storeId);
  }

  @Query(() => [SingleDayBillingInput], { name: 'getBillingByDate' })
  async getBillingByDate(
    @Args('storeId') storeId: string,
    @Args('month') month: string,
    @Args('year') year: string,
  ) {
    const yearNum = +year;
    const startDay = Days(
      new Date(`${monthsArr(+month - 1).mon} 1, ${yearNum}`).getDay(),
    );
    const curMonth = monthsArr(+month - 1).initial;
    const lastdate = monthsArr(+month - 1).endDate;
    const sdate = new Date(
      `${startDay}, 01 ${curMonth} ${yearNum} 00:00:00 GMT`,
    );
    const edate = new Date(
      `${startDay}, ${lastdate} ${curMonth} ${yearNum} 23:59:00 GMT`,
    );
    console.log('sdate', `${startDay}, 01 ${curMonth} ${yearNum} 00:00:00 GMT`);
    console.log(
      'edate',
      `${startDay}, ${lastdate} ${curMonth} ${yearNum} 23:59:00 GMT`,
    );
    console.log('year', `${yearNum}`);

    // new Date('Fri, 01 Apr 2022 19:00:00 GMT)
    // new Date('Mon, 30 Apr 2022 23:59:00 GMT')
    const result = await this.billingService.getBillingByDate(
      storeId,
      sdate,
      edate,
    );
    console.log('🚀 getBillingByDate result', result);
    return result;
  }

  @Mutation(() => Billing)
  updateBillings(
    @Args('updateBillingsInput') updateBillingsInput: UpdateBillingInput,
  ) {
    return this.billingService.update(
      updateBillingsInput.id,
      updateBillingsInput,
    );
  }

  @Mutation(() => Billing)
  removeBillings(@Args('id', { type: () => Int }) id: string) {
    return this.billingService.remove(id);
  }

  @Mutation(() => AppSubscription, { name: 'billingSubscription' })
  async getBillingSubs(
    @Args('shop') shop: string,
    @Args('accessToken') accessToken: string,
  ) {
    this.shopifyapi.shop = shop;
    this.shopifyapi.accessToken = accessToken;
    const subscription = await this.shopifyapi.AppSubscriptionCreate();
    this.storeService.updateField(
      { shop },
      {
        subscription,
        appTrialEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    );
    return { redirectUrl: subscription['confirmationUrl'] };
  }
}
