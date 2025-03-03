import { DataSource } from 'typeorm';

// Note: used for data migration, local only
export const AppDataSource = new DataSource({
  type: 'mysql', // or your database type
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'rootpass',
  database: 'mydb',
  entities: ['src/entity/**/*.ts'],
  synchronize: false,
  logging: true,
});
