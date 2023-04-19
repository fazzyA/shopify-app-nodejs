import { InputType, Int, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsEmail, MinLength } from 'class-validator';
import { stubString } from 'lodash';

@InputType()
export class PermissionInput {
  @Field({ nullable: true })
  name: string;
  @Field({ nullable: true })
  category: string;
}

@InputType()
export class CreateAdminRoleInput {
  @Field({ nullable: true })
  @IsNotEmpty()
  @MinLength(3)
  roleName: string;

  @Field(() => [PermissionInput], { nullable: 'itemsAndList' })
  permission?: PermissionInput[];

  @Field({ defaultValue: new Date() })
  createdAt: Date;

  @Field({ defaultValue: new Date() })
  updatedAt?: Date;
}