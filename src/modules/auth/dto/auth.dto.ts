import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;

  @MaxLength(120)
  name: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
