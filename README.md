# Moleculer template: `project-ts-swagger`
<!-- :mortar_board: Moleculer-based microservices project template for typescript with swagger. [Live demo on now.sh](https://moleculer-demo-project-ts.now.sh/) -->

## Features
- Moleculer v0.14 with full-detailed `moleculer.config.ts` file.
- Common mono-repo project with a demo `greeter` service.
- Sample database `products` service (with file-based NeDB in development & MongoDB in production).
- Optional API Gateway service with detailed service settings.
- Simplistic static welcome page made with Quasar v2 to test generated services & watch nodes / services. http://localhost:3000
- Optional Transporter & Cacher.
- Metrics & Tracing.
- Service Guard
- Docker & Docker Compose & Kubernetes files.
- Unit tests with [Jest](http://facebook.github.io/jest/).
- Lint with [ESLint](http://eslint.org/).
- Launch file for debugging in [VSCode](https://code.visualstudio.com/).
<!-- - User auth with JWT authentication sample -->
- Typescript decorators for moleculer [https://github.com/d0whc3r/moleculer-decorators](https://github.com/d0whc3r/moleculer-decorators)
- Configuration for development/production/testing using environment variables
- (**New features**) Optional Swagger embedded with demo api and jsdoc http://localhost:3000/openapi for standard swagger ui and http://localhost:3000/editor for swagger editor. Both accept auth JWT token and auto update swagger.json & swagger.ymal. OpenAPI 3.0.1 schema.
- Optionall Swagger-Stats with dashboaed at http://localhost:3000/api
- Auto generation and regeneration of swagger.json spec, needed for swager-stats
- (**New**) Added jest tests for all services


## Install
This project needs yarn due to an issue with npm resolving dependencies for prom client if using swagger stats.
To install use the [moleculer-cli](https://github.com/moleculerjs/moleculer-cli) tool.

```bash
$ moleculer init ourparentcenter/moleculer-template-project-ts-swagger#main my-project
```
Then be sure to update the .env file with the correct address to your transporter system if using one.
```
e.g.
TRANSPORTER=stan://stan:4222
to
TRANSPORTER=stan://localhost:4222
```

## Prompts
```
$ moleculer init ourparentcenter/moleculer-template-project-ts moleculer-demo

Template repo: ourparentcenter/moleculer-template-project-ts-swagger
Downloading template...
? Give a description of your app:
? Add API Gateway (moleculer-web) service? Yes
? Add demo frontend project (Quasar)? Yes
? Use Swagger? Yes
? Use Swagger-Stats? Yes
? Use Swagger-Editor? Yes
? Would you like to communicate with other nodes? Yes
? Select a transporter NATS (recommended)
? Would you like to use cache? No
? Add DB sample service? Yes
? Would you like to enable metrics? Yes
? Select a reporter solution Prometheus
? Would you like to enable tracing? Yes
? Select a exporter solution Console
? Add Docker & Kubernetes sample files? Yes
? Use ESLint to lint your code? Yes
? Would you like to choose a file watcher? Yes
? Select a file watcher ts-node (recommended)

Create 'moleculertemplatetest' folder...
? Would you like to run 'npm install'? Yes **-- no if using swagger stats**
```

## NPM scripts
- `npm run dev`: Start development mode (load all services locally without transporter with hot-reload & REPL)
- `npm run build`: Build project to javascript in `dist` folder (with rollup)
- `npm run start`: Start production mode (set `SERVICES` env variable to load certain services) `used for docker`
- `npm run start:prod`: Start using `env/production.env`
- `npm run cli`: Start a CLI and connect to production. _Don't forget to set production namespace with `--ns` argument in script_
- `npm run lint`: Run ESLint
- `npm run test:watch`: Run continuous test mode with watching
- `npm test`: Run tests
- `npm test:coverage`: Run tests & generate coverage report
- `npm run dc:up`: Start the stack with Docker Compose
- `npm run dc:logs`: Watch & follow the container logs
- `npm run dc:down`: Stop the stack with Docker Compose

## swagger
Swagger has been updated to use the swagger initialize file in swagger-dist and openAPI 3.0.1 schema. This is a change from previous versions of swagger-dist where the html file was updated and held the js code for swagger initialize. Swagger editor has also been added for those who like swagger editor. You can use one or the other or both at the same time is supported.

## frontend
The frontend is built with Quasar v2 and compiled into the public folder of api gateway. The frontend project directory is provided when selecting yes to adding frontend project. Quasar is an awesome vue framework that not only provide you with a frontend site, but can also compile to mobile app, SSR, PWA, BEX, Electron app, all from the same code base. [See Quasar for more details](https://quasar.dev/introduction-to-quasar)

## REPL in Docker
Docker images now have moleculer-repl added to them. To use, open docker cli of a container, like api container, and run the following command `moleculer --ns {enter your namespace here}`, e.g. `moleculer --ns test-template2-docker`. This will start a new broker serviece node and add it to your existing nodes so that you can use the repl commands in docker.

## Current issues
If using swagger-stats, running npm install will fail due to swagger-stats dependency of prom-client, which is `"prom-client": ">= 10 <= 13",` and we are using 14.0.1. Until this is changed in swagger-stats either use yarn or remove prom-client from package.json, npm install, then add it back and do npm install.

If you found this project useful, buy me a beer! 😁
[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif)](https://www.paypal.com/donate/?business=NNWZXRYD4FMNL&no_recurring=0&item_name=If+you+found+this+project+useful%2C+please+by+me+a+beer+to+show+your+gratitude.+%5E_%5E&currency_code=USD)

## License
moleculer-template-project-ts-swagger is available under the [MIT license](https://tldrlegal.com/license/mit-license).

## Contact
Copyright (c) 2022 Our Parent Center

[![@moleculerjs](https://img.shields.io/badge/github-moleculerjs-green.svg)](https://github.com/moleculerjs) [![@MoleculerJS](https://img.shields.io/badge/twitter-MoleculerJS-blue.svg)](https://twitter.com/MoleculerJS)
