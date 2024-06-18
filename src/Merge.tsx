import type { Component } from "solid-js";
import { For, Show, createSignal, createMemo, createEffect } from "solid-js"

import Papa, { ParseResult } from "papaparse"

type Row = string[] | Record<string, string>

function parseCSV(file: File, header: boolean): Promise<ParseResult<Row>> {
  return new Promise(resolve => {
    Papa.parse<Record<string, string>>(file, {
      header,
      skipEmptyLines: true,
      complete: resolve
    })
  })
}

export const Merge: Component = () => {
  const [data1, setData1] = createSignal<Row[]>([])
  const [filename1, setFilename1] = createSignal("")
  const [header1, setHeader1] = createSignal(true)
  const hasData1 = createMemo(() => data1().length > 0)

  const [data2, setData2] = createSignal<Row[]>([])
  const [header2, setHeader2] = createSignal(true)
  const hasData2 = createMemo(() => data2().length > 0)

  const [match1, setMatch1] = createSignal("")
  const [match2, setMatch2] = createSignal("")

  const [downloadLink, setDownloadLink] = createSignal("")
  const [downloadName, setDownloadName] = createSignal("")

  const columns1 = createMemo(() => {
    if (data1().length === 0) return []
    const keys = Array.from(Object.keys(data1()[0]))
    return keys.filter(k => k !== "")
  })
  const columns2 = createMemo(() => {
    if (data2().length === 0) return []
    const keys = Array.from(Object.keys(data2()[0]))
    return keys.filter(k => k !== "")
  })
  const combinedColumns = createMemo(() => {
    return Array.from(new Set([...columns1(), ...columns2()]))
  })

  createEffect(() => {
    if (columns1().length === 0 || match1() !== "") return
    const email = columns1().find(c => c.toLowerCase().includes("email"))
    if (email === undefined) return
    setMatch1(email)
  })
  createEffect(() => {
    if (columns2().length === 0 || match2() !== "") return
    const email = columns2().find(c => c.toLowerCase().includes("email"))
    if (email === undefined) return
    setMatch2(email)
  })

  const onFileInput1 = async (e: Event & { currentTarget: HTMLInputElement }) => {
    const file = e.currentTarget.files[0]
    if (!file) return;

    setFilename1(file.name)

    const { data, errors } = await parseCSV(file, header1())

    if (errors.length > 0) {
      alert("There was an error with the file")
      return
    }

    setData1([...data])
  }
  const onFileInput2 = async (e: Event & { currentTarget: HTMLInputElement }) => {
    const file = e.currentTarget.files[0]
    if (!file) return;

    const { data, errors } = await parseCSV(file, header2())

    if (errors.length > 0) {
      alert("There was an error with the file")
      return
    }

    setData2([...data])
  }

  const onMerge = async () => {
    const mergedData: Row[] = []
    for (const row of data1()) {
      const mergedRow = { ...row }

      const matchValue = row[match1()]
      if (matchValue === undefined || matchValue === "") {
        mergedData.push(mergedRow)
        continue
      }

      const matching = data2().find(other => other[match2()] === matchValue)
      if (matching === undefined) {
        mergedData.push(mergedRow)
        continue
      }

      for (const col of combinedColumns()) {
        if (columns1().includes(col)) {
          if (matching[col] === undefined) continue
          const prop = `${col} (2)`
          mergedRow[prop] = matching[col]
        } else {
          mergedRow[col] = matching[col] ?? ""
        }
      }
      mergedData.push(mergedRow)
    }

    const columns = [] as string[]
    for (const row of mergedData) {
      const ks = Object.keys(row)
      for (const k of ks) {
        if (columns.includes(k)) continue
        columns.push(k)
      }
    }

    const csv = Papa.unparse(mergedData, { header: true, columns });
    const prefix = filename1().replace(/\.csv/g, "")
    const name = `${prefix}-merged.csv`
    const blob = new Blob([csv], { type: "text/csv" });
    const href = window.URL.createObjectURL(blob);

    setDownloadLink(href)
    setDownloadName(name)
  }

  return (
    <div class="flex flex-col items-center space-y-4">
      <div class="max-w-4xl w-full space-y-8">
        <div class="w-full flex justify-between">
          <div class="max-w-md space-y-2">
            <div class="form-control w-full">
              <label class="label cursor-pointer">
                <span class="label-text text-lg">Header Row</span> 
                <input type="checkbox" class="toggle" checked={header1()} onInput={() => setHeader1(h => !h)} />
              </label>
            </div>
            <div class="form-control w-full">
              <input type="file" class="file-input file-input-bordered file-input-primary w-full"
                multiple={false} accept="text/csv"
                onChange={onFileInput1}
              />
            </div>

            <Show when={hasData1()}>
              <div class="text-xl w-full">{data1().length} rows</div>
            </Show>
          </div>

          <div class="h-full pt-10">
            <i class="ph-bold ph-arrow-left text-3xl"></i>
          </div>

          <div class="max-w-md space-y-2">
            <div class="form-control w-full">
              <label class="label cursor-pointer">
                <span class="label-text text-lg">Header Row</span> 
                <input type="checkbox" class="toggle" checked={header2()} onInput={() => setHeader2(h => !h)} />
              </label>
            </div>
            <div class="form-control w-full">
              <input type="file" class="file-input file-input-bordered file-input-primary w-full"
                multiple={false} accept="text/csv"
                onChange={onFileInput2}
              />
            </div>

            <Show when={hasData2()}>
              <div class="text-xl w-full">{data2().length} rows</div>
            </Show>
          </div>
        </div>

        <Show when={hasData1() && hasData2()}>
          <div class="space-y-4">
            <div class="space-y-2">
              <div class="text-lg font-medium">Match on column</div>
              <div class="flex justify-between space-x-8">
                <select class="select select-bordered w-full max-w-xs" value={match1()} onChange={e => setMatch1(e.currentTarget.value)}>
                  <option disabled selected>Match Column</option>
                  <For each={columns1()}>
                    {item => (
                      <option value={item}>{item}</option>
                    )}
                  </For>
                </select>

                <select class="select select-bordered w-full max-w-xs" value={match2()} onChange={e => setMatch2(e.currentTarget.value)}>
                  <option disabled selected>Match Column</option>
                  <For each={columns2()}>
                    {item => (
                      <option value={item}>{item}</option>
                    )}
                  </For>
                </select>
              </div>
            </div>

            <button class="btn btn-primary w-full" onClick={onMerge} disabled={match1() === "" || match2() === ""}>
              merge
            </button>
            <Show when={downloadLink() !== ""}>
              <div class="link text-md">
                <a href={downloadLink()} download={downloadName()}>{downloadName()}</a>
              </div>
            </Show>
          </div>
        </Show>
      </div>
    </div>
  );
};

