// tslint:disable:no-implicit-dependencies
import { configure } from "enzyme";
import * as EnzymeAdapter from "enzyme-adapter-react-16";
import "jest-enzyme";
configure({ adapter: new EnzymeAdapter() });
