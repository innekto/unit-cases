import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { UserEntity } from '@/users/entities/user.entity';

import { CreateLifeBalanceDto } from '../dto/create-life-balance.dto';

@Entity({ name: 'life_balance' })
export class LifeBalanceEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty({ example: 0, description: 'Creative balance' })
  @Column({ default: 0 })
  creative!: number;

  @ApiProperty({ example: 50, description: 'Work balance' })
  @Column({ default: 0 })
  work!: number;

  @ApiProperty({ example: 25, description: 'Life balance' })
  @Column({ default: 0 })
  life!: number;

  @ApiProperty({ example: 25, description: 'Learning balance' })
  @Column({ default: 0 })
  learning!: number;

  @ApiProperty({ example: 0, description: 'Rest balance' })
  @Column({ default: 0 })
  rest!: number;

  @ApiProperty({ example: 0, description: 'Social balance' })
  @Column({ default: 0 })
  social!: number;

  @Exclude()
  @OneToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  constructor(payload?: CreateLifeBalanceDto) {
    if (!payload) return;
    this.creative = payload.creative;
    this.work = payload.work;
    this.life = payload.life;
    this.learning = payload.learning;
    this.rest = payload.rest;
    this.social = payload.social;
  }
}
