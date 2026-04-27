import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { UserEntity } from '@/users/entities/user.entity';

const ADMIN_EMAIL = 'admin@email.com';

@Injectable()
export class AdminSeedService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async run() {
    const adminExists = await this.userRepository.exist({
      where: { email: ADMIN_EMAIL },
    });

    if (!adminExists) {
      const admin = new UserEntity();
      admin.username = 'admin admin';
      admin.email = ADMIN_EMAIL;
      admin.password = await bcrypt.hash('password', 10);

      await this.userRepository.save(admin);
    }
  }
}
