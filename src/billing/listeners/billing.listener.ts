import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { StorePlanUpdatedEvent } from 'src/stores/events/plan-updated.event';
import { GS_CHARGE_CASHBACK, GS_FEES } from 'src/utils/constant';
// import { EventEmitter2 } from '@nestjs/event-emitter';
import { GroupShopCreated } from '../../groupshops/events/groupshop-created.event';
import { BillingsService } from '../billing.service';
import { CreateBillingInput } from '../dto/create-billing.input';
import { BillingTypeEnum } from '../entities/billing.entity';
import { CashBackEvent } from '../events/cashback.event';

@Injectable()
export class BillingListener {
  constructor(
    // private configSevice: ConfigService,
    // private eventEmitter: EventEmitter2,
    // private gsService: GroupshopsService,
    // private storeService: StoresService,
    private billingService: BillingsService,
  ) {}

  @OnEvent('plan.updated')
  async createBilling(event: StorePlanUpdatedEvent) {
    const { id: storeId, plan } = event.store;
    const { id, members } = event.groupshop;
    console.log(
      '🚀 ~ file: billing.listener.ts ~ line 28 ~ BillingListener ~ createBilling ~ members',
      members,
    );
    const payload: CreateBillingInput = {
      type: BillingTypeEnum.ON_GS_CREATION,
      plan,
      feeCharges: GS_FEES[plan],
      revenue: event.revenue,
      groupShopId: id,
      storeId,
    };
    const newBilling = await this.billingService.create(payload);
    console.log(
      '🚀 ~ file: billing.listener.ts ~ line 35 ~ BillingListener ~ createBilling ~ newBilling',
      newBilling,
    );
  }
  @OnEvent('cashback.generated')
  async createBillingForCashBack(event: CashBackEvent) {
    console.log(JSON.stringify(event));
    console.log('...............');
    const { id, storeId } = event.groupshop;
    const { cashbackAmount, revenue, cashbackCharge } = event;

    const payload: CreateBillingInput = {
      type: BillingTypeEnum.ON_CASHBACK,
      cashBack: +cashbackAmount.toFixed(2),
      feeCharges: cashbackCharge,
      groupShopId: id,
      revenue,
      storeId,
    };
    const newBilling = await this.billingService.create(payload);
    console.log(
      '🚀 ~ file: billing.listener.ts ~ line 57 ~ BillingListener ~ createBillingForCashBack ~ newBilling',
      newBilling,
    );
  }
}
