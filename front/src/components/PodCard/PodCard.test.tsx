// tslint:disable-next-line:no-implicit-dependencies
import { shallow } from "enzyme";
import * as React from "react";
import PodCard, { IProperty as PodCardProperty } from "./PodCard";

const sel = (strings: TemplateStringsArray) => {
  if (strings.length === 1) {
    return `[data-test="${strings[0]}"]`;
  }
  throw new Error("Invalid argument");
};

const baseDateValue = Date.now();

const basicCardProps: PodCardProperty = {
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
};

describe("<PodCard />", () => {
  it("renders itself", () => {
    const context = shallow(<PodCard {...basicCardProps} />);
    expect(context.find(sel`root`).exists()).toBe(true);
  });

  it("renders save button when the user is not saving the snapshot", () => {
    const context = shallow(<PodCard {...basicCardProps} isSaving={false} />);
    expect(context.find(sel`save-button`).exists()).toBe(true);
    expect(context.find(sel`spinner`).exists()).toBe(false);
  });

  it("renders spinner when the user is saving the snapshot", () => {
    const context = shallow(<PodCard {...basicCardProps} isSaving={true} />);
    expect(context.find(sel`save-button`).exists()).toBe(false);
    expect(context.find(sel`spinner`).exists()).toBe(true);
  });

  describe("save button", () => {
    it("is click-able when the event handler is set and not saving", () => {
      const mockHandler = jest.fn();
      const context = shallow(
        <PodCard
          {...basicCardProps}
          isSaving={false}
          onSaveButtonClick={mockHandler}
        />
      );
      expect(context.find(sel`save-button-body`).simulate("click"));
      expect(mockHandler).toBeCalled();
    });

    it("is disabled when the event handler is not set", () => {
      const context = shallow(<PodCard {...basicCardProps} isSaving={false} />);
      expect(context.find(sel`save`).hasClass("disabled")).toBe(true);
    });

    it("is not click-able when saving", () => {
      const mockHandler = jest.fn();
      const context = shallow(
        <PodCard
          {...basicCardProps}
          isSaving={true}
          onSaveButtonClick={mockHandler}
        />
      );
      if (context.find(sel`save-button-body`).exists()) {
        context.find(sel`save-button-body`).simulate("click");
        expect(mockHandler).not.toHaveBeenCalled();
      }
    });
  });

  describe("snapshot list", () => {
    it("renders the list", () => {
      const context = shallow(<PodCard {...basicCardProps} />);
      expect(context.find(sel`info-root`).exists()).toBe(true);
      expect(context.find(sel`snapshot-area`).exists()).toBe(false);
      context.find(sel`info-root`).simulate("click");
      expect(context.find(sel`snapshot-area`).exists()).toBe(true);
    });

    it("renders empty list when no snapshot data after clicked", () => {
      const context = shallow(<PodCard {...basicCardProps} snapshots={[]} />);
      context.find(sel`info-root`).simulate("click");
      expect(context.find(sel`snapshot`).length).toBe(0);
      expect(context.find(sel`empty-message`).exists()).toBe(true);
    });

    it("renders list with 1 element when 1 snapshot datum", () => {
      const context = shallow(
        <PodCard
          {...basicCardProps}
          snapshots={[basicCardProps.snapshots[0]]}
        />
      );
      context.find(sel`info-root`).simulate("click");
      expect(context.find(sel`snapshot`).length).toBe(1);
      expect(context.find(sel`empty-message`).exists()).toBe(false);
    });

    it("renders list with 3 element when 3 snapshot data", () => {
      const context = shallow(
        <PodCard
          {...basicCardProps}
          snapshots={basicCardProps.snapshots.slice(0, 3)}
        />
      );
      context.find(sel`info-root`).simulate("click");
      expect(context.find(sel`snapshot`).length).toBe(3);
      expect(context.find(sel`empty-message`).exists()).toBe(false);
    });

    it("renders list with only newest 3 element when 4+ snapshot data", () => {
      const context = shallow(
        <PodCard {...basicCardProps} snapshots={basicCardProps.snapshots} />
      );
      context.find(sel`info-root`).simulate("click");
      expect(context.find(sel`snapshot`).length).toBe(3);
      expect(context.find(sel`empty-message`).exists()).toBe(false);
      expect(
        new Date(
          context
            .find(sel`snapshot`)
            .first()
            .find(sel`snapshot-date`)
            .text()
        ).valueOf()
      ).toBe(Math.floor((baseDateValue + 10000) / 1000) * 1000); // since millisecond is missing
      expect(
        new Date(
          context
            .find(sel`snapshot`)
            .last()
            .find(sel`snapshot-date`)
            .text()
        ).valueOf()
      ).toBe(Math.floor((baseDateValue + 6000) / 1000) * 1000); // since millisecond is missing
    });
  });
});
