import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async register(userData: RegisterDto) {
    const exists = await this.userRepository.findOneBy({ email: userData.email });
    if (exists) throw new ConflictException('Email already exists');

    const user = this.userRepository.create({
      ...userData,
    });

    const savedUser = await this.userRepository.save(user);
    return savedUser;
  }

  async login(loginData: LoginDto) {
    const { email, password } = loginData;
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (!user || !(await user.comparePassword(password))) {
      throw new Error('Invalid credentials');
    }
    return user;
  }
}
