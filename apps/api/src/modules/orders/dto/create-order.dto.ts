import { IsString, IsOptional, IsInt, IsEnum, IsObject, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  cartId: string;

  @ApiProperty({ enum: ['STRIPE', 'COD'] })
  @IsEnum(['STRIPE', 'COD'])
  paymentMethod: 'STRIPE' | 'COD';

  @ApiProperty()
  @IsObject()
  shippingAddress: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @ApiPropertyOptional({ description: 'Frais de livraison en centimes' })
  @IsOptional()
  @IsInt()
  shippingCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  discount?: number;
}
