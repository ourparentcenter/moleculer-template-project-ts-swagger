import { Options } from '@ourparentcenter/moleculer-decorators-extended';
import { DbContextParameters, DbServiceSettings } from 'moleculer-db';
import { IProduct } from '../entities';

export interface ProductServiceSettingsOptions extends DbServiceSettings {
	// rest?: '/v1/products';
	rest?: string;
	fields: (keyof Required<IProduct>)[];
}

export interface ProductsServiceOptions extends Options {
	name: 'products';
	settings: ProductServiceSettingsOptions;
}

export interface ProductsManipulateValueParams {
	id: string;
	value: number;
}

export interface ProductsRecordParams {
	name: string;
	price: number;
}

export interface IProductBase {
	name?: string;
	quantity?: number;
	price?: number;
	active?: boolean;
}

export interface ProductCreateParams extends IProductBase {
	name?: string;
	quantity?: number;
	price?: number;
	active?: boolean;
}

export interface ProductUpdateParams extends Partial<IProduct> {
	id: string;
	name?: string;
	quantity?: number;
	price?: number;
	active?: boolean;
}
export enum ProductEvent {
	CREATED = 'product.created',
	DELETED = 'product.deleted',
	UPDATED = 'product.updated',
}

export interface ProductDeleteParams extends DbContextParameters {
	id: string;
}

export interface ProductGetParams extends DbContextParameters {
	id: string;
}
