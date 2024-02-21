import type { Component } from "solid-js";
import { For, Show, createSignal, createMemo, createEffect, Index } from "solid-js";

import Papa, { ParseResult } from "papaparse";

type Row = string[] | Record<string, string>;

const NODE_TYPES = ["empty", "not-empty", "contains", "not-contains", "equal", "not-equal"] as const
type FilterNodeType = typeof NODE_TYPES[number]
interface FilterNode {
  column: string;
  value: string;
  type: FilterNodeType
}

const EMPTY_FILTER_NODE: FilterNode = {
  column: "", value: "", type: "equal"
}

function parseCSV(file: File, header: boolean): Promise<ParseResult<Row>> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, string>>(file, {
      header,
      skipEmptyLines: true,
      complete: resolve,
    });
  });
}

export const Filter: Component = () => {
  const [data, setData] = createSignal<Row[]>([]);
  const [filename, setFilename] = createSignal("");
  const [header, setHeader] = createSignal(true);
  const hasData = createMemo(() => data().length > 0);

  const [matchingData, setMatchingData] = createSignal<Row[]>([])
  const [downloadLinkMatch, setDownloadLinkMatch] = createSignal("");
  const [downloadNameMatch, setDownloadNameMatch] = createSignal("");

  const [missingData, setMissingData] = createSignal<Row[]>([])
  const [downloadLinkMiss, setDownloadLinkMiss] = createSignal("");
  const [downloadNameMiss, setDownloadNameMiss] = createSignal("");

  const columns = createMemo(() => {
    if (data().length === 0) return [];
    const keys = Array.from(Object.keys(data()[0]));
    return keys.filter((k) => k !== "");
  });

  const disabled = false // TODO only when all filter nodes have all values

  const [filterGroups, setFilterGroups] = createSignal<FilterNode[][]>([[{...EMPTY_FILTER_NODE}]], { equals: false })

  const onFileInput = async (
    e: Event & { currentTarget: HTMLInputElement },
  ) => {
    const file = e.currentTarget.files[0];
    if (!file) return;

    setFilename(file.name);

    const { data, errors } = await parseCSV(file, header());

    if (errors.length > 0) {
      alert("There was an error with the file");
      return;
    }

    setData([...data]);
  };

  const onRemoveGroup = (index: number) => {
    setFilterGroups(groups => {
      groups.splice(index, 1)
      return [...groups]
    })
  }
  const onAddNewCondition = (index: number) => {
    setFilterGroups(groups => {
      groups[index] = [...groups[index], {...EMPTY_FILTER_NODE}]
      return [...groups]
    })
  }
  const onRemoveFilter = (groupIndex: number, filterIndex: number) => {
    setFilterGroups(groups => {
      groups[groupIndex].splice(filterIndex, 1)
      groups[groupIndex] = [...groups[groupIndex]]
      return [...groups]
    })
  }
  const setFilterType = (groupIndex: number, filterIndex: number, type: string) => {
    setFilterGroups(groups => {
      groups[groupIndex][filterIndex].type = type as FilterNodeType
      groups[groupIndex] = [...groups[groupIndex]]
      return [...groups]
    })
  }
  const setFilterColumn = (groupIndex: number, filterIndex: number, column: string) => {
    setFilterGroups(groups => {
      groups[groupIndex][filterIndex].column = column
      return [...groups]
    })
  }
  const setFilterValue = (groupIndex: number, filterIndex: number, value: string) => {
    setFilterGroups(groups => {
      groups[groupIndex][filterIndex].value = value
      return [...groups]
    })
  }

  const matchRow = (row: Row) => {
    const matches = filterGroups().map(group => {
      const filterMatches = group.map(filter => {
        const value = row[filter.column] ?? ""
        if (filter.type === "contains") {
          return value.includes(filter.value)
        } else if (filter.type === "not-contains") {
          return !value.includes(filter.value)
        } else if (filter.type === "equal") {
          return value === filter.value
        } else if (filter.type === "not-equal") {
          return value !== filter.value
        } else if (filter.type === "empty") {
          return value === ""
        } else if (filter.type === "not-empty") {
          return value !== ""
        }
        return false
      })
      return !filterMatches.includes(false)
    })
    return matches.includes(true)
  }

  const onFilter = async () => {
    const matchingData: Row[] = [];
    for (const row of data()) {
      const match = matchRow(row)
      if (!match) continue
      matchingData.push({...row});
    }
    setMatchingData([...matchingData])

    const csvMatching = Papa.unparse(matchingData, { header: true });
    const prefixMatching = filename().replace(/\.csv/g, "");
    const nameMatching = `${prefixMatching}-match.csv`;
    const blobMatching = new Blob([csvMatching], { type: "text/csv" });
    const hrefMatching = window.URL.createObjectURL(blobMatching);

    setDownloadLinkMatch(hrefMatching);
    setDownloadNameMatch(nameMatching);

    // === === ===

    const missingData: Row[] = [];
    for (const row of data()) {
      const match = matchRow(row)
      if (match) continue
      missingData.push({...row});
    }
    setMissingData([...missingData])

    const csvMissing = Papa.unparse(missingData, { header: true });
    const prefixMissing = filename().replace(/\.csv/g, "");
    const nameMissing = `${prefixMissing}-miss.csv`;
    const blobMissing = new Blob([csvMissing], { type: "text/csv" });
    const hrefMissing = window.URL.createObjectURL(blobMissing);

    setDownloadLinkMiss(hrefMissing);
    setDownloadNameMiss(nameMissing);
  };

  return (
    <div class="flex flex-col items-center space-y-4">
      <div class="w-full max-w-4xl space-y-8">
        <div class="flex w-full justify-center">
          <div class="max-w-md space-y-2">
            <div class="form-control w-full">
              <label class="label cursor-pointer">
                <span class="label-text text-lg">Header Row</span>
                <input
                  type="checkbox"
                  class="toggle"
                  checked={header()}
                  onInput={() => setHeader((h) => !h)}
                />
              </label>
            </div>
            <div class="form-control w-full">
              <input
                type="file"
                class="file-input file-input-bordered file-input-primary w-full"
                multiple={false}
                accept="text/csv"
                onChange={onFileInput}
              />
            </div>

            <Show when={hasData()}>
              <div class="w-full text-xl">{data().length} rows</div>
            </Show>
          </div>
        </div>

        <Show when={hasData()}>
          <div class="space-y-4">
            <div class="space-y-2">
              <For each={filterGroups()}>
                {(group, groupIndex) => (
                  <div class="space-y-4">
                    <div class="flex justify-between items-center">
                      <div class="text-xl font-medium">Group {groupIndex()+1}</div>
                      <Show when={groupIndex() > 0}>
                        <button class="btn btn-square btn-ghost" onClick={() => onRemoveGroup(groupIndex())}>
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </Show>
                    </div>
                    <Index each={group}>
                      {(filter, filterIndex) => (
                        <div class="flex justify-between items-center gap-4">
                          <div class="w-1/3">
                            <select class="select select-bordered w-full max-w-xs" value={filter().column} onChange={e => setFilterColumn(groupIndex(), filterIndex, e.currentTarget.value)}>
                              <option disabled selected>Column</option>
                              <For each={columns()}>
                                {item => <option value={item}>{item}</option>}
                              </For>
                            </select>
                          </div>
                          <div class="w-1/3">
                            <select class="select select-bordered w-full max-w-xs" value={filter().type} onChange={e => setFilterType(groupIndex(), filterIndex, e.currentTarget.value)}>
                              <option disabled selected>Condition Type</option>
                              <For each={NODE_TYPES}>
                                {item => <option value={item}>{item}</option>}
                              </For>
                            </select>
                          </div>
                          <div class="w-1/3">
                            <Show when={!filter().type.includes("empty")}>
                              <input class="input input-bordered w-full" value={filter().value} onInput={e => setFilterValue(groupIndex(), filterIndex, e.currentTarget.value)} />
                            </Show>
                          </div>
                          <button class="btn btn-square btn-ghost" onClick={() => onRemoveFilter(groupIndex(), filterIndex)}>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      )}
                    </Index>
                    <button class="btn btn-ghost w-full" onClick={() => onAddNewCondition(groupIndex())}>
                      + new condition
                    </button>
                    <div class="divider">OR</div>
                  </div>
                )}
              </For>
              <button class="btn btn-ghost w-full" onClick={() => setFilterGroups(val => [...val, []])}>
                + new group
              </button>
            </div>

            <div class="pt-4">
              <button class="btn btn-primary w-full" onClick={onFilter}>
                filter
              </button>
            </div>
            <Show when={downloadLinkMatch() !== ""}>
              <div class="link text-md">
                <a href={downloadLinkMatch()} download={downloadNameMatch()}>
                  {downloadNameMatch()} ({matchingData().length})
                </a>
              </div>
            </Show>
            <Show when={downloadLinkMiss() !== ""}>
              <div class="link text-md">
                <a href={downloadLinkMiss()} download={downloadNameMiss()}>
                  {downloadNameMiss()} ({missingData().length})
                </a>
              </div>
            </Show>
          </div>
        </Show>
      </div>
    </div>
  );
};
