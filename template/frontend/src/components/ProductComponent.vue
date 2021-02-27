<template>
	<section>
		<fieldset v-for="item in requests" :key="item.id">
			<legend class="shadow-11">
				Action '
				<code>{{ item.action }}</code
				>'
			</legend>
			<div class="content">
				<div class="request">
					<h4>Request:</h4>
					<code>
						{{ item.method || 'GET' }}
						<a target="_blank" :href="item.rest">{{ item.rest }}</a>
					</code>
					<q-btn
						color="secondary"
						icon="send"
						label="Execute"
						class="q-ml-md shadow-11"
						@click="callAction(item)"
					/>
				</div>
				<div v-if="item.fields" class="parameters">
					<h4>Parameters:</h4>
					<div class="field" v-for="field in item.fields" :key="field.field">
						<q-input
							v-if="field.type == 'text'"
							clearable
							clear-icon="close"
							filled
							color="purple-12"
							v-model="fields[field.model]"
							:label="field.label"
							:type="field.type"
						/>
						<q-input
							v-else
							clearable
							clear-icon="close"
							filled
							color="purple-12"
							v-model.number="fields[field.model]"
							:label="field.label"
							:type="field.type"
						/>
						<!-- <input
							:type="field.type"
							:value="getFieldValue(field)"
							@input="setFieldValue(field, $event.target.value)"
						/>-->
					</div>
				</div>
				<div class="response" v-if="item.status">
					<h4>
						Response:
						<q-badge :color="item.status < 400 ? 'green' : 'red'">{{
							item.status
						}}</q-badge>

						<q-badge color="black" class="q-ml-sm">{{
							humanize(item.duration)
						}}</q-badge>
					</h4>
					<pre><code>{{ item.response }}</code></pre>
				</div>
			</div>
		</fieldset>
	</section>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { defineComponent, reactive } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { axios } from 'boot/axios';

let requests = reactive([
	{
		id: 'list',
		action: 'v1.products.list',
		rest: '/api/v1/products/',
		response: null,
		status: null,
		duration: null,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		afterResponse: (response: any) =>
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			!this.fields.productID && (this.fields.productID = response.rows[0]._id),
	},
	{
		id: 'create',
		action: 'v1.products.create',
		rest: '/api/v1/products/',
		method: 'POST',
		fields: [
			{
				field: 'name',
				label: 'Name',
				type: 'text',
				paramType: 'body',
				model: 'productName',
			},
			{
				field: 'price',
				label: 'Price',
				type: 'number',
				paramType: 'body',
				model: 'productPrice',
			},
		],
		response: null,
		status: null,
		duration: null,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		afterResponse: (response: any) =>
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			(this.fields.productID = response._id),
	},
	{
		id: 'get',
		action: 'v1.products.get',
		rest: '/api/v1/products/:id',
		method: 'GET',
		fields: [{ field: 'id', label: 'ID', type: 'text', paramType: 'url', model: 'productID' }],
		response: null,
		status: null,
		duration: null,
	},
	{
		id: 'update',
		action: 'v1.products.update',
		rest: '/api/v1/products/:id',
		method: 'PUT',
		fields: [
			{ field: 'id', label: 'ID', type: 'text', paramType: 'url', model: 'productID' },
			{
				field: 'name',
				label: 'Name',
				type: 'text',
				paramType: 'body',
				model: 'productName',
			},
			{
				field: 'price',
				label: 'Price',
				type: 'number',
				paramType: 'body',
				model: 'productPrice',
			},
		],
		response: null,
		status: null,
		duration: null,
	},
	{
		id: 'increase',
		action: 'v1.products.increaseQuantity',
		rest: '/api/v1/products/:id/quantity/increase',
		method: 'PUT',
		fields: [
			{ field: 'id', label: 'ID', type: 'text', paramType: 'url', model: 'productID' },
			{
				field: 'value',
				label: 'Value',
				type: 'number',
				paramType: 'body',
				model: 'productValue',
			},
		],
		response: null,
		status: null,
		duration: null,
	},
	{
		id: 'decrease',
		action: 'v1.products.decreaseQuantity',
		rest: '/api/v1/products/:id/quantity/decrease',
		method: 'PUT',
		fields: [
			{ field: 'id', label: 'ID', type: 'text', paramType: 'url', model: 'productID' },
			{
				field: 'value',
				label: 'Value',
				type: 'number',
				paramType: 'body',
				model: 'productValue',
			},
		],
		response: null,
		status: null,
		duration: null,
	},
	{
		id: 'delete',
		action: 'v1.products.delete',
		rest: '/api/v1/products/:id',
		method: 'DELETE',
		fields: [{ field: 'id', label: 'ID', type: 'text', paramType: 'url', model: 'productID' }],
		response: null,
		status: null,
		duration: null,
	},
]);

const fields = {
	welcomeName: 'John',
	productID: null,
	productName: 'Xiamoi Mi 9T',
	productPrice: 299,
	productValue: 1,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getFieldValue(field: any) {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	return fields[field.model];
}

// function setFieldValue(field: any, newValue: any) {
// 	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// 	// @ts-ignore
// 	if (field.type == 'number') fields[field.model] = Number(newValue);
// 	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// 	// @ts-ignore
// 	else fields[field.model] = newValue;
// }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function humanize(ms: any) {
	// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
	return ms > 1500 ? `${(ms / 1500).toFixed(2)} s` : `${ms} ms`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function req(url: string, method: string, body?: any) {
	// console.log(body);
	// if (isNotEmptyObject(body)) {
	// 	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// 	// @ts-ignore
	// 	return await this.$axios.post(url, body);
	// }

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	return await axios({
		method: method,
		// baseURL: 'http://localhost:3000',
		url: url,
		// headers: { 'Access-Control-Allow-Origin': '*' },
		// headers: { 'Content-Type': 'application/json' },
		data: body,
	});
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function callAction(item: any) {
	const startTime = Date.now();

	let url = item.rest;
	const method = item.method || 'GET';
	let body = null;
	let params = null;
	if (item.fields) {
		body = {};
		params = {};
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
		item.fields.forEach((field: any) => {
			const value = getFieldValue(field);
			if (field.paramType == 'body') body[field.field] = value;
			else if (field.paramType == 'param') params[field.field] = value;
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/restrict-template-expressions
			else if (field.paramType == 'url') url = url.replace(`:${field.field}`, value);
		});

		if (body && method == 'GET') {
			body = null;
		}
		if (params) {
			url += '?' + new URLSearchParams(params).toString();
		}
	}

	return req(url, method, body)
		.then((res) => {
			item.status = res.status;
			item.duration = Date.now() - startTime;
			return (item.response = res.data);
		})
		.catch((err) => {
			item.status = 'ERR';
			item.duration = Date.now() - startTime;
			item.response = err.message;
			console.log(err);
		});
}

export default defineComponent({
	name: 'CompositionComponent',

	setup() {
		onBeforeRouteLeave(() => {
			requests = reactive([
				{
					id: 'list',
					action: 'v1.products.list',
					rest: '/api/v1/products/',
					response: null,
					status: null,
					duration: null,
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					afterResponse: (response: any) =>
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						!this.fields.productID && (this.fields.productID = response.rows[0]._id),
				},
				{
					id: 'create',
					action: 'v1.products.create',
					rest: '/api/v1/products/',
					method: 'POST',
					fields: [
						{
							field: 'name',
							label: 'Name',
							type: 'text',
							paramType: 'body',
							model: 'productName',
						},
						{
							field: 'price',
							label: 'Price',
							type: 'number',
							paramType: 'body',
							model: 'productPrice',
						},
					],
					response: null,
					status: null,
					duration: null,
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					afterResponse: (response: any) =>
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						(this.fields.productID = response._id),
				},
				{
					id: 'get',
					action: 'v1.products.get',
					rest: '/api/v1/products/:id',
					method: 'GET',
					fields: [
						{
							field: 'id',
							label: 'ID',
							type: 'text',
							paramType: 'url',
							model: 'productID',
						},
					],
					response: null,
					status: null,
					duration: null,
				},
				{
					id: 'update',
					action: 'v1.products.update',
					rest: '/api/v1/products/:id',
					method: 'PUT',
					fields: [
						{
							field: 'id',
							label: 'ID',
							type: 'text',
							paramType: 'url',
							model: 'productID',
						},
						{
							field: 'name',
							label: 'Name',
							type: 'text',
							paramType: 'body',
							model: 'productName',
						},
						{
							field: 'price',
							label: 'Price',
							type: 'number',
							paramType: 'body',
							model: 'productPrice',
						},
					],
					response: null,
					status: null,
					duration: null,
				},
				{
					id: 'increase',
					action: 'v1.products.increaseQuantity',
					rest: '/api/v1/products/:id/quantity/increase',
					method: 'PUT',
					fields: [
						{
							field: 'id',
							label: 'ID',
							type: 'text',
							paramType: 'url',
							model: 'productID',
						},
						{
							field: 'value',
							label: 'Value',
							type: 'number',
							paramType: 'body',
							model: 'productValue',
						},
					],
					response: null,
					status: null,
					duration: null,
				},
				{
					id: 'decrease',
					action: 'v1.products.decreaseQuantity',
					rest: '/api/v1/products/:id/quantity/decrease',
					method: 'PUT',
					fields: [
						{
							field: 'id',
							label: 'ID',
							type: 'text',
							paramType: 'url',
							model: 'productID',
						},
						{
							field: 'value',
							label: 'Value',
							type: 'number',
							paramType: 'body',
							model: 'productValue',
						},
					],
					response: null,
					status: null,
					duration: null,
				},
				{
					id: 'delete',
					action: 'v1.products.delete',
					rest: '/api/v1/products/:id',
					method: 'DELETE',
					fields: [
						{
							field: 'id',
							label: 'ID',
							type: 'text',
							paramType: 'url',
							model: 'productID',
						},
					],
					response: null,
					status: null,
					duration: null,
				},
			]);
		});
		return { requests, callAction, humanize, fields };
	},
});
</script>

<style lang="sass" scoped>
code
	font-family: "Consolas", 'Courier New', Courier, monospace
	color: #555
	font-size: 18px

main section
	min-width: 50%

main fieldset
	border: 1px solid lightgrey
	border-radius: 8px
	box-shadow: 2px 2px 10px rgba(0,0,0,0.4)
	background-color: aliceblue
	margin-bottom: 2em
	min-width: 60%

main fieldset legend
	background-color: #cce7ff
	border: 1px solid lightgrey
	padding: 4px 10px
	border-radius: 8px

main fieldset .content
	padding-left: 2em

main fieldset .request
	margin-bottom: 0.5em

main fieldset .parameters .field
	margin-bottom: 0.25em

main fieldset .parameters .field label
	min-width: 80px
	display: inline-block
	text-align: right
	margin-right: 0.5em

main fieldset .response
	margin-top: 1em

main fieldset .response pre
	margin: 0.5em 0
	font-size: 0.9em

main h4
	font-weight: 600
	margin: 0.25em -1.0em
	font-size: 18px
</style>
