import { BaseEntity } from 'typeorm';

export abstract class BaseEntityResource {
  abstract toJson(entity: BaseEntity): Object;

  abstract toCompressed(entity: BaseEntity): Object;

  public manyToJson(entities: BaseEntity[]): Object[] {
    return entities.map((entity: BaseEntity) => this.toJson(entity));
  }

  public manyToCompressed(entities: BaseEntity[]): Object[] {
    return entities.map((entity: BaseEntity) => this.toCompressed(entity));
  }
}
