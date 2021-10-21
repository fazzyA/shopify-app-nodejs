import { Column, Entity, ObjectIdColumn, PrimaryColumn } from 'typeorm';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';

@Entity()
export default class Product extends DefaultColumnsService {
  @ObjectIdColumn()
  _id: string;

  @PrimaryColumn()
  shopifyId: string;

  @Column()
  storeId: string;

  @Column()
  image: string;

  @Column()
  name: string;

  @Column()
  price: number;
}
