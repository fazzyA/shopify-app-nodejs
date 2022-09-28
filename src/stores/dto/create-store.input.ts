import { InputType, ID, Field } from '@nestjs/graphql';
import { AnyScalar } from 'src/utils/any.scalarType';
import {
  BannerDesignTypeEnum,
  BannerSummaryEnum,
} from '../entities/settings.entity';
import { BillingPlanEnum, Resource } from '../entities/store.entity';
// import { Settings } from '../entities/settings.entity';

@InputType()
export class GeneralSettingInput {
  @Field({ nullable: true })
  brandColor?: string;
  @Field({ nullable: true })
  customBg?: string;
  @Field({ nullable: true })
  imageUrl?: string;
  @Field({ nullable: true })
  youtubeUrl?: string;
  @Field({ nullable: true })
  media?: string;
}

@InputType()
export class LayoutSettingInput {
  @Field({ nullable: true })
  bannerProductPage?: boolean;
  @Field({ nullable: true })
  bannerCartPage?: boolean;
  @Field({ nullable: true })
  bannerStyle?: string;
  @Field({ nullable: true })
  bannerDesign?: string;
  @Field({ nullable: true })
  bannerCustomColor?: string;
  @Field({ nullable: true })
  callToActionText?: string;
  @Field({ nullable: true })
  bannerSummaryPage?: string;
}

@InputType()
export class MarketingSettingInput {
  @Field({ nullable: true })
  recoverAbandoned?: boolean;
  @Field({ nullable: true })
  WhatsAppnotifications?: boolean;
  @Field({ nullable: true })
  facebookPixels?: string;
  @Field({ nullable: true })
  tiktokPixels?: string;
  @Field({ nullable: true })
  googlePixels?: string;
}
@InputType()
export class SettingsInput {
  @Field((type) => GeneralSettingInput, { nullable: true })
  general?: GeneralSettingInput;

  @Field((type) => LayoutSettingInput, { nullable: true })
  layout?: LayoutSettingInput;

  @Field((type) => MarketingSettingInput, { nullable: true })
  marketing?: MarketingSettingInput;
}

@InputType()
export class SocialInput {
  @Field({ nullable: true })
  instagram?: string;

  @Field({ nullable: true })
  pinterest?: string;

  @Field({ nullable: true })
  tiktok?: string;

  @Field({ nullable: true })
  twitter?: string;

  @Field({ nullable: true })
  facebook?: string;
}

@InputType('SubscriptionInput')
export class Subscription {
  @Field({ nullable: true })
  status?: string;
}
@InputType('RetentiontoolsInput')
export class Retentiontools {
  @Field({ nullable: true })
  status?: string;

  @Field({ nullable: true })
  updatedAt?: Date;
}
@InputType()
export class CreateStoreInput {
  @Field()
  id: string;

  @Field({ defaultValue: 'Active' })
  status?: string;

  @Field()
  shopifySessionId?: string;

  @Field({ nullable: true })
  brandName?: string;

  @Field()
  shop: string;

  @Field()
  accessToken?: string;

  @Field({ nullable: true })
  installationStep?: number | null;

  @Field({ nullable: true })
  logoImage?: string;

  @Field(() => [String], { nullable: true })
  industry?: string[];

  @Field((type) => SettingsInput)
  settings?: SettingsInput;

  @Field((type) => SocialInput)
  social?: SocialInput;

  @Field(() => BillingPlanEnum, { defaultValue: BillingPlanEnum.EXPLORE })
  plan?: BillingPlanEnum;

  @Field({ defaultValue: 0, nullable: true })
  totalGroupShop?: number;

  @Field(() => [Resource], { nullable: 'itemsAndList' })
  resources?: Resource[];

  @Field({ nullable: true })
  currencyCode: string;

  @Field(() => [String], { nullable: true })
  hideProducts?: string[];

  @Field({ nullable: true })
  timezone: string;

  @Field({ nullable: true })
  subscription?: Subscription;

  @Field({ nullable: true })
  retentiontool?: Retentiontools;

  createdAt?: Date;

  @Field({ defaultValue: new Date() })
  updatedAt: Date;

  @Field({ nullable: true })
  planResetDate: Date;
}
