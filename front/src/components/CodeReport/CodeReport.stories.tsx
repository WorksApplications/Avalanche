// tslint:disable:no-implicit-dependencies no-submodule-imports
import * as React from "react";

import { withKnobs } from "@storybook/addon-knobs";
import { storiesOf } from "@storybook/react";
import "../../App.scss";
import CodeReport from "./CodeReport";

const commonWrapStyle: React.CSSProperties = {
  display: "flex",
  width: "1200px",
  padding: "8px",
  backgroundColor: "#ffffff",
  justifyContent: "center",
  alignContent: "center"
};

// from https://en.wikibooks.org/wiki/Computer_Programming/Hello_world
const javaHelloWorld = `class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, world!");
    }
}`;

// from https://github.com/spring-projects/spring-boot/blob/master/spring-boot-samples/spring-boot-sample-webflux/src/main/java/sample/webflux/ExampleController.java
const javaSpringBoot = `package sample.webflux;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ExampleController {

    @PostMapping(path = "/", consumes = { MediaType.APPLICATION_JSON_VALUE,
            "!application/xml" }, produces = MediaType.TEXT_PLAIN_VALUE, headers = "X-Custom=Foo", params = "a!=alpha")
    public String example() {
        return "Hello World";
    }

}`;

storiesOf("CodeReport", module)
  .addDecorator(withKnobs)
  .add("Hello World", () => (
    <div style={commonWrapStyle}>
      <CodeReport
        title={"HelloWorld.java"}
        lines={javaHelloWorld.split("\n").map(x => [x])}
      />
    </div>
  ))
  .add("Spring Boot (with link)", () => (
    <div style={commonWrapStyle}>
      <CodeReport
        title={"ExampleController.java"}
        lines={javaSpringBoot.split("\n").map(x => [x])}
        firstLine={17}
        link={
          "https://github.com/spring-projects/spring-boot/blob/master/spring-boot-samples/spring-boot-sample-webflux/src/main/java/sample/webflux/ExampleController.java"
        }
      />
    </div>
  ));
