"use strict";

import { Errors, ServiceBroker} from "moleculer";
import TestService from "../../../services/greeterService/greeter.service";

describe("Test 'greeter' service", () => {
	const broker = new ServiceBroker({ logger: false });
	broker.createService(TestService);

	beforeAll(() => broker.start());
	afterAll(() => broker.stop());

	describe("Test 'v1.greeter.hello' action", () => {

		it("should return with 'Hello Moleculer'", async () => {
			const res = await broker.call("v1.greeter.hello");
			expect(res).toBe("Hello Moleculer");
		});

	});

	describe("Test 'v1.greeter.welcome' action", () => {

		it("should return with 'Welcome'", async () => {
			const res = await broker.call("v1.greeter.welcome", { name: "Adam" });
			expect(res).toBe("Welcome, Adam");
		});

		it("should reject an ValidationError", async () => {
			expect.assertions(1);
			try {
				await broker.call("v1.greeter.welcome");
			} catch (err) {
				expect(err).toBeInstanceOf(Errors.ValidationError);
			}
		});

	});

});
