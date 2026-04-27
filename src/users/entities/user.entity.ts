import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { CaseEntity } from '@/cases/entities/case.entity';
import { LifeBalanceEntity } from '@/life-balance/entities/life-balance.entity';
import { Session } from '@/session/entities/session.entity';

import { CreateUserDto } from '../dto/create-user.dto';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column({ unique: true })
  username!: string;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  password!: string | null;

  @Column({ type: 'varchar', nullable: true })
  image!: string | null;

  @Column({ default: 0, nullable: true })
  points!: number;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  emailVerificationCode!: string | null;

  @Column({ type: 'varchar', nullable: true })
  emailVerificationExpires!: string | null;

  @Column({ type: 'int', default: 0 })
  emailVerificationAttempts!: number;

  @Column({ default: false })
  emailVerified!: boolean;

  @Column({ type: 'varchar', nullable: true })
  emailVerifiedAt!: string | null;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  passwordResetToken!: string | null;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  passwordResetExpires!: string | null;

  @Exclude()
  @Column({ type: 'int', default: 0 })
  passwordResetAttempts!: number;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  passwordResetVerifiedAt!: string | null;

  @Column({ default: false })
  isActive!: boolean;

  @Column({ default: false })
  isLoggedIn!: boolean;

  @Column({ type: 'varchar', nullable: true })
  createdAt!: string | null;

  @Column({ type: 'varchar', nullable: true })
  updatedAt!: string | null;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  deletedAt!: string | null;

  @OneToMany(() => CaseEntity, (c) => c.user)
  @ApiHideProperty()
  cases!: CaseEntity[];

  @OneToOne(() => LifeBalanceEntity, (lifeBalance) => lifeBalance.user)
  lifeBalance!: LifeBalanceEntity;

  @OneToMany(() => Session, (session) => session.user, {
    eager: true,
  })
  sessions!: Session[];

  constructor(user?: Partial<CreateUserDto>) {
    if (!user?.email || !user.username) return;
    this.email = user.email;
    this.username = user.username;
    this.createdAt = new Date().toISOString();
  }
}
