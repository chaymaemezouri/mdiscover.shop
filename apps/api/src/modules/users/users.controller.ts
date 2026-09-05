import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ChangePasswordDto, CreateAddressDto, UpdateProfileDto } from './dto/users.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Mon profil' })
  profile(@Req() req: { user: { id: string } }) {
    return this.usersService.getProfile(req.user.id);
  }

  @Put('me')
  @ApiOperation({ summary: 'Modifier mon profil' })
  updateProfile(@Req() req: { user: { id: string } }, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Put('me/password')
  @ApiOperation({ summary: 'Changer mon mot de passe' })
  changePassword(@Req() req: { user: { id: string } }, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.id, dto);
  }

  @Get('me/addresses')
  @ApiOperation({ summary: 'Mes adresses' })
  addresses(@Req() req: { user: { id: string } }) {
    return this.usersService.getAddresses(req.user.id);
  }

  @Post('me/addresses')
  @ApiOperation({ summary: 'Ajouter une adresse' })
  createAddress(@Req() req: { user: { id: string } }, @Body() dto: CreateAddressDto) {
    return this.usersService.createAddress(req.user.id, dto);
  }

  @Delete('me/addresses/:id')
  @ApiOperation({ summary: 'Supprimer une adresse' })
  deleteAddress(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    return this.usersService.deleteAddress(req.user.id, id);
  }
}
