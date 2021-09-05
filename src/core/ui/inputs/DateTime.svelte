<script>
	import { onMount } from "svelte";
	import flatpickr from "flatpickr";

	export let id;
	export let field;
	export let container;
	export let tabindex;
	let dateTimeConfig;
	onMount(() => {
	
		dateTimeConfig = field.metadata.getCustomProperty("dateTimeInputConfig") || {
			pickerConfig: "DateOnly",
			is12Hours: true,
			dateTimeFormat: "Y-m-d",
		};
		var now = new Date();
		flatpickr(container, {
			enableTime: dateTimeConfig.pickerConfig != "DateOnly",
			dateFormat: "Z",
			noCalendar: dateTimeConfig.pickerConfig == "TimeOnly",
			time_24hr: !dateTimeConfig.is12Hours,
			altInput: true,
			altFormat: dateTimeConfig.dateTimeFormat,
			defaultHour: now.getHours(),
			defaultMinute:now.getMinutes(),
			position: "below",
			onChange: () => {
				if (container.value == "") {
					field.init(null);
					return;
				}
				field.init(container.value);
			},
		});
	});
</script>

<input
	type="text"
	{id}
	bind:value={field.valueAsText}
	required={field.metadata.required}
	{tabindex}
	autocomplete="off"
	class="form-control"
	bind:this={container} />
