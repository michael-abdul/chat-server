import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Controller('auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Signup API
  @Post('signup')
  signup(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  // Login API
  @Post('login')
  login(@Body() loginUserDto: LoginUserDto) {
    return this.userService.loginUser(loginUserDto);
  }
}
