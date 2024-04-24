import { Module, Logger } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { HttpModule, HttpService } from "@nestjs/axios";
import { PrometheusModule } from "@willsoto/nestjs-prometheus";
import config from "./config";
import { HealthModule } from "./health/health.module";
import { AppService } from "./app.service";
import { TokenService } from "./token/token.service";
import { AdapterService } from "./points/adapter.service";
import { TokenOffChainDataProvider } from "./token/tokenOffChainData/tokenOffChainDataProvider.abstract";
import { CoingeckoTokenOffChainDataProvider } from "./token/tokenOffChainData/providers/coingecko/coingeckoTokenOffChainDataProvider";
import { PortalsFiTokenOffChainDataProvider } from "./token/tokenOffChainData/providers/portalsFi/portalsFiTokenOffChainDataProvider";
import { TokenOffChainDataSaverService } from "./token/tokenOffChainData/tokenOffChainDataSaver.service";
import {
  BatchRepository,
  BlockRepository,
  TokenRepository,
  TransferRepository,
  LogRepository,
  BalanceRepository,
  PointsRepository,
  PointsHistoryRepository,
  AddressFirstDepositRepository,
} from "./repositories";
import {
  Batch,
  Block,
  Transaction,
  AddressTransaction,
  TransactionReceipt,
  Log,
  Token,
  Address,
  Transfer,
  AddressTransfer,
  Balance,
  Point,
  PointsHistory,
  Referral,
  BlockAddressPoint,
  Invite,
  AddressTvl,
  AddressTokenTvl,
  GroupTvl,
  PointsOfLp,
  BlockAddressPointOfLp,
  BalanceOfLp,
} from "./entities";
import { typeOrmModuleOptions, typeOrmReferModuleOptions } from "./typeorm.config";
import { RetryDelayProvider } from "./retryDelay.provider";
import { MetricsModule } from "./metrics";
import { DbMetricsService } from "./dbMetrics.service";
import { UnitOfWorkModule } from "./unitOfWork";
import { DepositPointService } from "./points/depositPoint.service";
import { BlockTokenPriceRepository } from "./repositories";
import { BlockTokenPrice } from "./entities";
import { BlockAddressPointRepository } from "./repositories";
import { InviteRepository } from "./repositories";
import { ReferrerRepository } from "./repositories";
import { BlockGroupTvl } from "./entities/blockGroupTvl.entity";
import { GroupTvlRepository } from "./repositories";
import { AddressTvlRepository } from "./repositories";
import { AddressFirstDeposit } from "./entities/addressFirstDeposit.entity";
import { BalanceOfLpRepository } from "./repositories";
import { PointsOfLpRepository } from "./repositories";
import { BlockAddressPointOfLpRepository } from "./repositories";
import { HoldLpPointService } from "./points/holdLpPoint.service";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [config] }),
    PrometheusModule.register(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => {
        return {
          ...typeOrmModuleOptions,
          autoLoadEntities: true,
          retryDelay: 3000, // to cover 3 minute DB failover window
          retryAttempts: 70, // try to reconnect for 3.5 minutes,
        };
      },
    }),
    TypeOrmModule.forFeature([
      Batch,
      Block,
      Transaction,
      AddressTransaction,
      TransactionReceipt,
      Log,
      Token,
      Address,
      AddressTransfer,
      Transfer,
      Balance,
      Point,
      PointsHistory,
      BlockTokenPrice,
      BlockAddressPoint,
      BlockGroupTvl,
      AddressTvl,
      AddressTokenTvl,
      AddressFirstDeposit,
      GroupTvl,
      PointsOfLp,
      BlockAddressPointOfLp,
      BalanceOfLp,
    ]),
    TypeOrmModule.forRootAsync({
      name: "refer",
      imports: [ConfigModule],
      useFactory: () => {
        return {
          ...typeOrmReferModuleOptions,
          autoLoadEntities: true,
          retryDelay: 3000, // to cover 3 minute DB failover window
          retryAttempts: 70, // try to reconnect for 3.5 minutes,
        };
      },
    }),
    TypeOrmModule.forFeature([Invite, Referral], "refer"),
    EventEmitterModule.forRoot(),
    MetricsModule,
    UnitOfWorkModule,
    HealthModule,
    HttpModule,
  ],
  providers: [
    AppService,
    TokenService,
    {
      provide: TokenOffChainDataProvider,
      useFactory: (configService: ConfigService, httpService: HttpService) => {
        const selectedProvider = configService.get<string>("tokens.selectedTokenOffChainDataProvider");
        switch (selectedProvider) {
          case "portalsFi":
            return new PortalsFiTokenOffChainDataProvider(httpService);
          default:
            return new CoingeckoTokenOffChainDataProvider(configService, httpService);
        }
      },
      inject: [ConfigService, HttpService],
    },
    TokenOffChainDataSaverService,
    BatchRepository,
    BlockRepository,
    TokenRepository,
    TransferRepository,
    BalanceRepository,
    LogRepository,
    PointsRepository,
    PointsHistoryRepository,
    Logger,
    RetryDelayProvider,
    DbMetricsService,
    DepositPointService,
    BlockTokenPriceRepository,
    BlockAddressPointRepository,
    InviteRepository,
    ReferrerRepository,
    GroupTvlRepository,
    AddressTvlRepository,
    AddressFirstDepositRepository,
    BalanceOfLpRepository,
    PointsOfLpRepository,
    BlockAddressPointOfLpRepository,
    AdapterService,
    HoldLpPointService,
  ],
})
export class AppModule {}