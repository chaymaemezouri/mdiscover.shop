import { IsString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateCouponDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty({ description: 'Sous-total en centimes' })
  @IsInt()
  @Min(0)
  subtotal: number;
}
