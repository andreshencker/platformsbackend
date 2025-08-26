import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  UserPlatform,
  UserPlatformSchema,
} from './schemas/user-platform.schema';
import { UserPlatformsService } from './user-platforms.service';
import { UserPlatformsController } from './user-platforms.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserPlatform.name, schema: UserPlatformSchema },
    ]),
  ],
  controllers: [UserPlatformsController],
  providers: [UserPlatformsService],
  exports: [UserPlatformsService],
})
export class UserPlatformsModule {}