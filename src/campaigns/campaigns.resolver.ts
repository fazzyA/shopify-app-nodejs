import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { CampaignsService } from './campaigns.service';
import { Campaign } from './entities/campaign.entity';
import { CreateCampaignInput } from './dto/create-campaign.input';
import { UpdateCampaignInput } from './dto/update-campaign.input';

@Resolver(() => Campaign)
export class CampaignsResolver {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Mutation(() => Campaign)
  createCampaign(
    @Args('createCampaignInput') createCampaignInput: CreateCampaignInput,
  ) {
    console.log(
      '🚀 ~ file: campaigns.resolver.ts ~ line 15 ~ CampaignsResolver ~ createCampaignInput',
      createCampaignInput,
    );
    return this.campaignsService.create(createCampaignInput);
  }

  @Query(() => [Campaign], { name: 'campaigns' })
  async findAll(@Args('storeId') storeId: string) {
    // return this.campaignsService.findAll(storeId);
    return await this.campaignsService.findAllWithDetails(storeId);
  }

  @Query(() => [Campaign], { name: 'overviews' })
  async findOverviewAll(@Args('storeId') storeId: string) {
    const data = await this.campaignsService.findOverviewDetails(storeId);
    return data;
  }

  @Query(() => Campaign, { name: 'campaign' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.campaignsService.findOne(id);
  }

  @Mutation(() => Campaign)
  updateCampaign(
    @Args('updateCampaignInput') updateCampaignInput: UpdateCampaignInput,
  ) {
    return this.campaignsService.update(
      updateCampaignInput.id,
      updateCampaignInput,
    );
  }

  @Mutation(() => Campaign)
  removeCampaign(@Args('id', { type: () => Int }) id: string) {
    return this.campaignsService.remove(id);
  }
}
