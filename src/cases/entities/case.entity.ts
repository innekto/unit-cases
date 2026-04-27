import { UserEntity } from 'src/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { CaseCategories, CasePriority } from '@/common';

@Entity({ name: 'cases' })
export class CaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ type: 'varchar', default: null, nullable: true })
  description!: string | null;

  @Column({
    type: 'enum',
    enum: CaseCategories,
    default: CaseCategories.Work,
  })
  category!: CaseCategories;

  @Column({ type: 'enum', enum: CasePriority, default: CasePriority.Medium })
  priority!: CasePriority;

  @Column({ default: false })
  pinned!: boolean;

  @Column({ type: 'varchar' })
  createDate!: string;
  @Column({ type: 'varchar', nullable: false })
  deadline!: string;

  @Column({ type: 'varchar', default: null, nullable: true })
  completeDate!: string | null;

  @ManyToOne(() => UserEntity, (user) => user.cases, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;
}
