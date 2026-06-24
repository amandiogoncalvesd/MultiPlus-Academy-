import { Module } from "@nestjs/common";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";

// Mock NestJS controller definitions for visual representation of core routes
class BaseController {
  protected success(data: any) {
    return { success: true, timestamp: new Date().toISOString(), data };
  }
}

// 3. Courses Module
@Module({})
class CoursesModule {}

// 4. Course Modules
@Module({})
class CourseModulesModule {}

// 5. Lessons Module
@Module({})
class LessonsModule {}

// 6. Enrollments Module
@Module({})
class EnrollmentsModule {}

// 7. Assessments Module
@Module({})
class AssessmentsModule {}

// 8. Certificates Module
@Module({})
class CertificatesModule {}

// 9. Payments Module
@Module({})
class PaymentsModule {}

// 10. Blog Module
@Module({})
class BlogModule {}

// 11. Events Module
@Module({})
class EventsModule {}

// 12. Notifications Module
@Module({})
class NotificationsModule {}

// 13. Cloudinary Uploads Module
@Module({})
class UploadsModule {}

// 14. Extra pedagogical support modules requested:
// learning-paths, assignments, quizzes, grades, attendance, announcements, emails, chats
@Module({})
class LearningPathsModule {}

@Module({})
class AssignmentsModule {}

@Module({})
class QuizzesModule {}

@Module({})
class GradesModule {}

@Module({})
class AttendanceModule {}

@Module({})
class AnnouncementsModule {}

@Module({})
class EmailsModule {}

@Module({})
class ChatsModule {}

@Module({
  imports: [
    AuthModule,
    UsersModule,
    CoursesModule,
    CourseModulesModule,
    LessonsModule,
    EnrollmentsModule,
    AssessmentsModule,
    CertificatesModule,
    PaymentsModule,
    BlogModule,
    EventsModule,
    NotificationsModule,
    UploadsModule,
    LearningPathsModule,
    AssignmentsModule,
    QuizzesModule,
    GradesModule,
    AttendanceModule,
    AnnouncementsModule,
    EmailsModule,
    ChatsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
