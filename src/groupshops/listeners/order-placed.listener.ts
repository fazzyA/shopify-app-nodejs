import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
// import moment from 'moment';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateMemberInput } from 'aws-sdk/clients/managedblockchain';
import { Reward } from 'src/appsettings/entities/sales-target.model';
import Orders from 'src/inventory/entities/orders.modal';
import { OrderPlacedEvent } from 'src/shopify-store/events/order-placed.envent';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';
import {
  CreateGroupshopInput,
  DealProductsInput,
  DiscountCodeInput,
  MemberInput,
  MilestoneInput,
  RefundInput,
} from '../dto/create-groupshops.input';
import { UpdateGroupshopInput } from '../dto/update-groupshops.input';
import { ProductTypeEnum, RoleTypeEnum } from '../entities/groupshop.entity';
import { RefundStatusEnum } from '../entities/groupshop.modal';
import { GroupshopsService } from '../groupshops.service';

@Injectable()
export class OrderPlacedListener {
  constructor(
    private shopifyapi: ShopifyService,
    private configSevice: ConfigService,
    private eventEmitter: EventEmitter2,
    private gsService: GroupshopsService,
  ) {}

  accessToken: string;
  shop: string;
  order: Orders;

  static formatTitle(name: string) {
    return `GS${Math.floor(1000 + Math.random() * 9000)}${name?.substring(
      1,
      name.length,
    )}`;
  }
  static addDays(date: Date, number: number) {
    const newDate = new Date(date);
    return new Date(newDate.setDate(newDate.getDate() + number));
  }

  getNextMemberDiscount(totalMembers: number, rewards: Reward[]) {
    if (totalMembers === 5) return rewards[0].discount;
    return (
      rewards.filter(
        (rew) => parseInt(rew.customerCount) === totalMembers + 1,
      )[0]?.discount || null
    );
  }

  totalPricePercent(lineItems, discountPercentage) {
    const totalPrice = lineItems?.reduce(
      (priceSum: number, { price, quantity }) =>
        priceSum + quantity * parseFloat(price),
      0,
    );
    return discountPercentage * totalPrice;
  }

  async shopifyRefund(amount: string, orderId: string) {
    const client = await this.shopifyapi.client(this.shop, this.accessToken);
    const refund = await client.query({
      data: {
        query: `mutation refundCreate($input: RefundInput!) {
          refundCreate(input: $input) {
            order {
              id
              name
            }
            refund {
              id
              
            }
            userErrors {
              field
              message
            }
          }
        }`,
        variables: {
          input: {
            orderId: orderId,
            note: 'GROUPSHOP cash back for referral V2',
            notify: true,
            transactions: {
              amount,
              gateway: 'exchange-credit',
              kind: 'REFUND',
              orderId: orderId,
            },
          },
        },
      },
    });
    console.log(JSON.stringify(refund));
  }

  calculateRefund(member: any, milestone: number) {
    const netDiscount = milestone * 100 - member.availedDiscount;

    const refundAmount = this.totalPricePercent(member.lineItems, milestone);
    this.shopifyRefund(refundAmount.toString(), member.orderId);
    const refund = new RefundInput(
      RefundStatusEnum.panding,
      new Date(),
      netDiscount,
      refundAmount,
    );

    member.refund = [...(member.refund ?? []), refund];
    member.availedDiscount += netDiscount;
    return member;
  }
  setPreviousMembersRefund(
    members: MemberInput[],
    discountCode: DiscountCodeInput,
  ) {
    const totalMembers = members.length;
    const currentMilestone = parseFloat(discountCode.percentage) / 100;
    return members.map((member) => {
      if (totalMembers === 5 && member.role === RoleTypeEnum.owner) {
        member = this.calculateRefund(member, 50 / 100);
      } else if (totalMembers === 10 && member.role === RoleTypeEnum.owner) {
        member = this.calculateRefund(member, 90 / 100);
      } else if (member.availedDiscount / 100 < currentMilestone) {
        member = this.calculateRefund(member, currentMilestone);
      }

      return member;
    });
  }

  @OnEvent('order.placed')
  async createGroupShop(event: OrderPlacedEvent) {
    console.log(
      '🚀 ~ file: order-placed.listener.ts ~ line 18 ~ OrderPlacedListener ~ createGroupShop ~ event',
      event,
    );

    const {
      order: { discountCode, name, customer, id: orderId },
      store: {
        shop,
        accessToken,
        campaigns: [
          {
            id: campaignId,
            salesTarget: { rewards },
            products: campaignProducts,
          },
        ],
        id,
      },
      lineItems,
    } = event;

    this.accessToken = accessToken;
    this.shop = shop;
    this.order = event.order;

    const dealProducts = lineItems
      .filter((item) => !campaignProducts.includes(item.product.id))
      .map((nitem) => ({
        productId: nitem.product.id,
        type: ProductTypeEnum.deal,
        addedBy: customer.firstName,
        customerIP: customer.ip,
      }));

    const gsMember = new MemberInput();
    gsMember.orderId = orderId;

    const totalCampaignProducts = campaignProducts.concat(
      dealProducts.map((p) => p.productId),
    );

    const title = OrderPlacedListener.formatTitle(name);
    const expires = OrderPlacedListener.addDays(new Date(), 7);

    if (discountCode) {
      // const updateGroupshop = await this.gsService.findOne(discountCode);
      let ugroupshop = new UpdateGroupshopInput();

      ugroupshop = await this.gsService.findOneWithLineItems(discountCode);
      const {
        discountCode: { title, priceRuleId },
        createdAt,
        expiredAt,
      } = ugroupshop;

      gsMember.role = RoleTypeEnum.referral;
      gsMember.availedDiscount = parseFloat(ugroupshop.discountCode.percentage);
      ugroupshop.members = [...ugroupshop.members, gsMember];

      ugroupshop.dealProducts = dealProducts;
      ugroupshop.totalProducts = totalCampaignProducts.length;
      ugroupshop.members = this.setPreviousMembersRefund(
        ugroupshop.members,
        ugroupshop.discountCode,
      );

      const newDiscount = this.getNextMemberDiscount(
        ugroupshop.members.length,
        rewards,
      );

      if (newDiscount) {
        ugroupshop.discountCode = await this.shopifyapi.setDiscountCode(
          shop,
          'Update',
          accessToken,
          title,
          parseInt(newDiscount),
          totalCampaignProducts,
          createdAt,
          expiredAt,
          priceRuleId,
        );
        const gsMilestone = new MilestoneInput();
        gsMilestone.activatedAt = new Date();
        gsMilestone.discount = `${newDiscount}`;
        ugroupshop.milestones = [...ugroupshop.milestones, gsMilestone];
      }

      await this.gsService.update(ugroupshop);
    } else {
      const newGroupshop = new CreateGroupshopInput();
      newGroupshop.storeId = id;
      newGroupshop.campaignId = campaignId;
      newGroupshop.discountCode = await this.shopifyapi.setDiscountCode(
        shop,
        'Create',
        accessToken,
        title,
        parseInt(rewards[0].discount),
        totalCampaignProducts,
        new Date(),
        expires,
      );
      newGroupshop.dealProducts = [new DealProductsInput()];
      newGroupshop.dealProducts = dealProducts;
      newGroupshop.totalProducts = totalCampaignProducts.length;
      newGroupshop.url = `/${shop.split('.')[0]}/deal/${title}`;
      newGroupshop.createdAt = new Date();
      newGroupshop.expiredAt = expires;
      // newGroupshop.
      gsMember.availedDiscount = 0;
      gsMember.role = RoleTypeEnum.owner;
      newGroupshop.members = [gsMember];
      const gsMilestone = new MilestoneInput();
      gsMilestone.activatedAt = new Date();
      gsMilestone.discount = rewards[0].discount;
      newGroupshop.milestones = [gsMilestone];
      this.gsService.create(newGroupshop);
    }
  }
}