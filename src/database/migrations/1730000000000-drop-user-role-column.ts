import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropUserRoleColumn1730000000000 implements MigrationInterface {
  name = 'DropUserRoleColumn1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasUsers = await queryRunner.hasTable('users');
    if (!hasUsers) {
      return;
    }
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN IF EXISTS "role"');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasUsers = await queryRunner.hasTable('users');
    if (!hasUsers) {
      return;
    }
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" character varying NOT NULL DEFAULT 'user'`,
    );
  }
}
