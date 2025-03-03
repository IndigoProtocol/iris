import {
  BaseEntity,
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'assets' })
@Index(['policyId', 'nameHex'], { unique: true })
export class Asset extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 56 })
  policyId: string;

  @Column()
  nameHex: string;

  @Column()
  isLpToken: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true, default: null })
  decimals: number;

  @Column({ nullable: true, default: null })
  name: string;

  @Column({ nullable: true, default: null })
  ticker: string;

  @Column({ nullable: true, default: null })
  logo: string;

  @Column({ nullable: true, default: null })
  description: string;

  @Column({ nullable: true })
  meta: string;

  /**
   * Asset constructor.
   */
  constructor(policyId: string, nameHex: string) {
    super();

    this.policyId = policyId;
    this.nameHex = nameHex;
  }

  static fromId(id: string): Asset {
    id = id.replace('.', '');

    return new Asset(id.slice(0, 56), id.slice(56));
  }

  identifier(dilimeter: '' | '.' = ''): string {
    return `${this.policyId}${dilimeter}${this.nameHex}`;
  }

  get assetName(): string {
    return Buffer.from(this.nameHex, 'hex').toString();
  }
}

export type Token = Asset | 'lovelace';
