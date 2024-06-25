import { type Component, createSignal, Show } from "solid-js";
import { Split } from "./Split";
import { Merge } from "./Merge";
import { Diff } from "./Diff";
import { Filter } from "./Filter";

export const App: Component = () => {
  const [tab, setTab] = createSignal("filter");

  return (
    <div class="w-full px-8 py-4">
      <div class="w-full flex items-center">
        <div class="tabs tabs-lg tabs-bordered w-full">
          <a
            classList={{ tab: true, "tab-active": tab() === "split" }}
            onClick={() => setTab("split")}
          >
            SPLIT
          </a>
          <a
            classList={{ tab: true, "tab-active": tab() === "diff" }}
            onClick={() => setTab("diff")}
          >
            DIFF
          </a>
          <a
            classList={{ tab: true, "tab-active": tab() === "filter" }}
            onClick={() => setTab("filter")}
          >
            FILTER
          </a>
          <a
            classList={{ tab: true, "tab-active": tab() === "merge" }}
            onClick={() => setTab("merge")}
          >
            MERGE
          </a>
        </div>
        <div class="text-center">
          <a href="https://link.excalidraw.com/l/2Y6oR19oInE/AG1PNTvCjrF" target="_blank" class="hover:underline">Explanatory Diagram</a>
        </div>
      </div>
      <div class="pt-10">
        <Show when={tab() === "split"}>
          <Split />
        </Show>
        <Show when={tab() === "diff"}>
          <Diff />
        </Show>
        <Show when={tab() === "merge"}>
          <Merge />
        </Show>
        <Show when={tab() === "filter"}>
          <Filter />
        </Show>
      </div>
    </div>
  );
};
