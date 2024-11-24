import type { User } from "@prisma/client";
import type { Notification } from "@prisma/client";
import type { Feed } from "@prisma/client";
import type { DataSource } from "@prisma/client";
import type { FeedLog } from "@prisma/client";
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
    body?: string;
    createdAt?: Date;
    updatedAt?: Date;
    user: NotificationuserFactory | Prisma.UserCreateNestedOneWithoutNotificationsInput;
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
type FeeduserFactory = {
    _factoryFor: "User";
    build: () => PromiseLike<Prisma.UserCreateNestedOneWithoutFeedInput["create"]>;
};
type FeeddataSourceFactory = {
    _factoryFor: "DataSource";
    build: () => PromiseLike<Prisma.DataSourceCreateNestedOneWithoutFeedInput["create"]>;
};
type FeedFactoryDefineInput = {
    id?: string;
    name?: string;
    cycle?: number;
    createdAt?: Date;
    updatedAt?: Date;
    user: FeeduserFactory | Prisma.UserCreateNestedOneWithoutFeedInput;
    dataSource: FeeddataSourceFactory | Prisma.DataSourceCreateNestedOneWithoutFeedInput;
    feedLogs?: Prisma.FeedLogCreateNestedManyWithoutFeedInput;
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
    date?: Date;
    title?: string;
    summary?: string;
    body?: string | null;
    url?: string;
    createdAt?: Date;
    updatedAt?: Date;
    feed: FeedLogfeedFactory | Prisma.FeedCreateNestedOneWithoutFeedLogsInput;
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
