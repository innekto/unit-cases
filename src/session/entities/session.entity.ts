import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { UserEntity } from '@/users/entities/user.entity';

@Entity()
export class Session {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', nullable: true })
  createdAt!: string;

  @Column({ type: 'varchar', default: null, nullable: true })
  deletedAt!: string | null;

  @ManyToOne(() => UserEntity, (user) => user.sessions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  constructor() {
    this.createdAt = new Date().toISOString();
  }
}
