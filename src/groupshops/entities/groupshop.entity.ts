import {
  ObjectType,
  Field,
  registerEnumType,
  ID,
  Int,
  Float,
} from '@nestjs/graphql';
import { Campaign } from 'src/campaigns/entities/campaign.entity';
import { CreateOrderInput as Order } from 'src/inventory/dto/create-order.input';
import { Product } from 'src/inventory/entities/product.entity';
import { Store } from 'src/stores/entities/store.entity';

export enum ProductTypeEnum {
  deal,
  abandoned,
}
registerEnumType(ProductTypeEnum, {
  name: 'ProductTypeEnum',
});

export enum RefundStatusEnum {
  done,
  panding,
}
registerEnumType(RefundStatusEnum, {
  name: 'RefundStatusEnum',
});

export enum RoleTypeEnum {
  owner,
  referral,
}
registerEnumType(RoleTypeEnum, {
  name: 'RoleTypeEnum',
});

@ObjectType()
export class DealProducts {
  @Field({ nullable: true })
  productId: string;

  @Field(() => ProductTypeEnum, { nullable: true })
  type: ProductTypeEnum;

  @Field({ nullable: true })
  addedBy: string;

  @Field({ nullable: true })
  customerIP: string;
}

@ObjectType()
export class DiscountCode {
  @Field({ nullable: true })
  title: string;
  @Field({ nullable: true })
  percentage: string;
  @Field({ nullable: true })
  priceRuleId: string;
}

@ObjectType()
export class Refund {
  @Field(() => RefundStatusEnum, { nullable: true })
  status: RefundStatusEnum;
  @Field({ nullable: true })
  createdAt: Date;
  @Field({ nullable: true })
  discount: number;
  @Field(() => Float, { nullable: true })
  amount: number;
}

@ObjectType()
export class Milestone {
  @Field({ nullable: true })
  activatedAt: Date;
  @Field({ nullable: true })
  discount: string;
}

@ObjectType()
export class Member {
  @Field({ nullable: true })
  orderId: string;

  @Field({ nullable: true })
  availedDiscount: number;

  @Field(() => RoleTypeEnum, { nullable: true })
  role: RoleTypeEnum;

  @Field(() => [Refund], { nullable: 'itemsAndList' })
  refund?: Refund[];
  @Field(() => [Product], { nullable: 'itemsAndList' })
  products?: Product[];

  @Field(() => Order, { nullable: true })
  orderDetail?: Order;

  @Field(() => [Order], { nullable: 'itemsAndList' })
  lineItems?: Order[];
}

@ObjectType()
export class TotalOrders {
  @Field({ nullable: true })
  countTotalOrders?: string;
}

@ObjectType()
export class GsOrders {
  @Field(() => [Member])
  members: Member[];
}

@ObjectType()
export class GroupShop {
  @Field(() => ID)
  id: string;

  @Field()
  campaignId: string;

  @Field()
  storeId: string;

  @Field(() => Int, { defaultValue: 0 })
  totalProducts: number;

  @Field(() => [DealProducts], { nullable: 'itemsAndList' })
  dealProducts?: DealProducts[];

  @Field()
  url: string;

  @Field({ nullable: true })
  shortUrl?: string;

  @Field()
  createdAt: Date;

  @Field()
  expiredAt: Date;

  @Field(() => DiscountCode)
  discountCode: DiscountCode;

  @Field(() => [Member])
  members: Member[];

  @Field(() => [Milestone])
  milestones: Milestone[];

  @Field(() => Store, { nullable: true })
  store?: Store;

  @Field(() => [Product], { nullable: 'itemsAndList' })
  popularProducts?: Product[];

  @Field(() => Campaign, { nullable: true })
  campaign?: Campaign;

  @Field(() => [Product], { nullable: 'itemsAndList' })
  allProducts?: Product[];

  @Field(() => [Product], { nullable: 'itemsAndList' })
  bestSeller?: Product[];
}
