import type { Component } from "solid-js";
import { For, Show, createSignal, createMemo } from "solid-js"

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

interface Download {
  download: string;
  href: string;
}

export const Split: Component = () => {
  const [parts, setParts] = createSignal(1)
  const [data, setData] = createSignal<Row[]>([])
  const [filename, setFilename] = createSignal("")
  const [download, setDownload] = createSignal<Download[]>([])
  const [header, setHeader] = createSignal(true)
  const hasData = createMemo(() => data().length > 0)
  const perPart = createMemo(() => {
    if (parts() === 0) return 0
    return Math.ceil(data().length / parts())
  })

  const onFileInput = async (e: Event & { currentTarget: HTMLInputElement }) => {
    const file = e.currentTarget.files[0]
    if (!file) return;

    setFilename(file.name)
    setDownload([])
    setParts(1)

    const { data, errors } = await parseCSV(file, header())

    if (errors.length > 0) {
      alert("There was an error with the file")
      return
    }

    setData([...data])
  }

  const onGenerate = () => {
    setDownload([])
    for (let i = 0; i < parts(); i++) {
      const j = i * perPart()
      const partData = data().slice(j, j+perPart())

      const csv = Papa.unparse(partData, { header: header() });

      const prefix = filename().replace(/.csv/g, "")
      const download = `${prefix}-part${i+1}.csv`
      const blob = new Blob([csv], { type: "text/csv" });
      const href = window.URL.createObjectURL(blob);

      const part = { href, download }
      setDownload(d => [...d, part])
    }
  }

  return (
    <div class="flex flex-col items-center space-y-4">
      <div class="form-control w-full max-w-md">
        <label class="label cursor-pointer">
          <span class="label-text text-lg">Header Row</span> 
          <input type="checkbox" class="toggle" checked={header()} onInput={() => setHeader(h => !h)} />
        </label>
      </div>
      <div class="form-control w-full max-w-md">
        <input type="file" class="file-input file-input-bordered file-input-primary w-full max-w-md"
          multiple={false} accept="text/csv"
          onChange={onFileInput}
        />
      </div>

      <Show when={hasData()}>
        <div class="text-xl mt-6">{data().length} rows</div>
        <div class="form-control w-full max-w-md mt-6">
          <label class="label">
            <span class="label-text">How many parts / files do you want?</span>
          </label>
          <input type="number" class="input input-bordered"
            value={parts()}
            onInput={e => setParts(e.currentTarget.valueAsNumber)}
          />
          <label class="label">
            <span class="label-text">That's up to {perPart} rows per file</span>
          </label>
          <button class="btn btn-primary mt-4" onClick={onGenerate} disabled={parts() <= 0 || isNaN(parts())}>
            generate
          </button>
        </div>
      </Show>

      <div class="mt-8 space-y-4">
        <For each={download()}>
          {(item) => (
            <div class="link text-md">
              <a href={item.href} download={item.download}>{item.download}</a>
            </div>
          )}
        </For>
      </div>
    </div>
  );
};

