// tslint:disable:no-submodule-imports no-implicit-dependencies
import "jest-dom/extend-expect";
import * as React from "react";
import { fireEvent, render, within } from "react-testing-library";
import "react-testing-library/cleanup-after-each";
import { IProperty as PodCardProperty, PodCard } from "./PodCard";

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
    const { getByTestId } = render(<PodCard {...basicCardProps} />);
    expect(getByTestId("root")).not.toBeNull();
  });

  it("renders save button when the user is not saving the snapshot", () => {
    const { queryByTestId } = render(
      <PodCard {...basicCardProps} isSaving={false} />
    );
    expect(queryByTestId("save-button")).not.toBeNull();
    expect(queryByTestId("spinner")).toBeNull();
  });

  it("renders spinner when the user is saving the snapshot", () => {
    const { queryByTestId } = render(
      <PodCard {...basicCardProps} isSaving={true} />
    );
    expect(queryByTestId("save-button")).toBeNull();
    expect(queryByTestId("spinner")).not.toBeNull();
  });

  describe("save button", () => {
    it("is click-able when the event handler is set and not saving", () => {
      const mockHandler = jest.fn();
      const { getByTestId } = render(
        <PodCard
          {...basicCardProps}
          isSaving={false}
          onSaveButtonClick={mockHandler}
        />
      );
      fireEvent.click(getByTestId("save-button-body"));
      expect(mockHandler).toBeCalled();
    });

    it("is disabled when the event handler is not set", () => {
      const { getByTestId } = render(
        <PodCard {...basicCardProps} isSaving={false} />
      );
      expect(getByTestId("save")).toHaveClass("disabled");
    });

    it("is not click-able when saving", () => {
      const mockHandler = jest.fn();
      const { queryByTestId } = render(
        <PodCard
          {...basicCardProps}
          isSaving={true}
          onSaveButtonClick={mockHandler}
        />
      );
      if (queryByTestId("save-button-body")) {
        fireEvent.click(queryByTestId("save-button-body"));
      }
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe("snapshot list", () => {
    it("renders the list", () => {
      const { queryByTestId } = render(<PodCard {...basicCardProps} />);
      expect(queryByTestId("info-root")).not.toBeNull();
      expect(queryByTestId("snapshot-area")).toBeNull();
      fireEvent.click(queryByTestId("info-root"));
      expect(queryByTestId("snapshot-area")).not.toBeNull();
    });

    it("renders empty list when no snapshot data after clicked", () => {
      const { queryAllByTestId, queryByTestId } = render(
        <PodCard {...basicCardProps} snapshots={[]} />
      );
      fireEvent.click(queryByTestId("info-root"));
      expect(queryAllByTestId("snapshot")).toHaveLength(0);
      expect(queryByTestId("empty-message")).not.toBeNull();
    });

    it("renders list with 1 element when 1 snapshot datum", () => {
      const { getAllByTestId, queryByTestId } = render(
        <PodCard
          {...basicCardProps}
          snapshots={[basicCardProps.snapshots[0]]}
        />
      );
      fireEvent.click(queryByTestId("info-root"));
      expect(getAllByTestId("snapshot")).toHaveLength(1);
      expect(queryByTestId("empty-message")).toBeNull();
    });

    it("renders list with 3 element when 3 snapshot data", () => {
      const { getAllByTestId, queryByTestId } = render(
        <PodCard
          {...basicCardProps}
          snapshots={basicCardProps.snapshots.slice(0, 3)}
        />
      );
      fireEvent.click(queryByTestId("info-root"));
      expect(getAllByTestId("snapshot")).toHaveLength(3);
      expect(queryByTestId("empty-message")).toBeNull();
    });

    it("renders list with only newest 3 element when 4+ snapshot data", () => {
      const { getAllByTestId, queryByTestId } = render(
        <PodCard {...basicCardProps} snapshots={basicCardProps.snapshots} />
      );
      fireEvent.click(queryByTestId("info-root"));
      const snapshotElements = getAllByTestId("snapshot");
      expect(snapshotElements).toHaveLength(3);
      expect(queryByTestId("empty-message")).toBeNull();

      expect(
        new Date(
          within(snapshotElements[0]).getByTestId("snapshot-date").textContent!
        ).valueOf()
      ).toBe(Math.floor((baseDateValue + 10000) / 1000) * 1000); // since millisecond is missing
      expect(
        new Date(
          within(snapshotElements[snapshotElements.length - 1]).getByTestId(
            "snapshot-date"
          ).textContent!
        ).valueOf()
      ).toBe(Math.floor((baseDateValue + 6000) / 1000) * 1000); // since millisecond is missing
    });

    describe("renders ordered list (the newest should be displayed on the top)", () => {
      it("when ordered data", () => {
        const { getAllByTestId, getByTestId } = render(
          <PodCard
            {...basicCardProps}
            snapshots={basicCardProps.snapshots.slice(0, 3)}
          />
        );
        fireEvent.click(getByTestId("info-root"));
        const snapshotElements = getAllByTestId("snapshot");
        expect(
          new Date(
            within(snapshotElements[0]).getByTestId(
              "snapshot-date"
            ).textContent!
          ).valueOf()
        ).toBeGreaterThan(
          new Date(
            within(snapshotElements[snapshotElements.length - 1]).getByTestId(
              "snapshot-date"
            ).textContent!
          ).valueOf()
        );
      });

      it("when reversed data", () => {
        const { getAllByTestId, getByTestId } = render(
          <PodCard
            {...basicCardProps}
            snapshots={basicCardProps.snapshots.slice(0, 3).reverse()}
          />
        );
        fireEvent.click(getByTestId("info-root"));
        const snapshotElements = getAllByTestId("snapshot");
        expect(
          new Date(
            within(snapshotElements[0]).getByTestId(
              "snapshot-date"
            ).textContent!
          ).valueOf()
        ).toBeGreaterThan(
          new Date(
            within(snapshotElements[snapshotElements.length - 1]).getByTestId(
              "snapshot-date"
            ).textContent!
          ).valueOf()
        );
      });
    });
  });
});
