import {
  ObjectType,
  Field,
  ID,
  registerEnumType,
  InputType,
} from '@nestjs/graphql';
import { Campaign } from 'src/campaigns/entities/campaign.entity';
import { AnyScalar } from 'src/utils/any.scalarType';
import { Settings } from './settings.entity';

export enum BillingPlanEnum {
  EXPLORE,
  LAUNCH,
  GROWTH,
  ENTERPRISE,
}
registerEnumType(BillingPlanEnum, {
  name: 'BillingPlanEnum',
});

@InputType('ResourceInput')
@ObjectType('Resource')
export class Resource {
  @Field()
  id: string;
  @Field({ nullable: true })
  type?: string;
  @Field({ nullable: true })
  detail?: string;
}

// @InputType('SubscriptionInput')
// @ObjectType('Subscription')
// export class Subscription {
//   @Field()
//   id: string;
//   @Field({ nullable: true })
//   lineItems: any[];
//   @Field({ nullable: true })
//   detail?: string;
// }

@ObjectType('Store')
export class Store {
  // @Field({ description: 'mongo entity id' })
  // _id: string;

  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  shopifySessionId: string;

  @Field({ nullable: true })
  brandName?: string;

  @Field()
  shop: string;

  @Field()
  accessToken: string;

  @Field({ defaultValue: 0, nullable: true })
  installationStep: number | null;

  @Field({ defaultValue: 0 })
  createdAt: string;

  @Field({ nullable: true })
  logoImage: string;

  @Field({ nullable: true })
  status: string;

  @Field({ nullable: true })
  industry: string;

  @Field((type) => Settings, { nullable: true })
  settings: Settings;

  @Field(() => [Campaign], { nullable: 'itemsAndList' })
  campaigns?: Campaign[];

  @Field(() => Campaign, { nullable: true })
  activeCampaign?: Campaign;

  @Field(() => BillingPlanEnum, {
    defaultValue: BillingPlanEnum.EXPLORE,
  })
  plan?: BillingPlanEnum;

  @Field({ defaultValue: 0, nullable: true })
  totalGroupShop?: number;

  @Field(() => [Resource], { nullable: 'itemsAndList' })
  resources?: Resource[];

  @Field(() => String, { nullable: true })
  shopifySubscription?: Resource[];

  @Field()
  appTrialEnd: Date;

  @Field({ nullable: true })
  currencyCode: string;

  @Field({ nullable: true })
  timezone: string;
}
