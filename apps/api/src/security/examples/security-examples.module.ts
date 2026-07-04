import { Module } from '@nestjs/common';
import { SecureCoursesController } from './courses.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  imports: [],
  controllers: [SecureCoursesController],
  providers: [PrismaService],
})
export class SecurityExamplesModule {}
