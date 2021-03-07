'use strict';
import { productMongoModel } from '../../models';
import { Config } from '../../common';
import { ProductEntity } from '../../entities';
import { DbBaseMixin } from './db-base.mixin';
import { dbSeed } from './helpers.mixin';

const dbInfo = Config.DB_PRODUCT;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbProductMixin',
	collection: dbInfo.collection,
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	model: productMongoModel(dbInfo.collection),
});

export const dbProductMixin = dbBaseMixin.getMixin(dbSeed(dbInfo, ProductEntity));
export const eventsProductMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
