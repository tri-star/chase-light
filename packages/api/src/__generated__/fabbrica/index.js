import { createInitializer, createScreener, getScalarFieldValueGenerator, normalizeResolver, normalizeList, getSequenceCounter, createCallbackChain, destructure } from "@quramy/prisma-fabbrica/lib/internal";
export { resetSequence, registerScalarFieldValueGenerator, resetScalarFieldValueGenerator } from "@quramy/prisma-fabbrica/lib/internal";
const initializer = createInitializer();
const { getClient } = initializer;
export const { initialize } = initializer;
const modelFieldDefinitions = [{
        name: "User",
        fields: [{
                name: "notifications",
                type: "Notification",
                relationName: "NotificationToUser"
            }, {
                name: "Feed",
                type: "Feed",
                relationName: "FeedToUser"
            }]
    }, {
        name: "Notification",
        fields: [{
                name: "user",
                type: "User",
                relationName: "NotificationToUser"
            }]
    }, {
        name: "Feed",
        fields: [{
                name: "user",
                type: "User",
                relationName: "FeedToUser"
            }, {
                name: "dataSource",
                type: "DataSource",
                relationName: "DataSourceToFeed"
            }, {
                name: "feedLogs",
                type: "FeedLog",
                relationName: "FeedToFeedLog"
            }, {
                name: "feedGitHubMeta",
                type: "FeedGitHubMeta",
                relationName: "FeedToFeedGitHubMeta"
            }]
    }, {
        name: "FeedGitHubMeta",
        fields: [{
                name: "feed",
                type: "Feed",
                relationName: "FeedToFeedGitHubMeta"
            }]
    }, {
        name: "DataSource",
        fields: [{
                name: "Feed",
                type: "Feed",
                relationName: "DataSourceToFeed"
            }]
    }, {
        name: "FeedLog",
        fields: [{
                name: "feed",
                type: "Feed",
                relationName: "FeedToFeedLog"
            }, {
                name: "feedLogItems",
                type: "FeedLogItem",
                relationName: "FeedLogToFeedLogItem"
            }]
    }, {
        name: "FeedLogItem",
        fields: [{
                name: "feedLog",
                type: "FeedLog",
                relationName: "FeedLogToFeedLogItem"
            }]
    }];
function autoGenerateUserScalarsOrEnums({ seq }) {
    return {
        id: getScalarFieldValueGenerator().String({ modelName: "User", fieldName: "id", isId: true, isUnique: false, seq }),
        displayName: getScalarFieldValueGenerator().String({ modelName: "User", fieldName: "displayName", isId: false, isUnique: false, seq }),
        accountName: getScalarFieldValueGenerator().String({ modelName: "User", fieldName: "accountName", isId: false, isUnique: true, seq }),
        email: getScalarFieldValueGenerator().String({ modelName: "User", fieldName: "email", isId: false, isUnique: true, seq })
    };
}
function defineUserFactoryInternal({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }, defaultTransientFieldValues) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("User", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateUserScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver ?? {});
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {};
            const data = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args) => Promise.all(normalizeList(...args).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = async (inputData = {}) => {
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            const data = await build(inputData).then(screen);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient().user.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args) => Promise.all(normalizeList(...args).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "User",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}
/**
 * Define factory for {@link User} model.
 *
 * @param options
 * @returns factory {@link UserFactoryInterface}
 */
export const defineUserFactory = ((options) => {
    return defineUserFactoryInternal(options ?? {}, {});
});
defineUserFactory.withTransientFields = defaultTransientFieldValues => options => defineUserFactoryInternal(options ?? {}, defaultTransientFieldValues);
function isNotificationuserFactory(x) {
    return x?._factoryFor === "User";
}
function autoGenerateNotificationScalarsOrEnums({ seq }) {
    return {
        id: getScalarFieldValueGenerator().String({ modelName: "Notification", fieldName: "id", isId: true, isUnique: false, seq }),
        title: getScalarFieldValueGenerator().String({ modelName: "Notification", fieldName: "title", isId: false, isUnique: false, seq }),
        body: getScalarFieldValueGenerator().String({ modelName: "Notification", fieldName: "body", isId: false, isUnique: false, seq })
    };
}
function defineNotificationFactoryInternal({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }, defaultTransientFieldValues) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Notification", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateNotificationScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                user: isNotificationuserFactory(defaultData.user) ? {
                    create: await defaultData.user.build()
                } : defaultData.user
            };
            const data = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args) => Promise.all(normalizeList(...args).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = async (inputData = {}) => {
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            const data = await build(inputData).then(screen);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient().notification.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args) => Promise.all(normalizeList(...args).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Notification",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}
/**
 * Define factory for {@link Notification} model.
 *
 * @param options
 * @returns factory {@link NotificationFactoryInterface}
 */
export const defineNotificationFactory = ((options) => {
    return defineNotificationFactoryInternal(options, {});
});
defineNotificationFactory.withTransientFields = defaultTransientFieldValues => options => defineNotificationFactoryInternal(options, defaultTransientFieldValues);
function isFeeduserFactory(x) {
    return x?._factoryFor === "User";
}
function isFeeddataSourceFactory(x) {
    return x?._factoryFor === "DataSource";
}
function isFeedfeedGitHubMetaFactory(x) {
    return x?._factoryFor === "FeedGitHubMeta";
}
function autoGenerateFeedScalarsOrEnums({ seq }) {
    return {
        id: getScalarFieldValueGenerator().String({ modelName: "Feed", fieldName: "id", isId: true, isUnique: false, seq }),
        name: getScalarFieldValueGenerator().String({ modelName: "Feed", fieldName: "name", isId: false, isUnique: false, seq })
    };
}
function defineFeedFactoryInternal({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }, defaultTransientFieldValues) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Feed", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateFeedScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                user: isFeeduserFactory(defaultData.user) ? {
                    create: await defaultData.user.build()
                } : defaultData.user,
                dataSource: isFeeddataSourceFactory(defaultData.dataSource) ? {
                    create: await defaultData.dataSource.build()
                } : defaultData.dataSource,
                feedGitHubMeta: isFeedfeedGitHubMetaFactory(defaultData.feedGitHubMeta) ? {
                    create: await defaultData.feedGitHubMeta.build()
                } : defaultData.feedGitHubMeta
            };
            const data = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args) => Promise.all(normalizeList(...args).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = async (inputData = {}) => {
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            const data = await build(inputData).then(screen);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient().feed.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args) => Promise.all(normalizeList(...args).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Feed",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}
/**
 * Define factory for {@link Feed} model.
 *
 * @param options
 * @returns factory {@link FeedFactoryInterface}
 */
export const defineFeedFactory = ((options) => {
    return defineFeedFactoryInternal(options, {});
});
defineFeedFactory.withTransientFields = defaultTransientFieldValues => options => defineFeedFactoryInternal(options, defaultTransientFieldValues);
function isFeedGitHubMetafeedFactory(x) {
    return x?._factoryFor === "Feed";
}
function autoGenerateFeedGitHubMetaScalarsOrEnums({ seq }) {
    return {
        id: getScalarFieldValueGenerator().String({ modelName: "FeedGitHubMeta", fieldName: "id", isId: true, isUnique: false, seq })
    };
}
function defineFeedGitHubMetaFactoryInternal({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }, defaultTransientFieldValues) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("FeedGitHubMeta", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateFeedGitHubMetaScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                feed: isFeedGitHubMetafeedFactory(defaultData.feed) ? {
                    create: await defaultData.feed.build()
                } : defaultData.feed
            };
            const data = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args) => Promise.all(normalizeList(...args).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = async (inputData = {}) => {
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            const data = await build(inputData).then(screen);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient().feedGitHubMeta.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args) => Promise.all(normalizeList(...args).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "FeedGitHubMeta",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}
/**
 * Define factory for {@link FeedGitHubMeta} model.
 *
 * @param options
 * @returns factory {@link FeedGitHubMetaFactoryInterface}
 */
export const defineFeedGitHubMetaFactory = ((options) => {
    return defineFeedGitHubMetaFactoryInternal(options, {});
});
defineFeedGitHubMetaFactory.withTransientFields = defaultTransientFieldValues => options => defineFeedGitHubMetaFactoryInternal(options, defaultTransientFieldValues);
function autoGenerateDataSourceScalarsOrEnums({ seq }) {
    return {
        id: getScalarFieldValueGenerator().String({ modelName: "DataSource", fieldName: "id", isId: true, isUnique: false, seq }),
        name: getScalarFieldValueGenerator().String({ modelName: "DataSource", fieldName: "name", isId: false, isUnique: false, seq }),
        url: getScalarFieldValueGenerator().String({ modelName: "DataSource", fieldName: "url", isId: false, isUnique: false, seq })
    };
}
function defineDataSourceFactoryInternal({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }, defaultTransientFieldValues) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("DataSource", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateDataSourceScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver ?? {});
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {};
            const data = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args) => Promise.all(normalizeList(...args).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = async (inputData = {}) => {
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            const data = await build(inputData).then(screen);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient().dataSource.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args) => Promise.all(normalizeList(...args).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "DataSource",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}
/**
 * Define factory for {@link DataSource} model.
 *
 * @param options
 * @returns factory {@link DataSourceFactoryInterface}
 */
export const defineDataSourceFactory = ((options) => {
    return defineDataSourceFactoryInternal(options ?? {}, {});
});
defineDataSourceFactory.withTransientFields = defaultTransientFieldValues => options => defineDataSourceFactoryInternal(options ?? {}, defaultTransientFieldValues);
function isFeedLogfeedFactory(x) {
    return x?._factoryFor === "Feed";
}
function autoGenerateFeedLogScalarsOrEnums({ seq }) {
    return {
        id: getScalarFieldValueGenerator().String({ modelName: "FeedLog", fieldName: "id", isId: true, isUnique: false, seq }),
        key: getScalarFieldValueGenerator().String({ modelName: "FeedLog", fieldName: "key", isId: false, isUnique: false, seq }),
        date: getScalarFieldValueGenerator().DateTime({ modelName: "FeedLog", fieldName: "date", isId: false, isUnique: false, seq }),
        title: getScalarFieldValueGenerator().String({ modelName: "FeedLog", fieldName: "title", isId: false, isUnique: false, seq }),
        summary: getScalarFieldValueGenerator().String({ modelName: "FeedLog", fieldName: "summary", isId: false, isUnique: false, seq }),
        url: getScalarFieldValueGenerator().String({ modelName: "FeedLog", fieldName: "url", isId: false, isUnique: false, seq })
    };
}
function defineFeedLogFactoryInternal({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }, defaultTransientFieldValues) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("FeedLog", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateFeedLogScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                feed: isFeedLogfeedFactory(defaultData.feed) ? {
                    create: await defaultData.feed.build()
                } : defaultData.feed
            };
            const data = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args) => Promise.all(normalizeList(...args).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = async (inputData = {}) => {
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            const data = await build(inputData).then(screen);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient().feedLog.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args) => Promise.all(normalizeList(...args).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "FeedLog",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}
/**
 * Define factory for {@link FeedLog} model.
 *
 * @param options
 * @returns factory {@link FeedLogFactoryInterface}
 */
export const defineFeedLogFactory = ((options) => {
    return defineFeedLogFactoryInternal(options, {});
});
defineFeedLogFactory.withTransientFields = defaultTransientFieldValues => options => defineFeedLogFactoryInternal(options, defaultTransientFieldValues);
function isFeedLogItemfeedLogFactory(x) {
    return x?._factoryFor === "FeedLog";
}
function autoGenerateFeedLogItemScalarsOrEnums({ seq }) {
    return {
        id: getScalarFieldValueGenerator().String({ modelName: "FeedLogItem", fieldName: "id", isId: true, isUnique: false, seq }),
        title: getScalarFieldValueGenerator().String({ modelName: "FeedLogItem", fieldName: "title", isId: false, isUnique: false, seq }),
        summary: getScalarFieldValueGenerator().String({ modelName: "FeedLogItem", fieldName: "summary", isId: false, isUnique: false, seq }),
        url: getScalarFieldValueGenerator().String({ modelName: "FeedLogItem", fieldName: "url", isId: false, isUnique: false, seq })
    };
}
function defineFeedLogItemFactoryInternal({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }, defaultTransientFieldValues) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("FeedLogItem", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateFeedLogItemScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                feedLog: isFeedLogItemfeedLogFactory(defaultData.feedLog) ? {
                    create: await defaultData.feedLog.build()
                } : defaultData.feedLog
            };
            const data = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args) => Promise.all(normalizeList(...args).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = async (inputData = {}) => {
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            const data = await build(inputData).then(screen);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient().feedLogItem.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args) => Promise.all(normalizeList(...args).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "FeedLogItem",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}
/**
 * Define factory for {@link FeedLogItem} model.
 *
 * @param options
 * @returns factory {@link FeedLogItemFactoryInterface}
 */
export const defineFeedLogItemFactory = ((options) => {
    return defineFeedLogItemFactoryInternal(options, {});
});
defineFeedLogItemFactory.withTransientFields = defaultTransientFieldValues => options => defineFeedLogItemFactoryInternal(options, defaultTransientFieldValues);
