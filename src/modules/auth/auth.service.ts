import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { User, UserRole } from './entities/user.entity';
import { Repository } from 'typeorm';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { JwtService } from '@nestjs/jwt';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(userData: RegisterDto) {
    const exists = await this.userRepository.findOneBy({ email: userData.email });
    if (exists) throw new ConflictException('Email already exists');

    const user = this.userRepository.create({
      ...userData,
    });

    await this.userRepository.save(user);
    return this.signToken(user);
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
    return this.signToken(user);
  }

  async validateUser(payload: JwtPayload): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: payload.sub });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  private signToken(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }
}
