import { Column, Entity } from 'typeorm';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';
import Product from './product.model';

@Entity()
export default class Campaign extends DefaultColumnsService {
  @Column()
  storeId: string;

  @Column({ nullable: true })
  salesTargetId: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  joinExistingGroupshop: boolean;

  @Column()
  collectionId: string;

  // @Column(() => Product)
  // products?: Product[];

  @Column('string', { nullable: true })
  products?: string[];
}