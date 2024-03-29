import { InputType, Int, Field, ID, Float } from '@nestjs/graphql';
import {
  DealProductsInput,
  DiscountCodeInput,
} from 'src/groupshops/dto/create-groupshops.input';
import { Member } from 'src/groupshops/entities/groupshop.entity';

@InputType()
export class PartnerDetailsInput {
  @Field({ nullable: true })
  fname: string;
  @Field({ nullable: true })
  lname: string;
  @Field({ nullable: true })
  email: string;
  @Field({ nullable: true })
  shopifyCustomerId?: string;
}

@InputType()
export class PartnerRewardsInput {
  @Field({ nullable: true })
  baseline: string;
  @Field({ nullable: true })
  average: string;
  @Field({ nullable: true })
  maximum: string;
}

@InputType()
export class CreatePartnersInput {
  constructor(createdAt?: Date, updatedAt?: Date) {
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }
  @Field({ nullable: true })
  campaignId: string;

  @Field()
  storeId: string;

  @Field(() => [DealProductsInput], { nullable: 'itemsAndList' })
  dealProducts?: DealProductsInput[];

  @Field({ nullable: true })
  url?: string;

  @Field({ nullable: true })
  shortUrl?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt?: Date;

  @Field(() => DiscountCodeInput)
  discountCode: DiscountCodeInput;

  @Field(() => PartnerDetailsInput)
  partnerDetails: PartnerDetailsInput;

  @Field(() => PartnerRewardsInput)
  partnerRewards: PartnerRewardsInput;

  @Field({ nullable: true })
  partnerCommission?: string;

  @Field({ nullable: true })
  isActive?: boolean;
}
