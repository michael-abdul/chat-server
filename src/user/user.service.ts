import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const user = new User();
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    user.username = createUserDto.username;
    user.password = hashedPassword; 
    return this.userRepository.save(user);
  }

  async loginUser(loginUserDto: LoginUserDto): Promise<{ message: string }> {
    const { username, password } = loginUserDto;
    const user = await this.userRepository.findOneBy({ username });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials'); 
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    return { message: 'Login successful' };
}
}
