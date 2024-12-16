import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
async function bootstrap() {
  const appHttp = await NestFactory.create(AppModule);

  // 创建一个临时的应用实例来获取 ConfigService
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const configServiceIns = appContext.get(ConfigService);
  // http端口
  const httpPort = configServiceIns.get('ORDER_SERVICE_PORT_HTTP');
  // 设置全局路由前缀
  appHttp.setGlobalPrefix('api');
  // JWT  全局守卫
  // 使用全局守卫
  const jwtAuthGuard = appHttp.get(JwtAuthGuard);
  appHttp.useGlobalGuards(jwtAuthGuard);
  await appHttp.listen(httpPort);

  // 微服务端口
  const microPort = configServiceIns.get('ORDER_SERVICE_PORT_MCRO');
  // 创建微服务实例
  const appMicro = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        port: microPort,
      },
    },
  );

  await appMicro.listen();
  console.log(
    `Order microservice is running on port http://localhost:${microPort}`,
  );
  console.log(`HTTP server is running on: http://localhost:${httpPort}`);

  // 关闭临时的应用上下文
  await appContext.close();
}

bootstrap();
