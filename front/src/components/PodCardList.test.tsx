// tslint:disable-next-line:no-implicit-dependencies
import { shallow } from "enzyme";
import * as React from "react";
import PodCardList, { IProperty as PodCardListProperty } from "./PodCardList";

const sel = (strings: TemplateStringsArray) => {
  if (strings.length === 1) {
    return `[data-test="${strings[0]}"]`;
  }
  throw new Error("Invalid argument");
};

const baseDateValue = Date.now();

const basicListProps: PodCardListProperty = {
  kind: "all",
  data: [
    {
      id: "ess-765c6ccfcd-9hrsv",
      isAlive: true,
      isSaving: false,
      app: "ess",
      environment: "jillk",
      name: "ess-765c6ccfcd-9hrsv",
      createdAt: new Date(baseDateValue),
      // upper data is newer
      snapshots: [
        {
          uuid: "d7eec7c1-daf5-4198-9503-6957aea0bf90",
          createdAt: new Date(baseDateValue + 10000),
          link:
            "http://flamescope.internal.worksap.com/#/heatmap/collabo-bd6dc859c-f7dfm%2Fa0%2Fd7eec7c1-daf5-4198-9503-6957aea0bf90"
        },
        {
          uuid: "e7eec7c1-daf5-4198-9503-6957aea0bf90",
          createdAt: new Date(baseDateValue + 8000),
          link:
            "http://flamescope.internal.worksap.com/#/heatmap/collabo-bd6dc859c-f7dfm%2Fa0%2Fe7eec7c1-daf5-4198-9503-6957aea0bf90"
        },
        {
          uuid: "f7eec7c1-daf5-4198-9503-6957aea0bf90",
          createdAt: new Date(baseDateValue + 6000),
          link:
            "http://flamescope.internal.worksap.com/#/heatmap/collabo-bd6dc859c-f7dfm%2Fa0%2Ff7eec7c1-daf5-4198-9503-6957aea0bf90"
        },
        {
          uuid: "g7eec7c1-daf5-4198-9503-6957aea0bf90",
          createdAt: new Date(baseDateValue + 4000),
          link:
            "http://flamescope.internal.worksap.com/#/heatmap/collabo-bd6dc859c-f7dfm%2Fa0%2Fg7eec7c1-daf5-4198-9503-6957aea0bf90"
        }
      ],
      onSaveButtonClick: undefined
    }
  ]
};

describe("<PodCardList />", () => {
  it("renders itself", () => {
    const context = shallow(<PodCardList {...basicListProps} />);
    expect(context.find(sel`root`).exists()).toBe(true);
  });

  it("renders list if there are card data", () => {
    const context = shallow(<PodCardList {...basicListProps} />);
    expect(context.find(sel`card-list`).exists()).toBe(true);
    expect(context.find(sel`empty-message`).exists()).toBe(false);
  });

  it("renders empty message if there are no card data", () => {
    const context = shallow(<PodCardList {...basicListProps} data={[]} />);
    expect(context.find(sel`card-list`).exists()).toBe(false);
    expect(context.find(sel`empty-message`).exists()).toBe(true);
  });
});
