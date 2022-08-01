import {
  Controller,
  Get,
  HttpStatus,
  Logger,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { CampaignsService } from 'src/campaigns/campaigns.service';
import { GroupshopsService } from 'src/groupshops/groupshops.service';
import { ConfigService } from '@nestjs/config';
import { StoresService } from 'src/stores/stores.service';
import { PartnerService } from 'src/partners/partners.service';

@Controller('ext')
export class ThemeAppExtensionController {
  constructor(
    private configService: ConfigService,
    private campaignSrv: CampaignsService,
    private groupshopSrv: GroupshopsService,
    private storesService: StoresService,
    private partnerSrv: PartnerService,
  ) {}
  @Get('store')
  async getStoreWithActiveCampaign(@Req() req, @Res() res) {
    try {
      const { shop } = req.query;
      const {
        id,
        activeCampaign: {
          id: campaignId,
          salesTarget: {
            rewards: [, , { discount }],
          },
        },
        status,
        logoImage,
        brandName,
      } = await this.storesService.findOneWithActiveCampaing(shop);
      // console.log(await this.storesService.findOneWithActiveCampaing(shop));
      res.send(
        JSON.stringify({
          id,
          campaignId,
          status,
          discount,
          logoImage,
          brandName,
        }),
      );
    } catch (err) {
      Logger.error(err);
    } finally {
      // res.status(HttpStatus.OK).send();
    }
  }

  @Post('gslink')
  async getGroupshopURL(@Req() req, @Res() res) {
    try {
      const { storeid, campaignid, productid } = req.body;
      console.log({ productid });
      console.log({ campaignid });
      console.log('🚀 ~  ~ storeid', storeid);
      // console.log('🚀 ~  ~ shop', shop);

      const { id, url } = await this.groupshopSrv.getRunningGroupshop(
        campaignid,
        productid,
      );
      res.send(
        JSON.stringify({ id, url: `${this.configService.get('FRONT')}${url}` }),
      );
    } catch (err) {
      res.send(JSON.stringify({ id: null, url: null }));
    } finally {
      // res.status(HttpStatus.OK).send();
    }
  }

  @Post('member')
  async getMemberDetails(@Req() req, @Res() res) {
    try {
      const { orderId, wurl } = req.body;
      console.log('🚀  ~ wurl', wurl);
      console.log({ orderId });

      const {
        members,
        url,
        discountCode: { percentage },
      } = await this.groupshopSrv.findByOrderId(orderId);
      console.log(
        '🚀 ~ file: theme-app-extension.controller.ts ~ line 65 ~ ThemeAppExtensionController ~ getMemberDetails ~ members',
        members,
      );
      // console.log(await /this.groupshopSrv.findByOrderId(orderId));
      const activeMember = members.find((member) =>
        member.orderId.includes(orderId),
      );
      console.log(
        '🚀 ~ file: theme-app-extension.controller.ts ~ line 69 ~ ThemeAppExtensionController ~ getMemberDetails ~ activeMember',
        activeMember,
      );
      res.send(
        JSON.stringify({
          activeMember,
          url,
          percentage,
          members: members.length,
        }),
      );
    } catch (err) {
      res.send(JSON.stringify({ activeMember: null, url: null }));
    } finally {
      // res.status(HttpStatus.OK).send();
    }
  }

  @Post('products')
  async getCampainProducts(@Req() req, @Res() res) {
    try {
      const { campaignId } = req.body;
      console.log({ campaignId });

      const { products } = await this.campaignSrv.findOneWithProducts(
        campaignId,
      );

      res.send(JSON.stringify(products));
    } catch (err) {
      res.send(JSON.stringify({ products: null }));
    } finally {
      // res.status(HttpStatus.OK).send();
    }
  }

  @Post('partner')
  async getPartnerDetails(@Req() req, @Res() res) {
    try {
      const { discountCode } = req.body;
      console.log({ discountCode });

      const {
        url,
        partnerRewards: { baseline },
        partnerDetails: { fname },
      } = await this.partnerSrv.findOne(discountCode);

      res.send(
        JSON.stringify({
          url,
          baseline,
          fname,
        }),
      );
    } catch (err) {
      res.send(JSON.stringify({ activeMember: null, url: null }));
    } finally {
      // res.status(HttpStatus.OK).send();
    }
  }
}
