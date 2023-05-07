import {
	Method,
	ServiceStarted,
	ServiceStopped,
} from '@ourparentcenter/moleculer-decorators-extended';
import { removeForbiddenFields, updateAuthor } from '@ServiceHelpers';
import { ServiceBroker, ServiceSchema, ServiceSettingSchema } from 'moleculer';
import { MoleculerDBService, UserJWT } from '../types';

// create new service factory, inheriting from moleculer native Service
export class BaseServiceWithDB<ServiceSettingsOptions, Entity> extends MoleculerDBService<
	ServiceSettingsOptions,
	Entity
> {
	constructor(broker: ServiceBroker, schema: ServiceSchema<ServiceSettingsOptions>) {
		super(broker, schema);
	}

	@Method
	public updateAuthor<T extends Record<string, any>>(
		record: T,
		mod: { creator?: UserJWT; modifier?: UserJWT },
	) {
		return updateAuthor<T>(record, mod);
	}

	@Method
	public removeForbiddenFields<T extends Record<string, any>>(record: T, fields: string[] = []) {
		return removeForbiddenFields<T>(record, fields);
	}

	@ServiceStarted()
	serviceStarted() {
		this.logger.debug(
			`♻ ${this.fullName.toUpperCase()} service started, ready for connections`,
		);
	}

	@ServiceStopped()
	serviceStopped() {
		this.logger.debug(
			`♻ ${this.fullName.toUpperCase()} service stopped, connections terminated`,
		);
	}
}
