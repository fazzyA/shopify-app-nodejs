import { InputType, Int, Field, ObjectType } from '@nestjs/graphql';

@InputType('LineProductInput')
@ObjectType('LineProduct')
export class LineProduct {
  @Field({ nullable: true })
  id: string;
}

@InputType('CustomerInput')
@ObjectType('Customer')
export class Customer {
  @Field({ nullable: true })
  firstName: string;
  @Field({ nullable: true })
  LastName: string;
  @Field({ nullable: true })
  email: string;
  @Field({ nullable: true })
  ip?: string;
  @Field({ nullable: true })
  phone: string;
}

@InputType('DiscountInfoInput')
@ObjectType('DiscountInfo')
export class DiscountInfo {
  @Field({ nullable: true })
  code: string;
  @Field({ nullable: true })
  amount: string;
  @Field({ nullable: true })
  type: string;
  constructor(dc?: DiscountInfo | null) {
    this.code = dc?.code;
    this.amount = dc?.amount;
    this.type = dc?.type;
  }
}
@ObjectType('Order')
@InputType()
export class CreateOrderInput {
  @Field({ description: 'shopify entity admin_graphql_api_id' })
  id: string;

  @Field({ nullable: true })
  name: string;
  @Field({ nullable: true })
  shopifyCreatedAt?: string;
  @Field({ nullable: true })
  confirmed?: boolean;
  @Field({ nullable: true })
  cancelledAt?: string;
  @Field({ nullable: true })
  shop?: string;
  @Field({ nullable: true })
  totalPrice?: string;
  @Field({ nullable: true })
  parentId?: string;
  @Field(() => LineProduct)
  product?: LineProduct;
  @Field({ nullable: true })
  price?: string;
  @Field({ nullable: true })
  quantity?: number;
  @Field({ nullable: true })
  currencyCode?: string;
  @Field({ nullable: true })
  discountCode?: string;
  @Field({ nullable: true })
  totalDiscounts?: string;
  @Field(() => Customer)
  customer?: Customer;
  @Field(() => DiscountInfo)
  discountInfo?: DiscountInfo[];
}