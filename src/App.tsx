import { Split } from "./Split.tsx"
import { type Component, createSignal, Show } from "solid-js"

export const App: Component = () => {
  const [tab, setTab] = createSignal("split")

  return <div class="w-full px-8 py-4">
    <div class="tabs tabs-lg tabs-bordered">
      <a classList={{ tab: true, "tab-active": tab() === "split" }} onClick={() => setTab("split")}>SPLIT</a>
      <a classList={{ tab: true, "tab-active": tab() === "diff" }} onClick={() => setTab("diff")}>DIFF</a>
      <a classList={{ tab: true, "tab-active": tab() === "filter" }} onClick={() => setTab("filter")}>FILTER</a>
      <a classList={{ tab: true, "tab-active": tab() === "merge" }} onClick={() => setTab("merge")}>MERGE</a>
    </div>
    <div class="pt-10">
      <Show when={tab() === "split"}>
        <Split />
      </Show>
      <Show when={tab() === "diff"}>
        diff content
      </Show>
      <Show when={tab() === "merge"}>
        merge content
      </Show>
      <Show when={tab() === "filter"}>
        filter content
      </Show>
    </div>
  </div>
}
