import { Controller, Get, Put, Body, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { FirebaseAuthGuard } from "../auth/guards/firebase-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { User } from "@prisma/client";

@Controller("users")
@UseGuards(FirebaseAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  async getProfile(@CurrentUser() currentUser: User) {
    return {
      id: currentUser.id,
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      nome: `${currentUser.firstName} ${currentUser.lastName}`,
      email: currentUser.email,
      telefone: currentUser.phone,
      avatar: currentUser.avatar,
      role: currentUser.role,
      status: currentUser.status,
    };
  }

  @Put("me")
  async updateProfile(
    @CurrentUser() currentUser: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const updatedUser = await this.usersService.updateProfile(currentUser.id, updateProfileDto);
    return {
      success: true,
      message: "O seu perfil foi atualizado com sucesso.",
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        nome: `${updatedUser.firstName} ${updatedUser.lastName}`,
        email: updatedUser.email,
        telefone: updatedUser.phone,
        avatar: updatedUser.avatar,
        role: updatedUser.role,
        status: updatedUser.status,
      },
    };
  }
}
