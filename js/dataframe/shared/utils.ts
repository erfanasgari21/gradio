export type Headers = string[];
export type Data = (string | number)[][];
export type Datatype = "str" | "markdown" | "html" | "number" | "bool" | "date";
export type Metadata = {
	[key: string]: string[][] | null;
} | null;
export type HeadersWithIDs = { value: string; id: string }[];

export function make_id(): string {
	return Math.random().toString(36).substring(2, 15);
}

export function guess_delimiter(text: string, possibleDelimiters: string[]): string[] {
	return possibleDelimiters.filter(weedOut);

	function weedOut(delimiter: string): boolean {
		var cache = -1;
		return text.split("\n").every(checkLength);

		function checkLength(line: string): boolean {
			if (!line) {
				return true;
			}

			var length = line.split(delimiter).length;
			if (cache < 0) {
				cache = length;
			}
			return cache === length && length > 1;
		}
	}
}

export function data_uri_to_blob(data_uri: string): Blob {
	const byte_str = atob(data_uri.split(",")[1]);
	const mime_str = data_uri.split(",")[0].split(":")[1].split(";")[0];

	const ab = new ArrayBuffer(byte_str.length);
	const ia = new Uint8Array(ab);

	for (let i = 0; i < byte_str.length; i++) {
		ia[i] = byte_str.charCodeAt(i);
	}

	return new Blob([ab], { type: mime_str });
}

export type SortDirection = "asc" | "des";

export function get_max<T extends { value: any }>(data: T[][]): T[] {
	if (!data || data.length === 0 || !data[0]) return [];
	let max = data[0].slice();
	for (let i = 0; i < data.length; i++) {
		for (let j = 0; j < data[i].length; j++) {
			if (`${max[j].value}`.length < `${data[i][j].value}`.length) {
				max[j] = data[i][j];
			}
		}
	}
	return max;
}
