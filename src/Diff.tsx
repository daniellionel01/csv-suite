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

export const Diff: Component = () => {
  const [data1, setData1] = createSignal<Row[]>([])
  const [filename1, setFilename1] = createSignal("")
  const [header1, setHeader1] = createSignal(true)
  const hasData1 = createMemo(() => data1().length > 0)

  const [data2, setData2] = createSignal<Row[]>([])
  const [header2, setHeader2] = createSignal(true)
  const hasData2 = createMemo(() => data2().length > 0)

  const [match1, setMatch1] = createSignal("")
  const [match2, setMatch2] = createSignal("")

  const [includeLeft, setIncludeLeft] = createSignal(false)
  const [includeOverlapping, setIncludeOverlapping] = createSignal(false)
  const [includeRight, setIncludeRight] = createSignal(false)

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

  const getLeftData = () => {
    if (match1() === "" || match2() === "") return []
    const result: Row[] = []
    for (const row of data1()) {
      const matchValue = row[match1()]
      const match = data2().find(other => other[match2()] === matchValue)
      if (match !== undefined) continue
      result.push({ ...row })
    }
    return result
  }
  const getOverlappingData = () => {
    if (match1() === "" || match2() === "") return []
    const result: Row[] = []
    for (const row of data1()) {
      const matchValue = row[match2()]
      const match = data2().find(other => other[match2()] === matchValue)
      if (match === undefined) continue

      for (const col of combinedColumns()) {
        if (columns1().includes(col)) {
          if (match[col] === undefined) continue
          const prop = `${col} (2)`
          row[prop] = match[col]
        } else {
          row[col] = match[col] ?? ""
        }
      }

      result.push({ ...row })
    }
    return result
  }
  const getRightData = () => {
    if (match1() === "" || match2() === "") return []
    const result: Row[] = []
    for (const row of data2()) {
      const matchValue = row[match2()]
      const match = data1().find(other => other[match2()] === matchValue)
      if (match !== undefined) continue
      result.push({ ...row })
    }
    return result
  }

  const onDiff = async () => {
    const result: Row[] = []

    const leftData = getLeftData()
    const overlappingData = getOverlappingData()
    const rightData = getRightData()
    
    if (includeLeft()) {
      result.push(...getLeftData())
    }
    if (includeOverlapping()) {
      result.push(...getOverlappingData())
    }
    if (includeRight()) {
      result.push(...getRightData())
    }

    const csv = Papa.unparse(result, { header: true });
    const prefix = filename1().replace(/\.csv/g, "")
    const name = `${prefix}-diff.csv`
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
              <div class="text-lg font-medium">Include</div>
              <div class="flex justify-between gap-8">
                <div class="form-control w-full">
                  <label class="label cursor-pointer">
                    <span class="label-text">left</span> 
                    <input type="checkbox" checked={includeLeft()} onChange={() => setIncludeLeft(x => !x)} class="checkbox" />
                  </label>
                </div>
                <div class="form-control w-full">
                  <label class="label cursor-pointer">
                    <span class="label-text">overlapping</span> 
                    <input type="checkbox" checked={includeOverlapping()} onChange={() => setIncludeOverlapping(x => !x)} class="checkbox" />
                  </label>
                </div>
                <div class="form-control w-full">
                  <label class="label cursor-pointer">
                    <span class="label-text">right</span> 
                    <input type="checkbox" checked={includeRight()} onChange={() => setIncludeRight(x => !x)} class="checkbox" />
                  </label>
                </div>
              </div>
            </div>

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

            <button class="btn btn-primary w-full" onClick={onDiff} disabled={match1() === "" || match2() === ""}>
              diff
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

