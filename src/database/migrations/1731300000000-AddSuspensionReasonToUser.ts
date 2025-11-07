import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSuspensionReasonToUser1731300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if the column already exists
    const table = await queryRunner.getTable('user');
    const suspensionReasonColumn = table?.findColumnByName('suspension_reason');

    if (!suspensionReasonColumn) {
      await queryRunner.addColumn(
        'user',
        new TableColumn({
          name: 'suspension_reason',
          type: 'text',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('user', 'suspension_reason');
  }
}
