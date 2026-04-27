import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameUserBalanceToLifeBalance1720000000000 implements MigrationInterface {
  name = 'RenameUserBalanceToLifeBalance1720000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "user_balance" RENAME TO "life_balance"');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "life_balance" RENAME TO "user_balance"');
  }
}
