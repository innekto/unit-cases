import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';

import { UserEntity } from './user.entity';

@Entity({ name: 'behavior_profile_snapshot' })
@Unique('uniq_behavior_snapshot_user_week', ['userId', 'weekStart'])
export class BehaviorProfileSnapshotEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column({ type: 'varchar' })
  weekStart!: string;

  @Column({ type: 'varchar' })
  weekEnd!: string;

  @Column({ type: 'varchar' })
  type!: 'human' | 'replicant' | 'undefined';

  @Column({ type: 'float' })
  score!: number;

  @Column({ type: 'simple-json' })
  metrics!: Record<string, any>;

  @Column({ type: 'varchar', nullable: true })
  seenAt!: string | null;

  @Column({ type: 'varchar' })
  createdAt!: string;
}
