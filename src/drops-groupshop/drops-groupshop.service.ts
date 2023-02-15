import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CreateDropsGroupshopInput } from './dto/create-drops-groupshop.input';
import { UpdateDropsGroupshopInput } from './dto/update-drops-groupshop.input';
import { v4 as uuid } from 'uuid';
import DropsGroupshop from './entities/dropsgroupshop.model';
import { getMongoManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MilestoneInput } from 'src/groupshops/dto/create-groupshops.input';
import { StoresService } from 'src/stores/stores.service';
import { EventType } from 'src/gs-common/entities/lifecycle.modal';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';

@Injectable()
export class DropsGroupshopService {
  constructor(
    @InjectRepository(DropsGroupshop)
    private DropsGroupshopRepository: Repository<DropsGroupshop>,
    @Inject(forwardRef(() => StoresService))
    private storesService: StoresService,
    private shopifyService: ShopifyService,
  ) {}

  async create(createDropsGroupshopInput: CreateDropsGroupshopInput) {
    console.log(
      '🚀 ~ file: drops-groupshop.service ~ line 19 ~ groupshop.service ~ create ~ createDropsGroupshopInput',
      createDropsGroupshopInput,
    );
    const id = uuid();

    const {
      drops: {
        rewards: { baseline },
      },
    } = await this.storesService.findById(createDropsGroupshopInput.storeId);

    const dropsGroupshop = await this.DropsGroupshopRepository.create({
      id,
      ...createDropsGroupshopInput,
    });

    const dgroupshop = await this.DropsGroupshopRepository.save(dropsGroupshop);

    dgroupshop.milestones = [{ activatedAt: new Date(), discount: baseline }];
    dgroupshop.members = [];

    this.update(id, dgroupshop);
  }

  async findDropsGS(discountCode: string) {
    const agg = [
      {
        $match: {
          'discountCode.title': discountCode,
        },
      },
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(DropsGroupshop, agg).toArray();
    return gs[0];
  }

  findAll() {
    return this.DropsGroupshopRepository.find();
  }

  async createDropDiscountCode(gs) {
    // console.log('createDropDiscountCode ', gs);
    const {
      shop,
      accessToken,
      drops: {
        rewards: { baseline },
        bestSellerCollectionId,
        latestCollectionId,
        allProductsCollectionId,
        runningOutCollectionId,
        skincareCollectionId,
        hairCollectionId,
      },
    } = await this.storesService.findById(gs.storeId);
    const discountTitle = gs?.discountCode.title;
    const discountCode = await this.shopifyService.setDiscountCode(
      shop,
      'Create',
      accessToken,
      discountTitle,
      parseInt(baseline, 10),
      [
        ...new Set([
          bestSellerCollectionId,
          latestCollectionId,
          allProductsCollectionId,
          runningOutCollectionId,
          skincareCollectionId,
          hairCollectionId,
        ]),
      ],
      new Date(),
      null,
      null,
      true,
    );
    return discountCode;
  }

  findAllNullDiscounts() {
    return this.DropsGroupshopRepository.find({
      where: { 'discountCode.title': null },
    });
  }

  async findDropGroupshopByCode(discountCode: string) {
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
          from: 'inventory',
          localField: 'store.drops.bestSellerCollectionId',
          foreignField: 'id',
          as: 'bestSeller',
        },
      },
      {
        $lookup: {
          from: 'inventory',
          localField: 'bestSeller.parentId',
          foreignField: 'id',
          as: 'bestSellerProducts',
        },
      },
      {
        $addFields: {
          bestSellerProducts: {
            $filter: {
              input: '$bestSellerProducts',
              as: 'j',
              cond: {
                $and: [
                  {
                    $ne: ['$$j.publishedAt', null],
                  },
                  {
                    $eq: ['$$j.status', 'ACTIVE'],
                  },
                ],
              },
            },
          },
        },
      },
      // {
      //   $lookup: {
      //     from: 'inventory',
      //     localField: 'store.drops.spotlightColletionId',
      //     foreignField: 'id',
      //     as: 'spotlight',
      //   },
      // },
      // {
      //   $lookup: {
      //     from: 'inventory',
      //     localField: 'spotlight.parentId',
      //     foreignField: 'id',
      //     as: 'spotlightProducts',
      //   },
      // },
      // {
      //   $addFields: {
      //     spotlightProducts: {
      //       $filter: {
      //         input: '$spotlightProducts',
      //         as: 'j',
      //         cond: {
      //           $and: [
      //             {
      //               $ne: ['$$j.publishedAt', null],
      //             },
      //             {
      //               $eq: ['$$j.status', 'ACTIVE'],
      //             },
      //           ],
      //         },
      //       },
      //     },
      //   },
      // },
      {
        $lookup: {
          from: 'inventory',
          localField: 'store.drops.runningOutCollectionId',
          foreignField: 'id',
          as: 'runningOutCollection',
        },
      },
      {
        $lookup: {
          from: 'inventory',
          localField: 'runningOutCollection.parentId',
          foreignField: 'id',
          as: 'runningOutProducts',
        },
      },
      {
        $addFields: {
          runningOutProducts: {
            $filter: {
              input: '$runningOutProducts',
              as: 'j',
              cond: {
                $and: [
                  {
                    $ne: ['$$j.publishedAt', null],
                  },
                  {
                    $eq: ['$$j.status', 'ACTIVE'],
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
          localField: 'store.drops.skincareCollectionId',
          foreignField: 'id',
          as: 'skincareCollection',
        },
      },
      {
        $lookup: {
          from: 'inventory',
          localField: 'skincareCollection.parentId',
          foreignField: 'id',
          as: 'skincareProducts',
        },
      },
      {
        $addFields: {
          skincareProducts: {
            $filter: {
              input: '$skincareProducts',
              as: 'j',
              cond: {
                $and: [
                  {
                    $ne: ['$$j.publishedAt', null],
                  },
                  {
                    $eq: ['$$j.status', 'ACTIVE'],
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
          localField: 'store.drops.hairCollectionId',
          foreignField: 'id',
          as: 'hairCollection',
        },
      },
      {
        $lookup: {
          from: 'inventory',
          localField: 'hairCollection.parentId',
          foreignField: 'id',
          as: 'hairProducts',
        },
      },
      {
        $addFields: {
          hairProducts: {
            $filter: {
              input: '$hairProducts',
              as: 'j',
              cond: {
                $and: [
                  {
                    $ne: ['$$j.publishedAt', null],
                  },
                  {
                    $eq: ['$$j.status', 'ACTIVE'],
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
          localField: 'store.drops.latestCollectionId',
          foreignField: 'id',
          as: 'latestCollection',
        },
      },
      {
        $lookup: {
          from: 'inventory',
          localField: 'latestCollection.parentId',
          foreignField: 'id',
          as: 'latestProducts',
        },
      },
      {
        $addFields: {
          latestProducts: {
            $filter: {
              input: '$latestProducts',
              as: 'j',
              cond: {
                $and: [
                  {
                    $ne: ['$$j.publishedAt', null],
                  },
                  {
                    $eq: ['$$j.status', 'ACTIVE'],
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
          localField: 'store.drops.allProductsCollectionId',
          foreignField: 'id',
          as: 'allProducts',
        },
      },
      {
        $lookup: {
          from: 'inventory',
          localField: 'allProducts.parentId',
          foreignField: 'id',
          as: 'allProducts',
        },
      },
      {
        $addFields: {
          allProducts: {
            $filter: {
              input: '$allProducts',
              as: 'j',
              cond: {
                $and: [
                  {
                    $ne: ['$$j.publishedAt', null],
                  },
                  {
                    $eq: ['$$j.status', 'ACTIVE'],
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
                                input: {
                                  $concatArrays: [
                                    {
                                      $ifNull: ['$latestProducts', []],
                                    },
                                    {
                                      $ifNull: ['$allProducts', []],
                                    },
                                    {
                                      $ifNull: ['$spotlightProducts', []],
                                    },
                                    {
                                      $ifNull: ['$bestSellerProducts', []],
                                    },
                                    {
                                      $ifNull: ['$hairProducts', []],
                                    },
                                    {
                                      $ifNull: ['$skincareProducts', []],
                                    },
                                    {
                                      $ifNull: ['$runningOutProducts', []],
                                    },
                                  ],
                                },
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
          from: 'orders',
          localField: 'members.orderId',
          foreignField: 'id',
          as: 'orders',
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
                    orderDetail: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$orders',
                            as: 'j',
                            cond: {
                              $eq: ['$$me.orderId', '$$j.id'],
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          bestSellerProducts: 1,
          spotlightProducts: 1,
          allProducts: 1,
          latestProducts: 1,
          createdAt: 1,
          customerDetail: 1,
          storeId: 1,
          totalProducts: 1,
          shortUrl: 1,
          url: 1,
          obSettings: 1,
          expiredUrl: 1,
          expiredShortUrl: 1,
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
          partnerRewards: 1,
          partnerDetails: 1,
          memberDetails: 1,
          refferalProducts: 1,
          ownerProducts: 1,
          isActive: 1,
          partnerCommission: 1,
          runningOutProducts: 1,
          skincareProducts: 1,
          hairProducts: 1,
        },
      },
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(DropsGroupshop, agg).toArray();
    return gs[0];
  }

  async updateExpireDate(
    updateGroupshopInput: UpdateDropsGroupshopInput,
    code: string,
  ) {
    const { id } = updateGroupshopInput;

    delete updateGroupshopInput.id;
    await this.DropsGroupshopRepository.update({ id }, updateGroupshopInput);
    return await this.findDropGroupshopByCode(code);
  }

  findOne(id: string) {
    return this.DropsGroupshopRepository.findOne({
      where: {
        id,
      },
    });
  }

  findOneByURL(url: string) {
    return this.DropsGroupshopRepository.findOne({
      where: {
        url,
      },
    });
  }

  async update(
    id: string,
    updateDropsGroupshopInput: UpdateDropsGroupshopInput,
  ) {
    await this.DropsGroupshopRepository.update(
      { id },
      {
        ...updateDropsGroupshopInput,
      },
    );
    return await this.findOne(id);
  }

  remove(id: string) {
    return `This action removes a #${id} dropsGroupshop`;
  }

  async findExpiredDropGroupshhop() {
    const agg = [
      {
        $match: {
          $and: [
            {
              status: 'active',
            },
            {
              expiredAt: {
                $lte: new Date(),
              },
            },
          ],
        },
      },
    ];
    const manager = getMongoManager();
    const result = await manager.aggregate(DropsGroupshop, agg).toArray();
    return result;
  }

  async findMissingDropShortLinks() {
    const agg = [
      {
        $match: {
          $or: [
            {
              shortUrl: {
                $regex: 'https://app.groupshop.co',
              },
            },
            {
              expiredShortUrl: {
                $regex: 'https://app.groupshop.co',
              },
            },
          ],
        },
      },
      {
        $limit: 10,
      },
    ];
    const manager = getMongoManager();
    const result = await manager.aggregate(DropsGroupshop, agg).toArray();
    return result;
  }

  async findOneByKlaviyoId(klaviyoId: string) {
    return await this.DropsGroupshopRepository.findOne({
      where: {
        'customerDetail.klaviyoId': klaviyoId,
      },
    });
  }

  async findByOrderId(orderId) {
    return await this.DropsGroupshopRepository.findOne({
      where: {
        'members.orderId': { $regex: `${orderId}` },
      },
    });
  }

  async getGroupshopByKlaviyoId(klaviyoId: string) {
    const agg = [
      {
        $match: {
          'customerDetail.klaviyoId': klaviyoId,
          status: 'pending',
        },
      },
    ];
    const manager = getMongoManager();
    const result = await manager.aggregate(DropsGroupshop, agg).toArray();
    return result;
  }

  async getActiveDrops(storeId: string) {
    const agg = [
      {
        $match: {
          storeId,
          discountCode: {
            $ne: null,
          },
          status: {
            $ne: 'pending',
          },
        },
      },
      {
        $lookup: {
          from: 'lifecycle',
          let: {
            gid: '$id',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ['$groupshopId', '$$gid'],
                    },
                    {
                      $eq: ['$event', EventType.revised],
                    },
                  ],
                },
              },
            },
          ],
          as: 'revisedList',
        },
      },
      {
        $addFields: {
          arrayLength: {
            $size: '$revisedList',
          },
        },
      },
      {
        $addFields: {
          isFullyExpired: {
            $cond: {
              if: {
                $and: [
                  {
                    $lt: ['$expiredAt', new Date()],
                  },
                  {
                    $eq: ['$arrayLength', 1],
                  },
                ],
              },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          discountCode: 1,
          isFullyExpired: 1,
        },
      },
    ];
    const manager = getMongoManager();
    const result = await manager.aggregate(DropsGroupshop, agg).toArray();
    return result;
  }
}
