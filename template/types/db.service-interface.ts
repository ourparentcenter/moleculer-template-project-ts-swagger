/* eslint-disable no-shadow */
import moleculer, { Context } from 'moleculer';
import {
	DbAdapter,
	QueryOptions,
	DbContextSanitizedParams,
	DbContextParameters,
	FilterOptions,
	CountOptions,
} from 'moleculer-db';

export const listActionConfig = {
	cache: {
		keys: ['populate', 'fields', 'page', 'pageSize', 'sort', 'search', 'searchFields', 'query'],
	},
	params: {
		populate: [
			{ type: 'string', optional: true },
			{ type: 'array', optional: true, items: 'string' },
		],
		fields: [
			{ type: 'string', optional: true },
			{ type: 'array', optional: true, items: 'string' },
		],
		page: { type: 'number', integer: true, min: 1, optional: true, convert: true },
		pageSize: { type: 'number', integer: true, min: 0, optional: true, convert: true },
		sort: [
			{ type: 'string', optional: true },
			{ type: 'array', optional: true, items: 'string' },
		],
		search: { type: 'string', optional: true },
		searchFields: [
			{ type: 'string', optional: true },
			{ type: 'array', optional: true, items: 'string' },
		],
		query: [
			{ type: 'object', optional: true },
			{ type: 'string', optional: true },
		],
	},
};

export const getActionConfig = {
	cache: {
		keys: ['id', 'populate', 'fields', 'mapping'],
	},
	params: {
		id: [{ type: 'string' }, { type: 'number' }, { type: 'array' }],
		populate: [
			{ type: 'string', optional: true },
			{ type: 'array', optional: true, items: 'string' },
		],
		fields: [
			{ type: 'string', optional: true },
			{ type: 'array', optional: true, items: 'string' },
		],
		mapping: { type: 'boolean', optional: true },
	},
};

export interface DBPagination<T> {
	rows: T[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

export class MoleculerDBService<T, R> extends moleculer.Service<T> {
	public metadata!: {
		$category: string;
		$official: boolean;
		$name: string;
		$version: string;
		$repo?: string;
	};
	public adapter!: DbAdapter;

	public connect!: () => Promise<void>;

	/**
	 * Disconnect from database.
	 */
	public disconnect!: () => Promise<void>;

	/**
	 * Sanitize context parameters at `find` action.
	 *
	 * @param {Context} ctx
	 * @param {any} origParams
	 * @returns {Promise}
	 */
	public sanitizeParams!: (
		ctx: Context,
		params?: DbContextParameters & {
			query?: QueryOptions | any;
		},
	) => Promise<any>;
	// public sanitizeParams!: (ctx: Context, params?: DbContextParameters) => Promise<any>;

	/**
	 * Get entity(ies) by ID(s).
	 *
	 * @methods
	 * @param {String|Number|Array} id - ID or IDs.
	 * @param {Boolean} decoding - Need to decode IDs.
	 * @returns {Object|Array<Object>} Found entity(ies).
	 */
	public getById!: (id: string | number | string[], decoding?: boolean) => Promise<R>;
	// public getById!: (id: string | number | string[], decoding?: boolean) => Promise<R>;

	/**
	 * Clear the cache & call entity lifecycle events
	 *
	 * @param {String} type
	 * @param {Object|Array|Number} json
	 * @param {Context} ctx
	 * @returns {Promise}
	 */
	public entityChanged!: (type: string, json: number | any[] | any, ctx: Context) => Promise<R>;

	/**
	 * Clear cached entities
	 *
	 * @methods
	 * @returns {Promise}
	 */
	public clearCache!: () => Promise<void>;

	/**
	 * Transform the fetched documents
	 *
	 * @param {Array|Object}  docs
	 * @param {Object}      Params
	 * @returns {Array|Object}
	 */
	public transformDocuments!: (
		ctx: Context,
		params: any,
		docs: any[] | object,
	) => Promise<R | R[]>;
	// public transformDocuments!: (ctx: Context, params: any, docs: any) => Promise<R | R[]>;

	/**
	 * Filter fields in the entity object
	 *
	 * @param {Object}  doc
	 * @param {Array}  fields  Filter properties of model.
	 * @returns  {Object}
	 */
	public filterFields!: (doc: any, fields: Partial<R>[]) => Partial<R>[];

	/**
	 * Authorize the required field list. Remove fields which is not exist in the `this.settings.fields`
	 *
	 * @param {Array} fields
	 * @returns {Array}
	 */
	public authorizeFields!: (fields: Partial<R>[]) => Partial<R>[];

	/**
	 * Populate documents.
	 *
	 * @param {Context}    ctx
	 * @param {Array|Object}  docs
	 * @param {Array}      populateFields
	 * @returns  {Promise}
	 */
	public populateDocs!: <R>(ctx: Context, docs: any, populateFields: any[]) => Promise<R>;

	/**
	 * Validate an entity by validator.
	 *
	 * @param {T} entity
	 * @returns {Promise}
	 */
	public validateEntity!: <T, R>(entity: T) => Promise<R>;

	/**
	 * Encode ID of entity.
	 *
	 * @methods
	 * @param {any} id
	 * @returns {R}
	 */
	public encodeID!: <R>(id: any) => R;

	/**
	 * Decode ID of entity.
	 *
	 * @methods
	 * @param {R} id
	 * @returns {R}
	 */
	public decodeID!: <R>(id: any) => R;

	/**
	 * Service started lifecycle event handler
	 */
	started!: () => Promise<void>;

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped!: () => Promise<void>;

	/**
	 * Service created lifecycle event handler
	 */
	created!: () => Promise<void>;

	/**
	 * Find entities by query.
	 *
	 * @methods
	 *
	 * @param {Context} ctx - Context instance.
	 * @param {Object?} params - Parameters.
	 *
	 * @returns {Array<Object>} List of found entities.
	 */
	public _find!: (ctx: Context, params?: FilterOptions) => Promise<R[]>;

	/**
	 * Get count of entities by query.
	 *
	 * @methods
	 *
	 * @param {Context} ctx - Context instance.
	 * @param {Object?} params - Parameters.
	 *
	 * @returns {Number} Count of found entities.
	 */
	public _count!: (ctx: Context, params: CountOptions) => Promise<number>;

	/**
	 * List entities by filters and pagination results.
	 *
	 * @methods
	 *
	 * @param {Context} ctx - Context instance.
	 * @param {Object?} params - Parameters.
	 *
	 * @returns {Object} List of found entities and count.
	 */
	public _list!: (ctx: Context, params: DbContextSanitizedParams) => Promise<DBPagination<R>>;

	/**
	 * Create a new entity.
	 *
	 * @methods
	 *
	 * @param {Context} ctx - Context instance.
	 * @param {Object?} params - Parameters.
	 *
	 * @returns {Object} Saved entity.
	 */
	public _create!: (ctx: Context, params: any) => Promise<R>;

	/**
	 * Create many new entities.
	 *
	 * @methods
	 *
	 * @param {Context} ctx - Context instance.
	 * @param {Object?} params - Parameters.
	 *
	 * @returns {Object|Array.<Object>} Saved entity(ies).
	 */
	public _insert!: (ctx: Context, params: object | object[]) => Promise<R | R[]>;

	/**
	 * Get entity by ID.
	 *
	 * @methods
	 *
	 * @param {Context} ctx - Context instance.
	 * @param {Object?} params - Parameters.
	 *
	 * @returns {Object|Array<Object>} Found entity(ies).
	 *
	 * @throws {EntityNotFoundError} - 404 Entity not found
	 */
	public _get!: (
		ctx: Context,
		params: { id: any | any[]; mapping?: boolean } & Partial<
			Pick<DbContextParameters, 'populate' | 'fields'>
		>,
	) => Promise<R | R[]>;
	// public _get!: (ctx: Context, params: any) => Promise<R | R[]>;

	/**
	 * Update an entity by ID.
	 * > After update, clear the cache & call lifecycle events.
	 *
	 * @methods
	 *
	 * @param {Context} ctx - Context instance.
	 * @param {Object?} params - Parameters.
	 * @returns {Object} Updated entity.
	 *
	 * @throws {EntityNotFoundError} - 404 Entity not found
	 */
	public _update!: (ctx: Context, params: object) => Promise<R>;

	/**
	 * Remove an entity by ID.
	 *
	 * @methods
	 *
	 * @param {Context} ctx - Context instance.
	 * @param {Object?} params - Parameters.
	 *
	 * @throws {EntityNotFoundError} - 404 Entity not found
	 */
	public _remove!: (ctx: Context, params: { id: any }) => Promise<R>;
}
