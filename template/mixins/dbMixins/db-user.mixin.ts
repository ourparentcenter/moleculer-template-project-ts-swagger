'use strict';
import { userMongoModel } from '../../models';
import { Config } from '../../common';
import { UserEntity } from '../../entities';
import { DbBaseMixin } from './db-base.mixin';
import { dbSeed } from './helpers.mixin';

const dbInfo = Config.DB_USER;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbUserMixin',
	collection: dbInfo.collection,
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	model: userMongoModel(dbInfo.collection),
});

export const dbUserMixin = dbBaseMixin.getMixin(dbSeed(dbInfo, UserEntity));
export const eventsUserMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
