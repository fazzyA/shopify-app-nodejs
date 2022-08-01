import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getMongoManager, Like, Repository } from 'typeorm';
import {
  CreatePartnersInput,
  PartnerDetailsInput,
  PartnerRewardsInput,
} from './dto/create-partners.input';
import { UpdatePartnersInput } from './dto/update-partners.input';
import { partnerDetails, Partnergroupshop } from './entities/partner.modal';
import { v4 as uuid } from 'uuid';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';
import {
  DealProductsInput,
  DiscountCodeInput,
} from 'src/groupshops/dto/create-groupshops.input';
import { StoresService } from 'src/stores/stores.service';
import { GSPCreatedEvent } from './events/create-partner-groupshop.event';

@Injectable()
export class PartnerService {
  constructor(
    @InjectRepository(Partnergroupshop)
    private partnerRepository: Repository<Partnergroupshop>,
    private shopifyapi: ShopifyService,
    private storesService: StoresService,
    private gspEvent: GSPCreatedEvent,
  ) {}

  async findOne(discountCode: string) {
    console.log(
      '🚀 ~ file: partners.service.ts ~ line 31 ~ PartnerService ~ findOne ~ discountCode',
      discountCode,
    );
    const agg = [
      {
        $match: {
          'discountCode.title': discountCode,
        },
      },
      {
        $lookup: {
          from: 'store',
          localField: 'storeId',
          foreignField: 'id',
          as: 'store',
        },
      },
      {
        $unwind: {
          path: '$store',
        },
      },
      {
        $lookup: {
          from: 'campaign',
          localField: 'campaignId',
          foreignField: 'id',
          as: 'campaign',
        },
      },
      {
        $unwind: {
          path: '$campaign',
        },
      },
      {
        $lookup: {
          from: 'inventory',
          localField: 'campaign.products',
          foreignField: 'id',
          as: 'campaignProducts',
        },
      },
      {
        $addFields: {
          campaignProducts: {
            $filter: {
              input: '$campaignProducts',
              as: 'j',
              cond: {
                $and: [
                  {
                    $gte: ['$$j.price', '1.01'],
                  },
                  {
                    $not: {
                      $in: ['$$j.id', '$store.hideProducts'],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'partnermember',
          localField: 'id',
          foreignField: 'groupshopId',
          as: 'memberDetails',
        },
      },
      {
        $lookup: {
          from: 'inventory',
          localField: 'memberDetails.lineItems.product.id',
          foreignField: 'id',
          as: 'popularProducts',
        },
      },
      {
        $lookup: {
          from: 'inventory',
          localField: 'dealProducts.productId',
          foreignField: 'id',
          as: 'dealsProducts',
        },
      },
      {
        $addFields: {
          refferalProducts: {
            $filter: {
              input: '$dealProducts',
              as: 'j',
              cond: {
                $and: [
                  {
                    $eq: ['$$j.isInfluencer', false],
                  },
                ],
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'inventory',
          localField: 'refferalProducts.productId',
          foreignField: 'id',
          as: 'refferalProducts',
        },
      },
      {
        $addFields: {
          influencerProducts: {
            $filter: {
              input: '$dealProducts',
              as: 'j',
              cond: {
                $and: [
                  {
                    $eq: ['$$j.isInfluencer', true],
                  },
                ],
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'inventory',
          localField: 'influencerProducts.productId',
          foreignField: 'id',
          as: 'influencerProducts',
        },
      },
      {
        $addFields: {
          allProducts: {
            $concatArrays: ['$dealsProducts', '$campaignProducts'],
          },
        },
      },
      {
        $addFields: {
          popularProducts: {
            $concatArrays: [
              {
                $ifNull: ['$refferalProducts', []],
              },
              {
                $ifNull: ['$popularProducts', []],
              },
            ],
          },
        },
      },
      {
        $addFields: {
          bestSeller: {
            $filter: {
              input: '$allProducts',
              as: 'j',
              cond: {
                $gte: ['$$j.purchaseCount', 1],
              },
            },
          },
        },
      },
      {
        $sort: {
          'bestSeller.purchaseCount': -1,
        },
      },
      {
        $addFields: {
          members: {
            $map: {
              input: '$members',
              as: 'me',
              in: {
                $mergeObjects: [
                  '$$me',
                  {
                    products: {
                      $map: {
                        input: '$$me.lineItems',
                        in: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: '$popularProducts',
                                as: 'j',
                                cond: {
                                  $eq: ['$$this.product.id', '$$j.id'],
                                },
                              },
                            },
                            0,
                          ],
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'visitors',
          localField: 'id',
          foreignField: 'groupshopId',
          as: 'visitors',
        },
      },
      {
        $project: {
          bestSeller: {
            $slice: ['$bestSeller', 0, 15],
          },
          createdAt: 1,
          campaignId: 1,
          storeId: 1,
          totalProducts: 1,
          shortUrl: 1,
          url: 1,
          expiredAt: 1,
          dealProducts: 1,
          discountCode: 1,
          members: 1,
          milestones: 1,
          id: 1,
          updatedAt: 1,
          store: 1,
          popularProducts: 1,
          campaign: 1,
          allProducts: 1,
          partnerRewards: 1,
          partnerDetails: 1,
          memberDetails: 1,
          refferalProducts: 1,
          influencerProducts: 1,
          partnerCommission: 1,
          visitors: {
            $size: '$visitors',
          },
        },
      },
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(Partnergroupshop, agg).toArray();
    return gs[0];
  }

  async findById(id: string) {
    const agg = [
      {
        $match: {
          id: id,
        },
      },
      {
        $lookup: {
          from: 'store',
          localField: 'storeId',
          foreignField: 'id',
          as: 'store',
        },
      },
      {
        $unwind: {
          path: '$store',
        },
      },
      {
        $lookup: {
          from: 'campaign',
          localField: 'campaignId',
          foreignField: 'id',
          as: 'campaign',
        },
      },
      {
        $unwind: {
          path: '$campaign',
        },
      },
      {
        $lookup: {
          from: 'inventory',
          localField: 'campaign.products',
          foreignField: 'id',
          as: 'campaignProducts',
        },
      },
      {
        $addFields: {
          campaignProducts: {
            $filter: {
              input: '$campaignProducts',
              as: 'j',
              cond: {
                $and: [
                  {
                    $gte: ['$$j.price', '1.01'],
                  },
                  {
                    $not: {
                      $in: ['$$j.id', '$store.hideProducts'],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          popularProducts: {
            $map: {
              input: '$popularProducts',
              in: {
                $mergeObjects: [
                  '$$this',
                  {
                    lineItems: {
                      $filter: {
                        input: '$lineItemsDetails',
                        as: 'j',
                        cond: {
                          $eq: ['$$this.id', '$$j.product.id'],
                        },
                      },
                    },
                  },
                  {
                    orders: {
                      $filter: {
                        input: '$lineItemsDetails',
                        as: 'j',
                        cond: {
                          $eq: ['$$this.id', '$$j.product.id'],
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          members: {
            $map: {
              input: '$members',
              as: 'me',
              in: {
                $mergeObjects: [
                  '$$me',
                  {
                    products: {
                      $map: {
                        input: '$$me.lineItems',
                        in: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: '$popularProducts',
                                as: 'j',
                                cond: {
                                  $eq: ['$$this.product.id', '$$j.id'],
                                },
                              },
                            },
                            0,
                          ],
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'inventory',
          localField: 'dealProducts.productId',
          foreignField: 'id',
          as: 'dealsProducts',
        },
      },
      {
        $addFields: {
          dealsProducts: {
            $filter: {
              input: '$dealsProducts',
              as: 'j',
              cond: {
                $and: [
                  {
                    $gte: ['$$j.price', '1.01'],
                  },
                  {
                    $not: {
                      $in: ['$$j.id', '$store.hideProducts'],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          allProducts: {
            $concatArrays: ['$dealsProducts', '$campaignProducts'],
          },
        },
      },
      {
        $addFields: {
          popularProducts: {
            $concatArrays: [
              {
                $ifNull: ['$dealsProducts', []],
              },
              {
                $ifNull: ['$popularProducts', []],
              },
            ],
          },
        },
      },
      {
        $addFields: {
          bestSeller: {
            $filter: {
              input: '$allProducts',
              as: 'j',
              cond: {
                $gte: ['$$j.purchaseCount', 1],
              },
            },
          },
        },
      },
      {
        $sort: {
          'bestSeller.purchaseCount': -1,
        },
      },
      {
        $lookup: {
          from: 'visitors',
          localField: 'id',
          foreignField: 'groupshopId',
          as: 'visitors',
        },
      },
      {
        $project: {
          bestSeller: {
            $slice: ['$bestSeller', 0, 15],
          },
          createdAt: 1,
          campaignId: 1,
          storeId: 1,
          totalProducts: 1,
          shortUrl: 1,
          url: 1,
          expiredAt: 1,
          dealProducts: 1,
          discountCode: 1,
          members: 1,
          milestones: 1,
          id: 1,
          updatedAt: 1,
          store: 1,
          popularProducts: 1,
          campaign: 1,
          allProducts: 1,
          partnerRewards: 1,
          partnerDetails: 1,
          visitors: {
            $size: '$visitors',
          },
        },
      },
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(Partnergroupshop, agg).toArray();
    return gs[0];
  }

  async create(createPartnersInput: CreatePartnersInput) {
    // console.log(
    //   'createGroupshopInput : ' + JSON.stringify(createPartnersInput),
    // );
    const partner = this.partnerRepository.create(createPartnersInput);

    const { shop, accessToken, brandName, logoImage } =
      await this.storesService.findById(createPartnersInput.storeId);
    // console.log(shop);
    // console.log(accessToken);
    const customerDetails = await this.shopifyapi.getCustomerByEmail(
      shop,
      accessToken,
      createPartnersInput.partnerDetails['email'],
    );

    const parDetail: partnerDetails = {
      fname:
        customerDetails?.body?.['data']['customers']['edges'].length > 0
          ? customerDetails?.body?.['data']['customers']['edges'][0]['node'][
              'firstName'
            ]
          : null,
      lname:
        customerDetails?.body?.['data']['customers']['edges'].length > 0
          ? customerDetails?.body?.['data']['customers']['edges'][0]['node'][
              'lastName'
            ]
          : null,
      email: createPartnersInput.partnerDetails['email'],
      shopifyCustomerId:
        customerDetails?.body?.['data']['customers']['edges'].length > 0
          ? customerDetails?.body?.['data']['customers']['edges'][0]['node'][
              'id'
            ]
          : null,
    };

    partner.dealProducts = [new DealProductsInput()];
    partner.partnerDetails = new PartnerDetailsInput();
    partner.partnerRewards = new PartnerRewardsInput();
    partner.discountCode = new DiscountCodeInput();
    partner.id = uuid();
    partner.campaignId = createPartnersInput.campaignId;
    partner.storeId = createPartnersInput.storeId;
    partner.url = createPartnersInput.url;
    partner.shortUrl = createPartnersInput.shortUrl;
    partner.dealProducts = createPartnersInput?.dealProducts || [];
    partner.discountCode = createPartnersInput.discountCode;
    partner.partnerDetails = parDetail;
    partner.partnerRewards = createPartnersInput.partnerRewards;
    partner.partnerCommission = createPartnersInput.partnerCommission;
    partner.isActive = true;
    partner.createdAt = createPartnersInput.createdAt;
    const newGSP = await this.partnerRepository.save(partner);
    this.gspEvent.groupshop = newGSP;
    this.gspEvent.shop = shop;
    this.gspEvent.accessToken = accessToken;
    this.gspEvent.brandName = brandName;
    this.gspEvent.brandLogo = logoImage;
    this.gspEvent.email = createPartnersInput.partnerDetails['email'];
    this.gspEvent.emit();
    return newGSP;
  }

  findAll(storeId: string) {
    return this.partnerRepository.find({
      where: { storeId },
      order: {
        createdAt: -1,
      },
    });
  }

  async update(id: string, updatePartnersInput: UpdatePartnersInput) {
    console.log(
      '🚀 ~ file:PartnerService updatePartnersInput',
      updatePartnersInput,
    );
    // const { storeId, partnerCommission, isActive } = updatePartnersInput;
    const res = await this.partnerRepository.update(
      { id },
      updatePartnersInput,
    );
    if (
      updatePartnersInput?.dealProducts &&
      updatePartnersInput?.dealProducts?.length > 0
    ) {
      const gsp = await this.findById(id);
      console.log(
        '🚀 ~ file: partners.service.ts ~ line 606 ~ PartnerService ~ update ~ gsp',
        gsp,
      );
      const {
        discountCode: { priceRuleId, percentage, title },
        store: { shop, accessToken },
        allProducts,
      } = gsp;
      console.log(
        '🚀 ~ file: partners.service.ts ~ line 616 ~ PartnerService ~ update ~ allProducts',
        allProducts,
      );
      const allNewProducts = allProducts.map((item) => item.id);
      console.log(
        '🚀 ~ file: partners.service.ts ~ line 621 ~ PartnerService ~ update ~ allNewProducts',
        allNewProducts,
      );
      await this.shopifyapi.setDiscountCode(
        shop,
        'Update',
        accessToken,
        null,
        null,
        allNewProducts,
        null,
        null,
        priceRuleId,
      );
    }

    return updatePartnersInput;
  }

  async existPartnerGroupshop(email: string, storeId: string) {
    const response = await this.partnerRepository.find({
      where: { storeId: storeId, 'partnerDetails.email': email },
    });
    const res = {
      isActive: response[0]?.isActive ? true : false,
    };
    return res;
  }

  async getpartnerDetail(pid: string) {
    return await this.partnerRepository.findOne(pid);
  }

  async removeShop(storeId: string) {
    return await this.partnerRepository.delete({ storeId });
  }
  findAllByDate(sdate: Date, edate: Date) {
    return this.partnerRepository.find({
      where: {
        createdAt: {
          $gte: new Date(sdate),
          $lt: new Date(edate),
        },
      },
    });
  }
}
