import * as umf from "../../framework";

export class DateTimeInputController extends umf.InputController<Date> {
	public valueAsText: string = null;

	public init(value: string): Promise<DateTimeInputController> {
		return new Promise((resolve, reject) => {
			this.value = DateTimeInputController.parseDate(value);
			this.valueAsText = this.serializeValue(this.value);

			resolve(this);
		});
	}

	public getValue(): Promise<Date> {
		return Promise.resolve(this.value);
	}

	public serializeValue(date: Date | string): string {
		return DateTimeInputController.serialize(date);
	}

	public static serialize(date: Date | string): string {
		const asDate =
			typeof date === "string" ? DateTimeInputController.parseDate(date) : date;

		return asDate != null
			? asDate.toISOString()
			: null;
	}

	public static parseDate(value: string): Date {
		const valueAsText = value == null ? null : value;
		if (valueAsText) {
			if (isNaN(Date.parse(value))) {
				// timeOnly
				let dateOnly = new Date().toISOString().split("T")[0];
				let hour = +value.split(":")[0];
				let minute = +value.split(":")[1];
				let date = this.asUtcTime(dateOnly, hour, minute, 0);
				const dateAsNumber = Date.parse(date.toString());

				return date instanceof Date && !isNaN(date.getTime())
					? new Date(dateAsNumber)
					: null;
			}

			let selectedDate: Date;

			if (value.split("T").length > 1) {
				let date = value.split("T")[0];
				let time = value.split("T")[1];
				let hour = +time.split(":")[0];
				let minute = +time.split(":")[1];
				selectedDate = this.asUtcTime(date, hour, minute, 0);
			} else {
				selectedDate = this.asUtcTime(value, 7, 0, 0);
			}

			if (selectedDate) {
				const dateAsNumber = Date.parse(selectedDate.toString());
				return isNaN(dateAsNumber) ? null : new Date(dateAsNumber);
			}
		}
	}

	public static asUtcTime(
		date: Date | string,
		hour: number,
		min: number,
		second: number
	): Date {
		/// <summary>Returns provided date as if it was UTC date.</summary>
		/// <param name="date">Local date/time.</param>
		/// <returns type="Date">Date object.</returns>
		if (date == null) {
			return null;
		}
		// If string but not UTC.
		if (typeof date === "string" && date[date.length - 1] !== "Z") {
			const year = parseInt(date.substr(0, 4), 10);
			const month = parseInt(date.substr(5, 2), 10);
			const day = parseInt(date.substr(8, 2), 10);

			// Assume UTC.
			return this.getIsoDate(year, month, day, hour, min, second);
		}

		const datepart = new Date(new Date(date as Date).toISOString());

		return this.getIsoDate(
			datepart.getFullYear(),
			datepart.getMonth() + 1,
			datepart.getDate(),
			hour,
			min,
			second
		);
	}

	private static getIsoDate(
		year: number,
		month: number,
		day: number,
		hour: number,
		min: number,
		second: number
	): Date {
		const iso =
			year +
			"-" + // year
			this.format2DecimalPlaces(month) +
			"-" + // month
			this.format2DecimalPlaces(day) + // day
			"T" +
			this.format2DecimalPlaces(hour) +
			":" +
			this.format2DecimalPlaces(min) +
			":" +
			this.format2DecimalPlaces(second) +
			".000Z";
		return new Date(iso);
	}

	public static format2DecimalPlaces(n: number): string {
		return ("0" + n).slice(-2);
	}
}
