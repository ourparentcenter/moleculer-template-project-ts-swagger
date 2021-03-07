import { JsonConverter, JsonCustomConvert } from 'json2typescript';

@JsonConverter
export class DateConverter implements JsonCustomConvert<Date | null> {
	public serialize(date: Date): string {
		return date.toISOString();
	}

	public deserialize(date: string | null): Date | null {
		return date ? new Date(date) : null;
	}
}
