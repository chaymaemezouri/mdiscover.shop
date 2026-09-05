import { IsEmail, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubscribeDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ enum: ['FR', 'AR', 'EN'] })
  @IsOptional()
  @IsEnum(['FR', 'AR', 'EN'])
  locale?: 'FR' | 'AR' | 'EN';
}
