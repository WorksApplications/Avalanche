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

function generateBinaryTree(
  depth: number,
  rootLabel: string
): Map<string, ITreeElement> {
  const map = new Map<string, ITreeElement>();
  function generateBinaryTree_(
    depthInternal: number,
    label: string,
    parentId?: string
  ): void {
    const id = label;
    const body: ITreeElement = { id, parentId, label, childIds: [] };
    map.set(label, body);
    if (depthInternal > 0) {
      generateBinaryTree_(depthInternal - 1, label + "-l", id);
      generateBinaryTree_(depthInternal - 1, label + "-r", id);
      body.childIds.push(label + "-l", label + "-r");
    }
  }

  generateBinaryTree_(depth - 1, rootLabel, undefined);
  return map;
}

function generateTernaryTree(
  depth: number,
  rootLabel: string
): Map<string, ITreeElement> {
  const map = new Map<string, ITreeElement>();
  function generateTernaryTree_(
    depthInternal: number,
    label: string,
    parentId?: string
  ): void {
    const id = label;
    const body: ITreeElement = { id, parentId, label, childIds: [] };
    map.set(label, body);
    if (depthInternal > 1) {
      generateTernaryTree_(depthInternal - 1, label + "-l", id);
      generateTernaryTree_(depthInternal - 1, label + "-m", id);
      generateTernaryTree_(depthInternal - 1, label + "-r", id);
      body.childIds.push(label + "-l", label + "-m", label + "-r");
    }
  }

  generateTernaryTree_(depth - 1, rootLabel, undefined);
  return map;
}

storiesOf("PerfCallTree", module)
  .add("Empty", () => (
    <div style={commonWrapStyle}>
      <PerfCallTree
        treeMap={new Map<string, ITreeElement>()}
        onTargetChanged={action("Target is changed")}
      />
    </div>
  ))
  .add("Binary tree", () => (
    <div style={commonWrapStyle}>
      <PerfCallTree
        treeMap={generateBinaryTree(5, "e")}
        targetId={"e"}
        onTargetChanged={action("Target is changed")}
      />
    </div>
  ))
  .add("Ternary tree", () => (
    <div style={commonWrapStyle}>
      <PerfCallTree
        treeMap={generateTernaryTree(5, "e")}
        targetId={"e"}
        onTargetChanged={action("Target is changed")}
      />
    </div>
  ));
