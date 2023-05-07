'use strict';
import { Config } from '@Common';
import { DbBaseMixin, dbSeed } from '@Mixins';
import { existsSync } from 'node:fs';

export default class DBMixinFactory {
	private serviceName: string;
	constructor(serviceName: string) {
		this.serviceName = serviceName;
	}

	createMixin() {
		const model = existsSync(`models/${this.serviceName.toLowerCase()}.model.ts`)
			? require('../models')[`${this.serviceName.toLowerCase()}MongoModel`]
			: require(`../apps/${
					this.serviceName.toLowerCase().charAt(0).toUpperCase() +
					this.serviceName.toLowerCase().slice(1)
			  }/models`)[`${this.serviceName.toLowerCase()}MongoModel`];
		const entity = existsSync(`entities/${this.serviceName.toLowerCase()}.entity.ts`)
			? require('../entities')[
					`${
						this.serviceName.toLowerCase().charAt(0).toUpperCase() +
						this.serviceName.toLowerCase().slice(1)
					}Entity`
			  ]
			: require(`../apps/${
					this.serviceName.toLowerCase().charAt(0).toUpperCase() +
					this.serviceName.toLowerCase().slice(1)
			  }/entities`)[
					`${
						this.serviceName.toLowerCase().charAt(0).toUpperCase() +
						this.serviceName.toLowerCase().slice(1)
					}Entity`
			  ];
		const dbInfo = Config[`DB_${this.serviceName.toUpperCase()}`];
		console.log('dbInfo', dbInfo);
		const dbBaseMixin = new DbBaseMixin({
			dbInfo,
			name: `db${this.serviceName}Mixin`,
			collection: dbInfo.collection,
			model: model(dbInfo.collection),
		});
		return [
			dbBaseMixin.getMixin(dbSeed(dbInfo, entity)),
			dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]),
		];
	}
}
