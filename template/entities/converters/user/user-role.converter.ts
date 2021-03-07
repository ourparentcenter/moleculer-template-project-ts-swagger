import { JsonConverter, JsonCustomConvert } from 'json2typescript';
import { UserRole } from '../../../types';

@JsonConverter
export class UserRoleConverter implements JsonCustomConvert<UserRole[]> {
	public serialize(items: UserRole[]): string[] {
		return items.map((x) => x.toString());
	}

	public deserialize(items: string[]): UserRole[] {
		const values = Object.values<string>(UserRole);
		const valids = items.every((x) => values.includes(x));
		if (!valids) {
			throw new Error(`Not valid enum in roles "${items.join('", "')}"`);
		}
		return items.map<UserRole>((x) => x as UserRole);
	}
}
