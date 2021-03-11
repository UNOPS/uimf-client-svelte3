import * as umf from "../../framework";
import { DateTimeInputController } from "./DateTimeInputController";

export class DateRangeInputController extends umf.InputController<DateRange> {
	public minValueAsText: string = null;
	public maxValueAsText: string = null;

	public init(value: string): Promise<DateRangeInputController> {
		return new Promise((resolve, reject) => {
			this.value = this.parse(value);

			if (this.value != null && this.value.min != null) {
				this.minValueAsText = DateTimeInputController.serialize(this.value.min);
			}

			if (this.value != null && this.value.max != null) {
				this.maxValueAsText = DateTimeInputController.serialize(this.value.max);
			}

			resolve(this);
		});
	}

	public getValue(): Promise<DateRange> {
		return Promise.resolve(this.value);
	}

	public serializeValue(date: DateRange | string): any {
		const parsed = this.parse(date);
		return parsed != null ? parsed.serialize() : "";
	}

	private parse(value: DateRange | string): DateRange {
		if (value == null) {
			return new DateRange();
		}

		return typeof (value) === "string"
			? DateRange.parse(value)
			: value;
	}
}

// tslint:disable-next-line:max-classes-per-file
class DateRange {
	constructor(min: Date = null, max: Date = null) {
		this.min = min;
		this.max = max;
	}

	public min: Date;
	public max: Date;

	public static parse(date: string): DateRange {
		const split = date.split("|");
		const minPart = DateTimeInputController.parseDate(split[0]);
		const maxPart = DateTimeInputController.parseDate(split[1]);

		return new DateRange(minPart, maxPart);
	}

	public serialize(): string {
		return `${DateTimeInputController.serialize(this.min)}|${DateTimeInputController.serialize(this.max)}`;
	}
}
