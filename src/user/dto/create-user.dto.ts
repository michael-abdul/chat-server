import {
    IsAlphanumeric,
    IsNotEmpty,
    Matches,
    MinLength,
  } from 'class-validator';
  
  const passwordRegEx =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
  
  export class CreateUserDto {
    @IsNotEmpty()
    @MinLength(3, { message: 'Username must have at least 3 characters.' })
    @IsAlphanumeric(null, {
      message: 'Username must contain only alphanumeric characters.',
    })
    username: string;
  
    @IsNotEmpty()
    @Matches(passwordRegEx, {
      message: `Password must be 8-20 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.`,
    })
    password: string;
  }
  