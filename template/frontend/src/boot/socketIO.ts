import { boot } from 'quasar/wrappers';
import { io } from 'socket.io-client';
const socket = io('http://localhost:3000');
const socketIO = io;
export default boot(({ app }) => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	// app.use(socket);
	app.config.globalProperties.$socket;
	app.config.globalProperties.$socketIO;
});
socket.on('connect', () => console.log('Default socket connection established'));
export { socket, socketIO };
