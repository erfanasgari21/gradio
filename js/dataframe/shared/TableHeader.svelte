<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import EditableCell from "./EditableCell.svelte";
    import CellMenu from "./CellMenu.svelte";
    import type { HeadersWithIDs } from "./utils";
    import type { I18nFormatter } from "js/core/src/gradio_helper";
    import type { SortDirection } from "./utils";

    export let headers: HeadersWithIDs;
    export let editable: boolean;
    export let latex_delimiters: {
        left: string;
        right: string;
        display: boolean;
    }[];
    export let line_breaks: boolean;
    export let root: string;
    export let i18n: I18nFormatter;
    export let col_count: [number, "fixed" | "dynamic"];
    export let row_count: [number, "fixed" | "dynamic"];
    export let show_row_numbers: boolean;
    export let sort_by: number | undefined;
    export let sort_direction: SortDirection | undefined;
    export let els: Record<string, { cell: null | HTMLTableCellElement; input: null | HTMLInputElement }>;

    const dispatch = createEventDispatcher<{
        sort: { index: number };
        edit_header: { index: number, value: string };
        add_column: { index: number, position: "left" | "right" };
    }>();

    let header_edit: number | false = false;
    let selected_header: number | false = false;
    let active_header_menu: { col: number; x: number; y: number; } | null = null;

    function get_sort_status(
        name: string,
        _sort?: number,
        direction?: SortDirection
    ): "none" | "ascending" | "descending" {
        if (!_sort) return "none";
        if (headers[_sort].value === name) {
            if (direction === "asc") return "ascending";
            if (direction === "des") return "descending";
        }
        return "none";
    }

    function handle_sort(col: number): void {
        dispatch("sort", { index: col });
    }

    async function edit_header(i: number, select = false): Promise<void> {
        if (!editable || col_count[1] !== "dynamic" || header_edit === i) return;
        selected_header = i;
        header_edit = i;
    }

    function end_header_edit(event: CustomEvent<KeyboardEvent>, index: number): void {
        if (!editable) return;

        switch (event.detail.key) {
            case "Escape":
            case "Enter":
            case "Tab":
                event.preventDefault();
                selected_header = header_edit;
                header_edit = false;
                dispatch("edit_header", { 
                    index,
                    value: headers[index].value
                });
                break;
        }
    }

    function toggle_header_menu(event: MouseEvent, col: number): void {
        event.stopPropagation();
        if (active_header_menu && active_header_menu.col === col) {
            active_header_menu = null;
        } else {
            const header = (event.target as HTMLElement).closest("th");
            if (header) {
                const rect = header.getBoundingClientRect();
                active_header_menu = {
                    col,
                    x: rect.right,
                    y: rect.bottom
                };
            }
        }
    }

    function add_column_at(index: number, position: "left" | "right"): void {
        dispatch("add_column", { index, position });
        active_header_menu = null;
    }
</script>

<tr>
    {#if show_row_numbers}
        <th class="row-number-header" />
    {/if}
    {#each headers as { value, id }, i (id)}
        <th
            class:focus={header_edit === i || selected_header === i}
            aria-sort={get_sort_status(value, sort_by, sort_direction)}
            on:click={() => handle_sort(i)}
        >
            <div class="cell-wrap">
                <div class="header-content">
                    <EditableCell
                        bind:value={headers[i].value}
                        bind:el={els[id].input}
                        {latex_delimiters}
                        {line_breaks}
                        edit={header_edit === i}
                        on:keydown={(e) => end_header_edit(e, i)}
                        on:dblclick={() => edit_header(i)}
                        header
                        {root}
                    />
                    <button
                        class:sorted={sort_by === i}
                        class:des={sort_by === i && sort_direction === "des"}
                        class="sort-button {sort_direction}"
                        tabindex="0"
                        on:click|stopPropagation={() => handle_sort(i)}
                    >
                        <svg
                            width="1em"
                            height="1em"
                            viewBox="0 0 9 7"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M4.49999 0L8.3971 6.75H0.602875L4.49999 0Z" />
                        </svg>
                    </button>
                </div>

                {#if editable}
                    <button
                        class="cell-menu-button"
                        on:click={(event) => toggle_header_menu(event, i)}
                    >
                        ⋮
                    </button>
                {/if}
            </div>
        </th>
    {/each}
</tr>

{#if active_header_menu !== null}
    <CellMenu
        {i18n}
        x={active_header_menu.x}
        y={active_header_menu.y}
        row={-1}
        {col_count}
        {row_count}
        on_add_row_above={() => {}}
        on_add_row_below={() => {}}
        on_add_column_left={() => add_column_at(active_header_menu?.col ?? -1, "left")}
        on_add_column_right={() => add_column_at(active_header_menu?.col ?? -1, "right")}
    />
{/if}

<style>
    th {
        --ring-color: transparent;
        position: relative;
        outline: none;
        box-shadow: inset 0 0 0 1px var(--ring-color);
        padding: 0;
        background: var(--table-even-background-fill);
    }

    th:first-child {
        border-top-left-radius: var(--table-radius);
    }

    th:last-child {
        border-top-right-radius: var(--table-radius);
    }

    th.focus {
        --ring-color: var(--color-accent);
    }

    .cell-wrap {
        display: flex;
        align-items: center;
        outline: none;
        height: var(--size-full);
        min-height: var(--size-9);
        overflow: hidden;
    }

    .header-content {
        display: flex;
        align-items: center;
        overflow: hidden;
        flex-grow: 1;
        min-width: 0;
        white-space: normal;
        overflow-wrap: break-word;
        word-break: break-word;
    }

    .sort-button {
        display: flex;
        flex: none;
        justify-content: center;
        align-items: center;
        transition: 150ms;
        cursor: pointer;
        padding: var(--size-2);
        color: var(--body-text-color-subdued);
        line-height: var(--text-sm);
    }

    .sort-button:hover {
        color: var(--body-text-color);
    }

    .sort-button.sorted {
        color: var(--color-accent);
    }

    .sort-button.des svg {
        transform: scaleY(-1);
    }

    .cell-menu-button {
        flex-shrink: 0;
        display: none;
        background-color: var(--block-background-fill);
        border: 1px solid var(--border-color-primary);
        border-radius: var(--block-radius);
        width: var(--size-5);
        height: var(--size-5);
        min-width: var(--size-5);
        padding: 0;
        margin-right: var(--spacing-sm);
        z-index: var(--layer-1);
    }

    .cell-menu-button:hover {
        background-color: var(--color-bg-hover);
    }

    th:hover .cell-menu-button {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .row-number-header {
        width: var(--size-7);
        min-width: var(--size-7);
        text-align: center;
        background: var(--table-even-background-fill);
        position: sticky;
        left: 0;
        z-index: var(--layer-2);
    }

    svg {
        fill: currentColor;
        font-size: 10px;
    }
</style>
