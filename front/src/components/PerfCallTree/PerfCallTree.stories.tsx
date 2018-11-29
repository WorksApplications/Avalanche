// tslint:disable:no-implicit-dependencies no-submodule-imports
import * as React from "react";

import { action } from "@storybook/addon-actions";
import { storiesOf } from "@storybook/react";
import PerfCallTree, { ITreeElement } from "./PerfCallTree";

const commonWrapStyle: React.CSSProperties = {
  width: "1400px",
  padding: "8px",
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
      immediateRatio: Math.pow(1 / 2, depth - depthInternal),
      totalRatio: Math.pow(1 / 2, depth - depthInternal - 1)
    };
    array.push(body);
    counter++;
    if (depthInternal > 0) {
      const leftId = generateBinaryTree_(
        depthInternal - 1,
        label + "/left",
        id
      );
      const rightId = generateBinaryTree_(
        depthInternal - 1,
        label + "/right",
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
      immediateRatio: Math.pow(1 / 3, depth - depthInternal),
      totalRatio: Math.pow(1 / 3, depth - depthInternal - 1)
    };
    array.push(body);
    counter++;
    if (depthInternal > 0) {
      const leftId = generateTernaryTree_(
        depthInternal - 1,
        label + "/left",
        id
      );
      const middleId = generateTernaryTree_(
        depthInternal - 1,
        label + "/middle",
        id
      );
      const rightId = generateTernaryTree_(
        depthInternal - 1,
        label + "/right",
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
      <PerfCallTree
        treeMap={[]}
        onTargetChanged={action("Target is changed")}
      />
    </div>
  ))
  .add("Binary tree", () => (
    <div style={commonWrapStyle}>
      <PerfCallTree
        treeMap={generateBinaryTree(7, "Lcom/example/avalanche")}
        targetId={0}
        onTargetChanged={action("Target is changed")}
      />
    </div>
  ))
  .add("Ternary tree", () => (
    <div style={commonWrapStyle}>
      <PerfCallTree
        treeMap={generateTernaryTree(7, "Lcom/example/avalanche")}
        targetId={0}
        onTargetChanged={action("Target is changed")}
      />
    </div>
  ));
