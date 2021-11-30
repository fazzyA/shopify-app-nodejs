import { InputType, ID, Field } from '@nestjs/graphql';
// import { Settings } from '../entities/settings.entity';
@InputType()
export class RewardInput {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  discount?: string;

  @Field({ nullable: true })
  customerDiscount?: string;
}
@InputType()
export class SalesTargetType {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  name: string;

  @Field({ nullable: true })
  rogsMin: string;

  @Field({ nullable: true })
  rogsMax: string;

  @Field({ nullable: true })
  status: string;

  @Field((type) => RewardInput)
  rewards: RewardInput[];
}

@InputType()
export class CreateAppsettingInput {
  @Field()
  id: string;

  @Field((type) => SalesTargetType)
  salestargets: SalesTargetType[];
}
