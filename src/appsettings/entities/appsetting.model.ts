import { Column, Entity } from 'typeorm';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';
import { SalesTarget } from './sales-target.model';
import { PartnerRewards } from 'src/partners/entities/partner.modal';

@Entity()
export class Appsetting extends DefaultColumnsService {
  @Column()
  id: string;

  @Column((type) => SalesTarget)
  salestargets: SalesTarget[];

  @Column({ nullable: true })
  details?: PartnerRewards;
}
