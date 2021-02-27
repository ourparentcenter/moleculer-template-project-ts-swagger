import _ from 'lodash';
import { boot } from 'quasar/wrappers';

export default boot(({ app }) => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	app.use(_);
});
export { _ };
