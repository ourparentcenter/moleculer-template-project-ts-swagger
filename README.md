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
- Optional Swagger embedded with demo api and jsdoc http://localhost:3000/openapi
- Optionall Swagger-Stats with dashboaed at http://localhost:3000/api


## Install
To install use the [moleculer-cli](https://github.com/moleculerjs/moleculer-cli) tool.

```bash
$ moleculer init ourparentcenter/moleculer-template-project-ts-swagger#main my-project
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
? Would you like to run 'npm install'? Yes
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

## License
moleculer-template-project-ts-swagger is available under the [MIT license](https://tldrlegal.com/license/mit-license).

## Contact
Copyright (c) 2021 Our Parent Center

[![@moleculerjs](https://img.shields.io/badge/github-moleculerjs-green.svg)](https://github.com/moleculerjs) [![@MoleculerJS](https://img.shields.io/badge/twitter-MoleculerJS-blue.svg)](https://twitter.com/MoleculerJS)
