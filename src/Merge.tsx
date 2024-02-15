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

export const Merge: Component = () => {
  const [data1, setData1] = createSignal<Row[]>([])
  const [filename1, setFilename1] = createSignal("")
  const [header1, setHeader1] = createSignal(true)
  const hasData1 = createMemo(() => data1().length > 0)

  const [data2, setData2] = createSignal<Row[]>([])
  const [filename2, setFilename2] = createSignal("")
  const [header2, setHeader2] = createSignal(true)
  const hasData2 = createMemo(() => data2().length > 0)

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

    setFilename2(file.name)

    const { data, errors } = await parseCSV(file, header2())

    if (errors.length > 0) {
      alert("There was an error with the file")
      return
    }

    setData2([...data])
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
          <div>
            ok
          </div>
        </Show>
      </div>
    </div>
  );
};

