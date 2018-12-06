// tslint:disable:no-implicit-dependencies no-submodule-imports
import * as React from "react";

import { action } from "@storybook/addon-actions";
import { boolean } from "@storybook/addon-knobs";
import { storiesOf } from "@storybook/react";
import PerfCallTree, { ITreeElement } from "./PerfCallTree";

const commonWrapStyle: React.CSSProperties = {
  width: "1400px",
  padding: "8px",
  marginTop: "200px",
  backgroundColor: "white"
};

function generateBinaryTree(depth: number, rootLabel: string): ITreeElement[] {
  const array: ITreeElement[] = [];
  let counter = 0;
  function generateBinaryTree_(
    depthInternal: number,
    label: string,
    parentId?: number
  ): number {
    const id = counter;
    const body: ITreeElement = {
      id,
      parentId,
      label,
      childIds: [],
      relativeRatio: 1 / 2,
      immediateRatio: Math.pow(1 / 2, depth - depthInternal),
      totalRatio: Math.pow(1 / 2, depth - depthInternal - 1),
      hasCode: false
    };
    array.push(body);
    counter++;
    if (depthInternal > 0) {
      const leftId = generateBinaryTree_(
        depthInternal - 1,
        label + `/left${depthInternal - 1}`,
        id
      );
      const rightId = generateBinaryTree_(
        depthInternal - 1,
        label + `/right${depthInternal - 1}`,
        id
      );
      body.childIds.push(leftId, rightId);
    }
    return id;
  }

  generateBinaryTree_(depth - 1, rootLabel, undefined);
  return array;
}

function generateTernaryTree(depth: number, rootLabel: string): ITreeElement[] {
  const array: ITreeElement[] = [];
  let counter = 0;
  function generateTernaryTree_(
    depthInternal: number,
    label: string,
    parentId?: number
  ): number {
    const id = counter;
    const body: ITreeElement = {
      id,
      parentId,
      label,
      childIds: [],
      relativeRatio: 1 / 3,
      immediateRatio: Math.pow(1 / 3, depth - depthInternal),
      totalRatio: Math.pow(1 / 3, depth - depthInternal - 1),
      hasCode: false
    };
    array.push(body);
    counter++;
    if (depthInternal > 0) {
      const leftId = generateTernaryTree_(
        depthInternal - 1,
        label + `/left${depthInternal - 1}`,
        id
      );
      const middleId = generateTernaryTree_(
        depthInternal - 1,
        label + `/middle${depthInternal - 1}`,
        id
      );
      const rightId = generateTernaryTree_(
        depthInternal - 1,
        label + `/right${depthInternal - 1}`,
        id
      );
      body.childIds.push(leftId, middleId, rightId);
    }
    return id;
  }

  generateTernaryTree_(depth - 1, rootLabel, undefined);
  return array;
}

storiesOf("PerfCallTree", module)
  .add("Empty", () => (
    <div style={commonWrapStyle}>
      <PerfCallTree treeMap={[]} />
    </div>
  ))
  .add("Binary tree", () => {
    const hasCode = boolean("has code", true);
    return (
      <div style={commonWrapStyle}>
        <PerfCallTree
          treeMap={generateBinaryTree(7, "Lcom/example/avalanche").map(x => ({
            ...x,
            hasCode
          }))}
          targetId={0}
          onSeeingCodeOf={action("see code of...")}
        />
      </div>
    );
  })
  .add("Ternary tree", () => {
    const hasCode = boolean("has code", true);
    return (
      <div style={commonWrapStyle}>
        <PerfCallTree
          treeMap={generateTernaryTree(7, "Lcom/example/avalanche").map(x => ({
            ...x,
            hasCode
          }))}
          targetId={0}
          onSeeingCodeOf={action("see code of...")}
        />
      </div>
    );
  });
