import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddStripeCouponIdToPromoCode1731410000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('promo_code');
    const stripeCouponIdColumn = table?.findColumnByName('stripe_coupon_id');

    if (!stripeCouponIdColumn) {
      await queryRunner.addColumn(
        'promo_code',
        new TableColumn({
          name: 'stripe_coupon_id',
          type: 'varchar',
          length: '255',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('promo_code', 'stripe_coupon_id');
  }
}
