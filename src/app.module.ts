import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { User } from './user/entities/user.entity';
import { Logger } from '@nestjs/common';

const logger = new Logger('DatabaseConnection');
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async () => {
        const logger = new Logger('DatabaseConnection');
        logger.log('Database connection successful!');
        return {
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      password: 'povice1004',
      username: 'postgres',
      entities: [User],
      database: 'postgres',
      synchronize: true,
      logging: true,
        }
      }
    }),
    UserModule,
  ],
  providers: [SocketGateway],
})
export class AppModule {}
