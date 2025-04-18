import type { User } from "@prisma/client";
import type { Notification } from "@prisma/client";
import type { NotificationItem } from "@prisma/client";
import type { Feed } from "@prisma/client";
import type { FeedGitHubMeta } from "@prisma/client";
import type { DataSource } from "@prisma/client";
import type { FeedLog } from "@prisma/client";
import type { FeedLogItem } from "@prisma/client";
import type { SystemSetting } from "@prisma/client";
import type { FeedLogStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import type { Resolver } from "@quramy/prisma-fabbrica/lib/internal";
export { resetSequence, registerScalarFieldValueGenerator, resetScalarFieldValueGenerator } from "@quramy/prisma-fabbrica/lib/internal";
type BuildDataOptions<TTransients extends Record<string, unknown>> = {
    readonly seq: number;
} & TTransients;
type TraitName = string | symbol;
type CallbackDefineOptions<TCreated, TCreateInput, TTransients extends Record<string, unknown>> = {
    onAfterBuild?: (createInput: TCreateInput, transientFields: TTransients) => void | PromiseLike<void>;
    onBeforeCreate?: (createInput: TCreateInput, transientFields: TTransients) => void | PromiseLike<void>;
    onAfterCreate?: (created: TCreated, transientFields: TTransients) => void | PromiseLike<void>;
};
export declare const initialize: (options: import("@quramy/prisma-fabbrica/lib/initialize").InitializeOptions) => void;
type UserFactoryDefineInput = {
    id?: string;
    displayName?: string;
    accountName?: string;
    email?: string;
    emailVerified?: boolean;
    providerId?: string;
    createdAt?: Date;
    updatedAt?: Date;
    notifications?: Prisma.NotificationCreateNestedManyWithoutUserInput;
    Feed?: Prisma.FeedCreateNestedManyWithoutUserInput;
};
type UserTransientFields = Record<string, unknown> & Partial<Record<keyof UserFactoryDefineInput, never>>;
type UserFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<UserFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<User, Prisma.UserCreateInput, TTransients>;
type UserFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<UserFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: UserFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<User, Prisma.UserCreateInput, TTransients>;
type UserTraitKeys<TOptions extends UserFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface UserFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "User";
    build(inputData?: Partial<Prisma.UserCreateInput & TTransients>): PromiseLike<Prisma.UserCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.UserCreateInput & TTransients>): PromiseLike<Prisma.UserCreateInput>;
    buildList(list: readonly Partial<Prisma.UserCreateInput & TTransients>[]): PromiseLike<Prisma.UserCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.UserCreateInput & TTransients>): PromiseLike<Prisma.UserCreateInput[]>;
    pickForConnect(inputData: User): Pick<User, "id">;
    create(inputData?: Partial<Prisma.UserCreateInput & TTransients>): PromiseLike<User>;
    createList(list: readonly Partial<Prisma.UserCreateInput & TTransients>[]): PromiseLike<User[]>;
    createList(count: number, item?: Partial<Prisma.UserCreateInput & TTransients>): PromiseLike<User[]>;
    createForConnect(inputData?: Partial<Prisma.UserCreateInput & TTransients>): PromiseLike<Pick<User, "id">>;
}
export interface UserFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends UserFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): UserFactoryInterfaceWithoutTraits<TTransients>;
}
interface UserFactoryBuilder {
    <TOptions extends UserFactoryDefineOptions>(options?: TOptions): UserFactoryInterface<{}, UserTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends UserTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends UserFactoryDefineOptions<TTransients>>(options?: TOptions) => UserFactoryInterface<TTransients, UserTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link User} model.
 *
 * @param options
 * @returns factory {@link UserFactoryInterface}
 */
export declare const defineUserFactory: UserFactoryBuilder;
type NotificationuserFactory = {
    _factoryFor: "User";
    build: () => PromiseLike<Prisma.UserCreateNestedOneWithoutNotificationsInput["create"]>;
};
type NotificationFactoryDefineInput = {
    id?: string;
    title?: string;
    read?: boolean;
    createdAt?: Date;
    user: NotificationuserFactory | Prisma.UserCreateNestedOneWithoutNotificationsInput;
    notificationItems?: Prisma.NotificationItemCreateNestedManyWithoutNotificationInput;
};
type NotificationTransientFields = Record<string, unknown> & Partial<Record<keyof NotificationFactoryDefineInput, never>>;
type NotificationFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<NotificationFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Notification, Prisma.NotificationCreateInput, TTransients>;
type NotificationFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<NotificationFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: NotificationFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Notification, Prisma.NotificationCreateInput, TTransients>;
type NotificationTraitKeys<TOptions extends NotificationFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface NotificationFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Notification";
    build(inputData?: Partial<Prisma.NotificationCreateInput & TTransients>): PromiseLike<Prisma.NotificationCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.NotificationCreateInput & TTransients>): PromiseLike<Prisma.NotificationCreateInput>;
    buildList(list: readonly Partial<Prisma.NotificationCreateInput & TTransients>[]): PromiseLike<Prisma.NotificationCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.NotificationCreateInput & TTransients>): PromiseLike<Prisma.NotificationCreateInput[]>;
    pickForConnect(inputData: Notification): Pick<Notification, "id">;
    create(inputData?: Partial<Prisma.NotificationCreateInput & TTransients>): PromiseLike<Notification>;
    createList(list: readonly Partial<Prisma.NotificationCreateInput & TTransients>[]): PromiseLike<Notification[]>;
    createList(count: number, item?: Partial<Prisma.NotificationCreateInput & TTransients>): PromiseLike<Notification[]>;
    createForConnect(inputData?: Partial<Prisma.NotificationCreateInput & TTransients>): PromiseLike<Pick<Notification, "id">>;
}
export interface NotificationFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends NotificationFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): NotificationFactoryInterfaceWithoutTraits<TTransients>;
}
interface NotificationFactoryBuilder {
    <TOptions extends NotificationFactoryDefineOptions>(options: TOptions): NotificationFactoryInterface<{}, NotificationTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends NotificationTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends NotificationFactoryDefineOptions<TTransients>>(options: TOptions) => NotificationFactoryInterface<TTransients, NotificationTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link Notification} model.
 *
 * @param options
 * @returns factory {@link NotificationFactoryInterface}
 */
export declare const defineNotificationFactory: NotificationFactoryBuilder;
type NotificationItemNotificationFactory = {
    _factoryFor: "Notification";
    build: () => PromiseLike<Prisma.NotificationCreateNestedOneWithoutNotificationItemsInput["create"]>;
};
type NotificationItemFactoryDefineInput = {
    id?: string;
    feedLogId?: string;
    title?: string;
    Notification?: NotificationItemNotificationFactory | Prisma.NotificationCreateNestedOneWithoutNotificationItemsInput;
};
type NotificationItemTransientFields = Record<string, unknown> & Partial<Record<keyof NotificationItemFactoryDefineInput, never>>;
type NotificationItemFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<NotificationItemFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<NotificationItem, Prisma.NotificationItemCreateInput, TTransients>;
type NotificationItemFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<NotificationItemFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: NotificationItemFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<NotificationItem, Prisma.NotificationItemCreateInput, TTransients>;
type NotificationItemTraitKeys<TOptions extends NotificationItemFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface NotificationItemFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "NotificationItem";
    build(inputData?: Partial<Prisma.NotificationItemCreateInput & TTransients>): PromiseLike<Prisma.NotificationItemCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.NotificationItemCreateInput & TTransients>): PromiseLike<Prisma.NotificationItemCreateInput>;
    buildList(list: readonly Partial<Prisma.NotificationItemCreateInput & TTransients>[]): PromiseLike<Prisma.NotificationItemCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.NotificationItemCreateInput & TTransients>): PromiseLike<Prisma.NotificationItemCreateInput[]>;
    pickForConnect(inputData: NotificationItem): Pick<NotificationItem, "id">;
    create(inputData?: Partial<Prisma.NotificationItemCreateInput & TTransients>): PromiseLike<NotificationItem>;
    createList(list: readonly Partial<Prisma.NotificationItemCreateInput & TTransients>[]): PromiseLike<NotificationItem[]>;
    createList(count: number, item?: Partial<Prisma.NotificationItemCreateInput & TTransients>): PromiseLike<NotificationItem[]>;
    createForConnect(inputData?: Partial<Prisma.NotificationItemCreateInput & TTransients>): PromiseLike<Pick<NotificationItem, "id">>;
}
export interface NotificationItemFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends NotificationItemFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): NotificationItemFactoryInterfaceWithoutTraits<TTransients>;
}
interface NotificationItemFactoryBuilder {
    <TOptions extends NotificationItemFactoryDefineOptions>(options?: TOptions): NotificationItemFactoryInterface<{}, NotificationItemTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends NotificationItemTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends NotificationItemFactoryDefineOptions<TTransients>>(options?: TOptions) => NotificationItemFactoryInterface<TTransients, NotificationItemTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link NotificationItem} model.
 *
 * @param options
 * @returns factory {@link NotificationItemFactoryInterface}
 */
export declare const defineNotificationItemFactory: NotificationItemFactoryBuilder;
type FeeduserFactory = {
    _factoryFor: "User";
    build: () => PromiseLike<Prisma.UserCreateNestedOneWithoutFeedInput["create"]>;
};
type FeeddataSourceFactory = {
    _factoryFor: "DataSource";
    build: () => PromiseLike<Prisma.DataSourceCreateNestedOneWithoutFeedInput["create"]>;
};
type FeedfeedGitHubMetaFactory = {
    _factoryFor: "FeedGitHubMeta";
    build: () => PromiseLike<Prisma.FeedGitHubMetaCreateNestedOneWithoutFeedInput["create"]>;
};
type FeedFactoryDefineInput = {
    id?: string;
    name?: string;
    url?: string;
    cycle?: number;
    createdAt?: Date;
    updatedAt?: Date;
    user: FeeduserFactory | Prisma.UserCreateNestedOneWithoutFeedInput;
    dataSource: FeeddataSourceFactory | Prisma.DataSourceCreateNestedOneWithoutFeedInput;
    feedLogs?: Prisma.FeedLogCreateNestedManyWithoutFeedInput;
    feedGitHubMeta?: FeedfeedGitHubMetaFactory | Prisma.FeedGitHubMetaCreateNestedOneWithoutFeedInput;
};
type FeedTransientFields = Record<string, unknown> & Partial<Record<keyof FeedFactoryDefineInput, never>>;
type FeedFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<FeedFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Feed, Prisma.FeedCreateInput, TTransients>;
type FeedFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<FeedFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: FeedFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Feed, Prisma.FeedCreateInput, TTransients>;
type FeedTraitKeys<TOptions extends FeedFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface FeedFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Feed";
    build(inputData?: Partial<Prisma.FeedCreateInput & TTransients>): PromiseLike<Prisma.FeedCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.FeedCreateInput & TTransients>): PromiseLike<Prisma.FeedCreateInput>;
    buildList(list: readonly Partial<Prisma.FeedCreateInput & TTransients>[]): PromiseLike<Prisma.FeedCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.FeedCreateInput & TTransients>): PromiseLike<Prisma.FeedCreateInput[]>;
    pickForConnect(inputData: Feed): Pick<Feed, "id">;
    create(inputData?: Partial<Prisma.FeedCreateInput & TTransients>): PromiseLike<Feed>;
    createList(list: readonly Partial<Prisma.FeedCreateInput & TTransients>[]): PromiseLike<Feed[]>;
    createList(count: number, item?: Partial<Prisma.FeedCreateInput & TTransients>): PromiseLike<Feed[]>;
    createForConnect(inputData?: Partial<Prisma.FeedCreateInput & TTransients>): PromiseLike<Pick<Feed, "id">>;
}
export interface FeedFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends FeedFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): FeedFactoryInterfaceWithoutTraits<TTransients>;
}
interface FeedFactoryBuilder {
    <TOptions extends FeedFactoryDefineOptions>(options: TOptions): FeedFactoryInterface<{}, FeedTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends FeedTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends FeedFactoryDefineOptions<TTransients>>(options: TOptions) => FeedFactoryInterface<TTransients, FeedTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link Feed} model.
 *
 * @param options
 * @returns factory {@link FeedFactoryInterface}
 */
export declare const defineFeedFactory: FeedFactoryBuilder;
type FeedGitHubMetafeedFactory = {
    _factoryFor: "Feed";
    build: () => PromiseLike<Prisma.FeedCreateNestedOneWithoutFeedGitHubMetaInput["create"]>;
};
type FeedGitHubMetaFactoryDefineInput = {
    id?: string;
    lastReleaseDate?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
    feed: FeedGitHubMetafeedFactory | Prisma.FeedCreateNestedOneWithoutFeedGitHubMetaInput;
};
type FeedGitHubMetaTransientFields = Record<string, unknown> & Partial<Record<keyof FeedGitHubMetaFactoryDefineInput, never>>;
type FeedGitHubMetaFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<FeedGitHubMetaFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<FeedGitHubMeta, Prisma.FeedGitHubMetaCreateInput, TTransients>;
type FeedGitHubMetaFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<FeedGitHubMetaFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: FeedGitHubMetaFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<FeedGitHubMeta, Prisma.FeedGitHubMetaCreateInput, TTransients>;
type FeedGitHubMetaTraitKeys<TOptions extends FeedGitHubMetaFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface FeedGitHubMetaFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "FeedGitHubMeta";
    build(inputData?: Partial<Prisma.FeedGitHubMetaCreateInput & TTransients>): PromiseLike<Prisma.FeedGitHubMetaCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.FeedGitHubMetaCreateInput & TTransients>): PromiseLike<Prisma.FeedGitHubMetaCreateInput>;
    buildList(list: readonly Partial<Prisma.FeedGitHubMetaCreateInput & TTransients>[]): PromiseLike<Prisma.FeedGitHubMetaCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.FeedGitHubMetaCreateInput & TTransients>): PromiseLike<Prisma.FeedGitHubMetaCreateInput[]>;
    pickForConnect(inputData: FeedGitHubMeta): Pick<FeedGitHubMeta, "id">;
    create(inputData?: Partial<Prisma.FeedGitHubMetaCreateInput & TTransients>): PromiseLike<FeedGitHubMeta>;
    createList(list: readonly Partial<Prisma.FeedGitHubMetaCreateInput & TTransients>[]): PromiseLike<FeedGitHubMeta[]>;
    createList(count: number, item?: Partial<Prisma.FeedGitHubMetaCreateInput & TTransients>): PromiseLike<FeedGitHubMeta[]>;
    createForConnect(inputData?: Partial<Prisma.FeedGitHubMetaCreateInput & TTransients>): PromiseLike<Pick<FeedGitHubMeta, "id">>;
}
export interface FeedGitHubMetaFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends FeedGitHubMetaFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): FeedGitHubMetaFactoryInterfaceWithoutTraits<TTransients>;
}
interface FeedGitHubMetaFactoryBuilder {
    <TOptions extends FeedGitHubMetaFactoryDefineOptions>(options: TOptions): FeedGitHubMetaFactoryInterface<{}, FeedGitHubMetaTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends FeedGitHubMetaTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends FeedGitHubMetaFactoryDefineOptions<TTransients>>(options: TOptions) => FeedGitHubMetaFactoryInterface<TTransients, FeedGitHubMetaTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link FeedGitHubMeta} model.
 *
 * @param options
 * @returns factory {@link FeedGitHubMetaFactoryInterface}
 */
export declare const defineFeedGitHubMetaFactory: FeedGitHubMetaFactoryBuilder;
type DataSourceFactoryDefineInput = {
    id?: string;
    name?: string;
    url?: string;
    createdAt?: Date;
    updatedAt?: Date;
    Feed?: Prisma.FeedCreateNestedManyWithoutDataSourceInput;
};
type DataSourceTransientFields = Record<string, unknown> & Partial<Record<keyof DataSourceFactoryDefineInput, never>>;
type DataSourceFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<DataSourceFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<DataSource, Prisma.DataSourceCreateInput, TTransients>;
type DataSourceFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<DataSourceFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: DataSourceFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<DataSource, Prisma.DataSourceCreateInput, TTransients>;
type DataSourceTraitKeys<TOptions extends DataSourceFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface DataSourceFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "DataSource";
    build(inputData?: Partial<Prisma.DataSourceCreateInput & TTransients>): PromiseLike<Prisma.DataSourceCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.DataSourceCreateInput & TTransients>): PromiseLike<Prisma.DataSourceCreateInput>;
    buildList(list: readonly Partial<Prisma.DataSourceCreateInput & TTransients>[]): PromiseLike<Prisma.DataSourceCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.DataSourceCreateInput & TTransients>): PromiseLike<Prisma.DataSourceCreateInput[]>;
    pickForConnect(inputData: DataSource): Pick<DataSource, "id">;
    create(inputData?: Partial<Prisma.DataSourceCreateInput & TTransients>): PromiseLike<DataSource>;
    createList(list: readonly Partial<Prisma.DataSourceCreateInput & TTransients>[]): PromiseLike<DataSource[]>;
    createList(count: number, item?: Partial<Prisma.DataSourceCreateInput & TTransients>): PromiseLike<DataSource[]>;
    createForConnect(inputData?: Partial<Prisma.DataSourceCreateInput & TTransients>): PromiseLike<Pick<DataSource, "id">>;
}
export interface DataSourceFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends DataSourceFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): DataSourceFactoryInterfaceWithoutTraits<TTransients>;
}
interface DataSourceFactoryBuilder {
    <TOptions extends DataSourceFactoryDefineOptions>(options?: TOptions): DataSourceFactoryInterface<{}, DataSourceTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends DataSourceTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends DataSourceFactoryDefineOptions<TTransients>>(options?: TOptions) => DataSourceFactoryInterface<TTransients, DataSourceTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link DataSource} model.
 *
 * @param options
 * @returns factory {@link DataSourceFactoryInterface}
 */
export declare const defineDataSourceFactory: DataSourceFactoryBuilder;
type FeedLogfeedFactory = {
    _factoryFor: "Feed";
    build: () => PromiseLike<Prisma.FeedCreateNestedOneWithoutFeedLogsInput["create"]>;
};
type FeedLogFactoryDefineInput = {
    id?: string;
    key?: string;
    date?: Date;
    title?: string;
    summary?: string;
    body?: string | null;
    url?: string;
    status?: FeedLogStatus;
    createdAt?: Date;
    updatedAt?: Date;
    feed: FeedLogfeedFactory | Prisma.FeedCreateNestedOneWithoutFeedLogsInput;
    feedLogItems?: Prisma.FeedLogItemCreateNestedManyWithoutFeedLogInput;
};
type FeedLogTransientFields = Record<string, unknown> & Partial<Record<keyof FeedLogFactoryDefineInput, never>>;
type FeedLogFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<FeedLogFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<FeedLog, Prisma.FeedLogCreateInput, TTransients>;
type FeedLogFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<FeedLogFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: FeedLogFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<FeedLog, Prisma.FeedLogCreateInput, TTransients>;
type FeedLogTraitKeys<TOptions extends FeedLogFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface FeedLogFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "FeedLog";
    build(inputData?: Partial<Prisma.FeedLogCreateInput & TTransients>): PromiseLike<Prisma.FeedLogCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.FeedLogCreateInput & TTransients>): PromiseLike<Prisma.FeedLogCreateInput>;
    buildList(list: readonly Partial<Prisma.FeedLogCreateInput & TTransients>[]): PromiseLike<Prisma.FeedLogCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.FeedLogCreateInput & TTransients>): PromiseLike<Prisma.FeedLogCreateInput[]>;
    pickForConnect(inputData: FeedLog): Pick<FeedLog, "id">;
    create(inputData?: Partial<Prisma.FeedLogCreateInput & TTransients>): PromiseLike<FeedLog>;
    createList(list: readonly Partial<Prisma.FeedLogCreateInput & TTransients>[]): PromiseLike<FeedLog[]>;
    createList(count: number, item?: Partial<Prisma.FeedLogCreateInput & TTransients>): PromiseLike<FeedLog[]>;
    createForConnect(inputData?: Partial<Prisma.FeedLogCreateInput & TTransients>): PromiseLike<Pick<FeedLog, "id">>;
}
export interface FeedLogFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends FeedLogFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): FeedLogFactoryInterfaceWithoutTraits<TTransients>;
}
interface FeedLogFactoryBuilder {
    <TOptions extends FeedLogFactoryDefineOptions>(options: TOptions): FeedLogFactoryInterface<{}, FeedLogTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends FeedLogTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends FeedLogFactoryDefineOptions<TTransients>>(options: TOptions) => FeedLogFactoryInterface<TTransients, FeedLogTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link FeedLog} model.
 *
 * @param options
 * @returns factory {@link FeedLogFactoryInterface}
 */
export declare const defineFeedLogFactory: FeedLogFactoryBuilder;
type FeedLogItemfeedLogFactory = {
    _factoryFor: "FeedLog";
    build: () => PromiseLike<Prisma.FeedLogCreateNestedOneWithoutFeedLogItemsInput["create"]>;
};
type FeedLogItemFactoryDefineInput = {
    id?: string;
    summary?: string;
    link_url?: string;
    link_title?: string;
    createdAt?: Date;
    feedLog: FeedLogItemfeedLogFactory | Prisma.FeedLogCreateNestedOneWithoutFeedLogItemsInput;
};
type FeedLogItemTransientFields = Record<string, unknown> & Partial<Record<keyof FeedLogItemFactoryDefineInput, never>>;
type FeedLogItemFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<FeedLogItemFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<FeedLogItem, Prisma.FeedLogItemCreateInput, TTransients>;
type FeedLogItemFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<FeedLogItemFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: FeedLogItemFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<FeedLogItem, Prisma.FeedLogItemCreateInput, TTransients>;
type FeedLogItemTraitKeys<TOptions extends FeedLogItemFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface FeedLogItemFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "FeedLogItem";
    build(inputData?: Partial<Prisma.FeedLogItemCreateInput & TTransients>): PromiseLike<Prisma.FeedLogItemCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.FeedLogItemCreateInput & TTransients>): PromiseLike<Prisma.FeedLogItemCreateInput>;
    buildList(list: readonly Partial<Prisma.FeedLogItemCreateInput & TTransients>[]): PromiseLike<Prisma.FeedLogItemCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.FeedLogItemCreateInput & TTransients>): PromiseLike<Prisma.FeedLogItemCreateInput[]>;
    pickForConnect(inputData: FeedLogItem): Pick<FeedLogItem, "id">;
    create(inputData?: Partial<Prisma.FeedLogItemCreateInput & TTransients>): PromiseLike<FeedLogItem>;
    createList(list: readonly Partial<Prisma.FeedLogItemCreateInput & TTransients>[]): PromiseLike<FeedLogItem[]>;
    createList(count: number, item?: Partial<Prisma.FeedLogItemCreateInput & TTransients>): PromiseLike<FeedLogItem[]>;
    createForConnect(inputData?: Partial<Prisma.FeedLogItemCreateInput & TTransients>): PromiseLike<Pick<FeedLogItem, "id">>;
}
export interface FeedLogItemFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends FeedLogItemFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): FeedLogItemFactoryInterfaceWithoutTraits<TTransients>;
}
interface FeedLogItemFactoryBuilder {
    <TOptions extends FeedLogItemFactoryDefineOptions>(options: TOptions): FeedLogItemFactoryInterface<{}, FeedLogItemTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends FeedLogItemTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends FeedLogItemFactoryDefineOptions<TTransients>>(options: TOptions) => FeedLogItemFactoryInterface<TTransients, FeedLogItemTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link FeedLogItem} model.
 *
 * @param options
 * @returns factory {@link FeedLogItemFactoryInterface}
 */
export declare const defineFeedLogItemFactory: FeedLogItemFactoryBuilder;
type SystemSettingFactoryDefineInput = {
    id?: string;
    lastNotificationRunDate?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
};
type SystemSettingTransientFields = Record<string, unknown> & Partial<Record<keyof SystemSettingFactoryDefineInput, never>>;
type SystemSettingFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<SystemSettingFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<SystemSetting, Prisma.SystemSettingCreateInput, TTransients>;
type SystemSettingFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<SystemSettingFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: SystemSettingFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<SystemSetting, Prisma.SystemSettingCreateInput, TTransients>;
type SystemSettingTraitKeys<TOptions extends SystemSettingFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface SystemSettingFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "SystemSetting";
    build(inputData?: Partial<Prisma.SystemSettingCreateInput & TTransients>): PromiseLike<Prisma.SystemSettingCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.SystemSettingCreateInput & TTransients>): PromiseLike<Prisma.SystemSettingCreateInput>;
    buildList(list: readonly Partial<Prisma.SystemSettingCreateInput & TTransients>[]): PromiseLike<Prisma.SystemSettingCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.SystemSettingCreateInput & TTransients>): PromiseLike<Prisma.SystemSettingCreateInput[]>;
    pickForConnect(inputData: SystemSetting): Pick<SystemSetting, "id">;
    create(inputData?: Partial<Prisma.SystemSettingCreateInput & TTransients>): PromiseLike<SystemSetting>;
    createList(list: readonly Partial<Prisma.SystemSettingCreateInput & TTransients>[]): PromiseLike<SystemSetting[]>;
    createList(count: number, item?: Partial<Prisma.SystemSettingCreateInput & TTransients>): PromiseLike<SystemSetting[]>;
    createForConnect(inputData?: Partial<Prisma.SystemSettingCreateInput & TTransients>): PromiseLike<Pick<SystemSetting, "id">>;
}
export interface SystemSettingFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends SystemSettingFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): SystemSettingFactoryInterfaceWithoutTraits<TTransients>;
}
interface SystemSettingFactoryBuilder {
    <TOptions extends SystemSettingFactoryDefineOptions>(options?: TOptions): SystemSettingFactoryInterface<{}, SystemSettingTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends SystemSettingTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends SystemSettingFactoryDefineOptions<TTransients>>(options?: TOptions) => SystemSettingFactoryInterface<TTransients, SystemSettingTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link SystemSetting} model.
 *
 * @param options
 * @returns factory {@link SystemSettingFactoryInterface}
 */
export declare const defineSystemSettingFactory: SystemSettingFactoryBuilder;
