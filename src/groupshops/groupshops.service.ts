import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateGroupshopInput,
  DealProductsInput,
  MemberInput,
  MilestoneInput,
} from './dto/create-groupshops.input';
import { UpdateGroupshopInput } from './dto/update-groupshops.input';
import { Groupshops } from './entities/groupshop.modal';
import { v4 as uuid } from 'uuid';

@Injectable()
export class GroupshopsService {
  constructor(
    @InjectRepository(Groupshops)
    private groupshopRepository: Repository<Groupshops>,
  ) {}
  async create(createGroupshopInput: CreateGroupshopInput) {
    console.log(
      '🚀 ~ file: groupshops.service.ts ~ line 8 ~ GroupshopsService ~ create ~ createGroupshopInput',
      createGroupshopInput,
    );
    const groupshop = this.groupshopRepository.create(createGroupshopInput);
    groupshop.dealProducts = [new DealProductsInput()];
    groupshop.id = uuid();
    groupshop.dealProducts = createGroupshopInput.dealProducts;
    groupshop.members = [new MemberInput()];
    groupshop.members = createGroupshopInput.members;
    groupshop.milestones = [new MilestoneInput()];
    groupshop.milestones = createGroupshopInput.milestones;
    // groupshop.members.map

    return this.groupshopRepository.save(groupshop);
  }

  findAll() {
    return `This action returns all Groupshops`;
  }

  findOne(discountCode: string) {
    return this.groupshopRepository.findOne({
      where: { 'discountCode.title': discountCode },
    });
  }

  update(id: string, updateGroupshopInput: UpdateGroupshopInput) {
    return this.groupshopRepository.update(id, updateGroupshopInput);
  }

  remove(id: number) {
    return `This action removes a #${id} Groupshop`;
  }
}
