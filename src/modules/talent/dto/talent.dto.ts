import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTalentDto {
  @IsString()
  name: string;
  @IsString()
  email: string;

  @IsString()
  bio?: string;

  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  linkedinUrl?: string;

  @IsOptional()
  githubUrl?: string;

  @IsNumber()
  yearsOfExperience?: number;

  @IsNumber()
  expectedSalary?: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
