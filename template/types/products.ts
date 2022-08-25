import { Options } from '@ourparentcenter/moleculer-decorators-extended';
import { DbServiceSettings } from 'moleculer-db';
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
